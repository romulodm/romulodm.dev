/**
 * onchain.worker.ts
 *
 * Reprocessa doações on-chain que ficaram com amountBrl = 0,
 * o que acontece quando o browser fecha antes do POST /api/donations/onchain/register
 * terminar a verificação.
 *
 * Fluxo:
 *   scheduleOnchainRetry() → registra repeatable job no QUEUE_NOTIFICATIONS
 *       ↓  (a cada 5 min, via BullMQ)
 *   retryPendingOnchain()  → busca registros com amountBrl = 0
 *                          → verifica receipt on-chain
 *                          → atualiza amountBrl no banco
 */

import { createPublicClient, http } from 'viem'
import { arbitrum, polygon, base } from 'viem/chains'
import type { Redis } from 'ioredis'
import { prisma } from '@romulo/database'
import {
    createQueue,
    QUEUE_NOTIFICATIONS,
    RETRY_ONCHAIN_JOB_NAME,
    notificationJobOptions,
    buildNotificationJobId,
    queueRuntimeConfig,
    type NotificationJob,
} from '@romulo/queues'
import {
    getPrices,
    amountToBrl,
    getRpcUrl,
    type NetworkKey,
    type TokenKey,
} from '@romulo/web3'
import { logWorkerEvent } from '../lib/worker-observability'

// ── Chains ────────────────────────────────────────────────────────────────────

const CHAINS = { arbitrum, polygon, base } as const

// ── Core logic ────────────────────────────────────────────────────────────────

/**
 * Busca até 20 doações não resolvidas e tenta obter o receipt on-chain.
 * Se confirmado, calcula o amountBrl e persiste.
 * Idempotente — pode rodar várias vezes sem efeito colateral.
 */
export async function retryPendingOnchain(): Promise<void> {
    const pending = await prisma.onChainDonation.findMany({
        where: { amountBrl: 0 },
        take: 20,
        orderBy: { createdAt: 'asc' },
    })

    if (pending.length === 0) return

    logWorkerEvent('info', 'onchain.retry_pending', { count: pending.length })

    for (const donation of pending) {
        try {
            const network = donation.network as NetworkKey
            const chain = CHAINS[network]

            if (!chain) {
                logWorkerEvent('warn', 'onchain.unknown_network', { id: donation.id, network })
                continue
            }

            const client = createPublicClient({
                chain: chain as any,
                transport: http(getRpcUrl(network)),
            })

            const receipt = await client
                .getTransactionReceipt({ hash: donation.txHash as `0x${string}` })
                .catch(() => null)

            // Tx ainda pendente ou falhou — será tentada no próximo ciclo
            if (!receipt || receipt.status !== 'success') continue

            const prices = await getPrices()
            const amountBrl = amountToBrl(
                BigInt(donation.rawAmount),
                donation.token as TokenKey,
                prices,
            )

            await prisma.onChainDonation.update({
                where: { id: donation.id },
                data: { amountBrl },
            })

            logWorkerEvent('info', 'onchain.retried', {
                id: donation.id, network, token: donation.token, amountBrl,
            })

        } catch (err) {
            logWorkerEvent('warn', 'onchain.retry_failed', {
                id: donation.id,
                error: err instanceof Error ? err.message : String(err),
            })
        }
    }
}

// ── Scheduling ────────────────────────────────────────────────────────────────

/**
 * Registra o repeatable job no QUEUE_NOTIFICATIONS.
 * Idempotente — se já existir, não duplica.
 * Fecha a queue temporária após registrar (mesmo padrão do scheduleViewsFlush).
 */
export async function scheduleOnchainRetry(redis: Redis): Promise<void> {
    const queue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
        defaultJobOptions: {
            ...notificationJobOptions,
            attempts: 3,
            removeOnComplete: { count: 10 },
            removeOnFail: { age: 24 * 3600 },
        },
    })

    try {
        const existing = await queue.getRepeatableJobs()
        if (existing.some(j => j.name === RETRY_ONCHAIN_JOB_NAME)) {
            console.log('[OnchainRetry] Repeatable job já registrado — skipping.')
            return
        }

        await queue.add(
            RETRY_ONCHAIN_JOB_NAME,
            { type: 'retry-onchain' },
            {
                ...notificationJobOptions,
                attempts: 3,
                jobId: buildNotificationJobId({ type: 'retry-onchain' }),
                repeat: { every: queueRuntimeConfig.onchainRetryIntervalMs },
            },
        )

        console.log(
            `[OnchainRetry] Job registrado — intervalo: ${queueRuntimeConfig.onchainRetryIntervalMs} ms.`,
        )
    } finally {
        await queue.close()
    }
}