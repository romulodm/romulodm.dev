import Stripe from 'stripe'
import type { Redis } from 'ioredis'

import {
    prisma,
    markDonationCompleted,
    markDonationExpired,
    needsAttention,
    describeOutcome,
    type SettlementOutcome,
} from '@romulo/database'
import {
    createQueue,
    registerRepeatable,
    QUEUE_NOTIFICATIONS,
    RECONCILE_DONATIONS_JOB_NAME,
    AUDIT_DONATIONS_JOB_NAME,
    notificationJobOptions,
    queueRuntimeConfig,
    type NotificationJob,
} from '@romulo/queues'

import { logWorkerEvent } from '../lib/worker-observability'
import { sendWorkerAlert } from '../lib/alerts'

// ── Clientes dos provedores ───────────────────────────────────────────────────

const ABACATE_BASE = 'https://api.abacatepay.com/v1'

/**
 * Marcador gravado em `metadata` na criacao do PaymentIntent
 * (portfolio/app/api/donations/stripe/create-intent). A auditoria depende dele
 * para separar doacao do resto do trafego da conta Stripe.
 */
const STRIPE_DONATION_MARKER = 'donation'

let stripeClient: Stripe | null = null

function getStripe(): Stripe | null {
    if (!process.env.STRIPE_SECRET_KEY) return null
    if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
    return stripeClient
}

function isDonationIntent(intent: Stripe.PaymentIntent): boolean {
    return intent.metadata?.kind === STRIPE_DONATION_MARKER
}

type AbacateStatus = 'PENDING' | 'PAID' | 'EXPIRED'

/**
 * Resultado da consulta ao provedor.
 *
 * A versao anterior devolvia `null` para tudo — timeout, 500, 404 e payload
 * estranho caiam no mesmo balde e viravam no-op silencioso. Com a API do
 * AbacatePay fora do ar o dia inteiro o resumo fechava `{ scanned: 25,
 * errors: 0 }`, ou seja, o log dizia que estava tudo bem.
 */
type AbacateProbe =
    | { kind: 'status'; status: AbacateStatus }
    /** O provedor respondeu que a cobranca nao existe — divergencia real. */
    | { kind: 'not_found' }
    /** Nao deu para saber: rede, timeout, 5xx, payload fora do contrato. */
    | { kind: 'unavailable'; reason: string }

async function checkAbacateCharge(pixId: string): Promise<AbacateProbe> {
    if (!process.env.ABACATE_PAY_API_KEY) {
        return { kind: 'unavailable', reason: 'ABACATE_PAY_API_KEY ausente' }
    }

    let res: Response
    try {
        res = await fetch(`${ABACATE_BASE}/pixQrCode/check?id=${encodeURIComponent(pixId)}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.ABACATE_PAY_API_KEY}`,
            },
            // Sem isto uma conexao pendurada segura o loop inteiro — e o lock do
            // job no BullMQ e de 30s, entao o job vira stalled e reprocessa.
            signal: AbortSignal.timeout(queueRuntimeConfig.donationsProviderTimeoutMs),
        })
    } catch (err) {
        return {
            kind: 'unavailable',
            reason: err instanceof Error ? err.message : String(err),
        }
    }

    if (res.status === 404) return { kind: 'not_found' }
    if (!res.ok) return { kind: 'unavailable', reason: `HTTP ${res.status}` }

    let json: { data?: { status?: string }; error?: string | null }
    try {
        json = (await res.json()) as typeof json
    } catch (err) {
        return { kind: 'unavailable', reason: err instanceof Error ? err.message : 'json invalido' }
    }

    if (json.error) return { kind: 'unavailable', reason: json.error }

    const status = json.data?.status
    if (status === 'PAID' || status === 'EXPIRED' || status === 'PENDING') {
        return { kind: 'status', status }
    }

    return { kind: 'unavailable', reason: `status fora do contrato: ${String(status)}` }
}

// ── Reconciliacao ─────────────────────────────────────────────────────────────

interface ReconcileSummary {
    scanned: number
    /** Promovidas aqui = pagamentos que o webhook perdeu. */
    recovered: number
    expired: number
    /** Divergencias que precisam de olho humano. */
    flagged: number
    /** Excecao no meio do processamento de uma doacao. */
    errors: number
    /** Provedor nao respondeu — nao e erro nosso, mas tambem nao e sucesso. */
    unknown: number
    /** Linha sem id de cobranca: nao ha o que consultar. */
    skipped: number
}

/**
 * Varre doacoes PENDING recentes e pergunta ao provedor o que aconteceu.
 *
 * A janela existe por dois motivos: cobranca antiga nao vai mudar de estado
 * sozinha, e sem limite a varredura cresceria indefinidamente. Fora da janela o
 * QR ja expirou de qualquer forma.
 *
 * Idempotente: `markDonationCompleted` e `markDonationExpired` filtram por
 * status, entao rodar duas vezes nao gera efeito duplicado.
 */
export async function reconcilePendingDonations(): Promise<ReconcileSummary> {
    const summary: ReconcileSummary = {
        scanned: 0,
        recovered: 0,
        expired: 0,
        flagged: 0,
        errors: 0,
        unknown: 0,
        skipped: 0,
    }

    const windowStart = new Date()
    windowStart.setDate(windowStart.getDate() - queueRuntimeConfig.donationsReconcileWindowDays)

    const batchSize = queueRuntimeConfig.donationsReconcileBatchSize

    const pending = await prisma.donation.findMany({
        where: {
            status: 'PENDING',
            createdAt: { gte: windowStart },
            provider: { in: ['PIX', 'STRIPE'] },
        },
        orderBy: { createdAt: 'asc' },
        take: batchSize,
        select: {
            id: true,
            provider: true,
            amount: true,
            createdAt: true,
            abacatePayChargeId: true,
            stripePaymentIntentId: true,
        },
    })

    if (pending.length === 0) return summary
    summary.scanned = pending.length

    logWorkerEvent('info', 'donations.reconcile_start', { count: pending.length })

    // O cliente nao muda entre as doacoes — instanciar dentro do loop so
    // escondia o caso "Stripe nao configurado" atras de um `continue` por linha.
    const stripe = getStripe()
    const flagged: string[] = []

    for (const donation of pending) {
        try {
            let outcome: SettlementOutcome | null = null
            let expiredNow = false

            if (donation.provider === 'PIX') {
                if (!donation.abacatePayChargeId) {
                    // Cobranca criada sem id do provedor: o create falhou entre o
                    // insert e o retorno da API. Nao ha o que consultar.
                    summary.skipped += 1
                    logWorkerEvent('warn', 'donations.reconcile_missing_charge_id', {
                        id: donation.id,
                    })
                    continue
                }

                const probe = await checkAbacateCharge(donation.abacatePayChargeId)

                if (probe.kind === 'unavailable') {
                    summary.unknown += 1
                    logWorkerEvent('warn', 'donations.reconcile_provider_unavailable', {
                        id: donation.id,
                        provider: 'PIX',
                        reason: probe.reason,
                    })
                    continue
                }

                if (probe.kind === 'not_found') {
                    // Temos id de cobranca que o provedor nao reconhece. Nao da
                    // para decidir sozinho — mas nao pode passar em silencio.
                    summary.flagged += 1
                    flagged.push(
                        `doacao ${donation.id}: cobranca ${donation.abacatePayChargeId} nao existe no AbacatePay`,
                    )
                    logWorkerEvent('warn', 'donations.reconcile_charge_not_found', {
                        id: donation.id,
                        chargeId: donation.abacatePayChargeId,
                    })
                    continue
                }

                if (probe.status === 'PAID') {
                    outcome = await markDonationCompleted({
                        ref: { by: 'id', id: donation.id },
                        abacatePayChargeId: donation.abacatePayChargeId,
                    })
                } else if (probe.status === 'EXPIRED') {
                    expiredNow =
                        (await markDonationExpired({ by: 'id', id: donation.id })) === 'expired'
                }
            } else if (donation.provider === 'STRIPE') {
                if (!stripe || !donation.stripePaymentIntentId) {
                    summary.skipped += 1
                    continue
                }

                const intent = await stripe.paymentIntents
                    .retrieve(donation.stripePaymentIntentId)
                    .catch((err: unknown) => {
                        summary.unknown += 1
                        logWorkerEvent('warn', 'donations.reconcile_provider_unavailable', {
                            id: donation.id,
                            provider: 'STRIPE',
                            reason: err instanceof Error ? err.message : String(err),
                        })
                        return null
                    })

                if (!intent) continue

                if (intent.status === 'succeeded') {
                    outcome = await markDonationCompleted({
                        ref: { by: 'id', id: donation.id },
                        paidAmount:
                            typeof intent.amount_received === 'number'
                                ? intent.amount_received
                                : undefined,
                    })
                } else if (intent.status === 'canceled') {
                    expiredNow =
                        (await markDonationExpired({ by: 'id', id: donation.id })) === 'expired'
                }
            }

            if (expiredNow) summary.expired += 1

            if (outcome) {
                if (needsAttention(outcome)) {
                    summary.flagged += 1
                    flagged.push(describeOutcome(outcome))
                    logWorkerEvent('warn', 'donations.reconcile_flagged', {
                        id: donation.id,
                        provider: donation.provider,
                        outcome: outcome.kind,
                    })
                } else if (outcome.kind === 'completed') {
                    summary.recovered += 1
                    logWorkerEvent('info', 'donations.reconcile_recovered', {
                        id: donation.id,
                        provider: donation.provider,
                        amount: donation.amount,
                        // Quanto tempo ficou perdida — mede o atraso que o
                        // doador sentiu por causa da falha de webhook.
                        pendingForMinutes: Math.round(
                            (Date.now() - donation.createdAt.getTime()) / 60000,
                        ),
                    })
                }
            }
        } catch (err) {
            summary.errors += 1
            logWorkerEvent('warn', 'donations.reconcile_failed', {
                id: donation.id,
                error: err instanceof Error ? err.message : String(err),
            })
        }
    }

    /*
     * Recuperar pagamento significa que o webhook nao chegou. Isso e um defeito
     * de integracao, nao operacao normal — vale alerta, senao o webhook pode
     * ficar quebrado por semanas com a reconciliacao mascarando o sintoma.
     */
    if (summary.recovered > 0) {
        await sendWorkerAlert({
            event: 'donations.webhook_missed',
            error: new Error(
                `Reconciliacao confirmou doacao(oes) que o webhook nao entregou ` +
                `(${summary.recovered} nesta passada). ` +
                `Verifique a configuracao de webhook do provedor.`,
            ),
            queue: QUEUE_NOTIFICATIONS,
        })
    }

    if (summary.flagged > 0) {
        await sendWorkerAlert({
            event: 'donations.reconcile_divergence',
            error: new Error(`Divergencias encontradas: ${flagged.slice(0, 3).join(' | ')}`),
            queue: QUEUE_NOTIFICATIONS,
        })
    }

    /*
     * Batch cheio com quase tudo indeterminado e o sintoma de fila entupida: a
     * consulta pega sempre as `batchSize` mais antigas, entao um punhado de
     * linhas presas no topo impede que as novas sejam olhadas ate sairem da
     * janela de dias. Vale saber antes de virar atraso pro doador.
     */
    if (pending.length === batchSize && summary.unknown + summary.skipped === pending.length) {
        logWorkerEvent('warn', 'donations.reconcile_batch_saturated', {
            batchSize,
            unknown: summary.unknown,
            skipped: summary.skipped,
        })
    }

    logWorkerEvent('info', 'donations.reconcile_done', { ...summary })
    return summary
}

// ── Auditoria contabil diaria ─────────────────────────────────────────────────

interface AuditSummary {
    /** Liquidado no Stripe e sem nenhuma linha local. O caso mais grave. */
    missingLocally: number
    /** Linha local existe mas nao esta COMPLETED apesar do dinheiro ter entrado. */
    notCompletedLocally: number
    /** COMPLETED no banco e sem contrapartida liquidada no provedor. */
    phantomLocally: number
    providerSettled: number
    localCompleted: number
    /**
     * Intents liquidados sem o marcador de doacao. Enquanto houver intent antigo
     * na janela (criado antes do deploy do marcador) isto fica > 0; depois
     * disso, > 0 significa que a conta Stripe tem outro trafego — o que e
     * legitimo, mas confirma que filtrar era necessario.
     */
    unmarkedSettled: number
}

/** Teto de paginacao — a auto-paginacao do Stripe nao tem limite proprio. */
const AUDIT_MAX_INTENTS = 1_000

/**
 * Offset do fuso, em ms, no instante dado. Positivo a leste de Greenwich.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
        .formatToParts(instant)
        .reduce<Record<string, string>>((acc, part) => {
            acc[part.type] = part.value
            return acc
        }, {})

    const asIfUtc = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour) % 24,
        Number(parts.minute),
        Number(parts.second),
    )

    return asIfUtc - instant.getTime()
}

/**
 * Limites do dia anterior no fuso informado.
 *
 * O container roda em UTC (nao ha TZ no Dockerfile nem no compose), entao
 * `setHours(0,0,0,0)` fechava o dia UTC — deslocado em 3h do dia que o cron das
 * 08:30 BRT pretende fechar. Toda doacao entre 21:00 e 00:00 BRT caia no dia
 * errado dos dois lados da conciliacao.
 *
 * O offset e amostrado uma vez no meio do dia alvo; para fuso sem horario de
 * verao (Brasil desde 2019) isso e exato, e na virada de DST o erro fica em uma
 * hora nas bordas — aceitavel para conciliacao diaria.
 */
function previousDayInZone(now: Date, timeZone: string): { start: Date; end: Date; label: string } {
    const roughOffset = zoneOffsetMs(now, timeZone)
    const wallNow = new Date(now.getTime() + roughOffset)

    const year = wallNow.getUTCFullYear()
    const month = wallNow.getUTCMonth()
    const day = wallNow.getUTCDate() - 1

    const noonWall = Date.UTC(year, month, day, 12, 0, 0, 0)
    const offset = zoneOffsetMs(new Date(noonWall - roughOffset), timeZone)

    const startWall = Date.UTC(year, month, day, 0, 0, 0, 0)
    const endWall = Date.UTC(year, month, day, 23, 59, 59, 999)

    return {
        start: new Date(startWall - offset),
        end: new Date(endWall - offset),
        label: new Date(startWall).toISOString().slice(0, 10),
    }
}

/**
 * Conciliacao de dois sentidos para o dia anterior.
 *
 * A reconciliacao por PENDING so encontra o que o banco sabe que existe. Se um
 * pagamento nunca virou linha local — o create falhou depois de cobrar — ele e
 * invisivel ali. Comparar o extrato do provedor com as linhas COMPLETED e o
 * unico jeito de achar esse caso.
 *
 * Hoje cobre Stripe, onde ha API de listagem por periodo. O AbacatePay nao expoe
 * listagem de cobrancas na integracao atual; enquanto nao expuser, o lado PIX
 * fica coberto apenas pela reconciliacao por PENDING.
 *
 * Os dois lados sao casados por id de intent, nao por data. Casar por data
 * comparava relogios diferentes (`intent.created` no Stripe contra
 * `donation.createdAt` no Postgres, e a linha local nasce depois do intent), o
 * que fabricava divergencia em toda doacao proxima da virada do dia.
 */
export async function auditDonations(): Promise<AuditSummary> {
    const summary: AuditSummary = {
        missingLocally: 0,
        notCompletedLocally: 0,
        phantomLocally: 0,
        providerSettled: 0,
        localCompleted: 0,
        unmarkedSettled: 0,
    }

    const stripe = getStripe()
    if (!stripe) {
        logWorkerEvent('info', 'donations.audit_skipped', { reason: 'stripe nao configurado' })
        return summary
    }

    const { start, end, label } = previousDayInZone(
        new Date(),
        queueRuntimeConfig.donationsAuditTimezone,
    )

    // ── Lado do provedor ──────────────────────────────────────────────────────
    const settled: { id: string; amount: number }[] = []
    try {
        let seen = 0
        for await (const intent of stripe.paymentIntents.list({
            created: {
                gte: Math.floor(start.getTime() / 1000),
                lte: Math.floor(end.getTime() / 1000),
            },
            limit: 100,
        })) {
            if (++seen > AUDIT_MAX_INTENTS) {
                logWorkerEvent('warn', 'donations.audit_truncated', { max: AUDIT_MAX_INTENTS })
                break
            }

            if (intent.status !== 'succeeded') continue

            // `paymentIntents.list` devolve tudo o que existe na conta, nao so
            // doacao. Sem este filtro qualquer outra cobranca do Stripe virava
            // "liquidada sem COMPLETED local" e o alerta viraria ruido diario.
            if (!isDonationIntent(intent)) {
                summary.unmarkedSettled += 1
                continue
            }

            settled.push({ id: intent.id, amount: intent.amount_received ?? intent.amount })
        }
    } catch (err) {
        logWorkerEvent('warn', 'donations.audit_provider_failed', {
            error: err instanceof Error ? err.message : String(err),
        })
        return summary
    }

    summary.providerSettled = settled.length

    // ── Provedor -> local (busca por id, sem filtro de data) ──────────────────
    const settledIds = settled.map((s) => s.id)

    const matched = settledIds.length
        ? await prisma.donation.findMany({
            where: { stripePaymentIntentId: { in: settledIds } },
            select: { id: true, status: true, stripePaymentIntentId: true, amount: true },
        })
        : []

    const localByIntent = new Map(
        matched.filter((d) => d.stripePaymentIntentId).map((d) => [d.stripePaymentIntentId!, d]),
    )

    const missing: string[] = []
    const notCompleted: string[] = []

    for (const intent of settled) {
        const match = localByIntent.get(intent.id)

        if (!match) {
            summary.missingLocally += 1
            missing.push(`${intent.id} (${intent.amount})`)
        } else if (match.status !== 'COMPLETED') {
            summary.notCompletedLocally += 1
            notCompleted.push(`${match.id} em ${match.status}`)
        }
    }

    // ── Local -> provedor ─────────────────────────────────────────────────────
    const localCompleted = await prisma.donation.findMany({
        where: {
            provider: 'STRIPE',
            status: 'COMPLETED',
            createdAt: { gte: start, lte: end },
        },
        select: { id: true, stripePaymentIntentId: true, amount: true },
    })

    summary.localCompleted = localCompleted.length

    const settledIdSet = new Set(settledIds)
    const phantom: string[] = []

    for (const donation of localCompleted) {
        if (!donation.stripePaymentIntentId) {
            // COMPLETED sem nenhum rastro de provedor: nao ha como confirmar.
            summary.phantomLocally += 1
            phantom.push(`${donation.id} (sem intent)`)
            continue
        }

        if (settledIdSet.has(donation.stripePaymentIntentId)) continue

        /*
         * Nao esta no extrato do dia — mas isso sozinho nao prova fantasma: o
         * intent pode ter sido criado minutos antes da virada, ou nao carregar o
         * marcador por ser anterior ao deploy. Antes de acusar, pergunta direto.
         * Sao poucos casos, entao o custo em chamada e desprezivel.
         */
        const intent = await stripe.paymentIntents
            .retrieve(donation.stripePaymentIntentId)
            .catch(() => null)

        if (intent?.status === 'succeeded') continue

        summary.phantomLocally += 1
        phantom.push(`${donation.id} (${intent ? intent.status : 'intent inexistente'})`)
    }

    logWorkerEvent('info', 'donations.audit_done', { ...summary, date: label })

    if (summary.missingLocally > 0 || summary.notCompletedLocally > 0 || summary.phantomLocally > 0) {
        await sendWorkerAlert({
            event: 'donations.audit_divergence',
            error: new Error(
                `Conciliacao de ${label}: ` +
                `${summary.missingLocally} liquidada(s) no Stripe sem linha local` +
                (missing.length ? ` [${missing.slice(0, 3).join(', ')}]` : '') +
                `; ${summary.notCompletedLocally} com linha local nao-COMPLETED` +
                (notCompleted.length ? ` [${notCompleted.slice(0, 3).join(', ')}]` : '') +
                `; ${summary.phantomLocally} COMPLETED local sem contrapartida` +
                (phantom.length ? ` [${phantom.slice(0, 3).join(', ')}]` : ''),
            ),
            queue: QUEUE_NOTIFICATIONS,
        })
    }

    return summary
}

// ── Agendamento ───────────────────────────────────────────────────────────────

/**
 * Registra o job repetivel de reconciliacao.
 *
 * A idempotencia e o reagendamento ficam em `registerRepeatable` — ver os dois
 * defeitos que o helper documenta, que estavam replicados aqui.
 */
export async function scheduleDonationsReconcile(redis: Redis): Promise<void> {
    const queue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
        defaultJobOptions: {
            ...notificationJobOptions,
            attempts: 3,
            removeOnComplete: { count: 20 },
            removeOnFail: { age: 24 * 3600 },
        },
    })

    try {
        const result = await registerRepeatable(queue, {
            name: RECONCILE_DONATIONS_JOB_NAME,
            data: { type: 'reconcile-donations' },
            repeat: { every: queueRuntimeConfig.donationsReconcileIntervalMs },
            jobOptions: { ...notificationJobOptions, attempts: 3 },
        })

        logWorkerEvent('info', 'donations.reconcile_scheduled', {
            action: result.action,
            everyMs: queueRuntimeConfig.donationsReconcileIntervalMs,
        })
    } finally {
        await queue.close()
    }
}

/** Auditoria contabil: uma vez por dia, depois do fechamento do dia anterior. */
export async function scheduleDonationsAudit(redis: Redis): Promise<void> {
    const queue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
        defaultJobOptions: notificationJobOptions,
    })

    try {
        const result = await registerRepeatable(queue, {
            name: AUDIT_DONATIONS_JOB_NAME,
            data: { type: 'audit-donations' },
            repeat: { pattern: '30 8 * * *', tz: queueRuntimeConfig.donationsAuditTimezone },
            jobOptions: notificationJobOptions,
        })

        logWorkerEvent('info', 'donations.audit_scheduled', {
            action: result.action,
            pattern: '30 8 * * *',
            tz: queueRuntimeConfig.donationsAuditTimezone,
        })
    } finally {
        await queue.close()
    }
}
