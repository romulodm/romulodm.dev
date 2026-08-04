import type { JobsOptions, RepeatableJob, RepeatOptions } from "bullmq";

/**
 * scheduling.ts
 *
 * Registro de job repetivel — uma implementacao para os cinco crons do worker.
 *
 * Existia uma copia deste bloco em cada worker (daily-status, flush-views,
 * retry-onchain, reconcile-donations, audit-donations), e as cinco carregavam
 * os mesmos dois defeitos:
 *
 *   1. `jobId` de topo no `queue.add()` com `repeat` e ignorado. A chave do
 *      repeatable no BullMQ 5 e montada em `getRepeatConcatOptions` como
 *      `${name}:${repeat.jobId}:${endDate}:${tz}:${pattern ?? every}` — o
 *      `opts.jobId` nao entra na conta. Passar `buildNotificationJobId(...)`
 *      ali nunca teve efeito nenhum.
 *
 *   2. O guard `existing.some(j => j.name === NAME)` congelava o agendamento.
 *      Como o intervalo compoe a chave, mudar `every`/`pattern` deveria gerar
 *      uma entrada nova — mas o guard cortava antes de chegar la. Resultado:
 *      alterar a env do intervalo nao surtia efeito ate alguem limpar o
 *      repeatable do Redis na mao.
 *
 * O `queue.add()` com `repeat` ja e idempotente por si (`updateRepeatableJob`
 * roda com `override: true`), entao o guard nunca protegeu de duplicata. O que
 * de fato precisa de cuidado e o inverso: remover as chaves antigas do mesmo
 * job quando a configuracao muda, senao o cron velho continua disparando em
 * paralelo com o novo.
 */

/**
 * So o que este helper usa da `Queue`. Estrutural de proposito: os genericos de
 * `Queue` do BullMQ nao resolvem `NameType` quando o tipo de dado ainda e uma
 * variavel de tipo, e nao vale a pena espalhar cast por causa disso.
 */
export interface SchedulableQueue<T> {
    getRepeatableJobs(start?: number, end?: number, asc?: boolean): Promise<RepeatableJob[]>;
    removeRepeatableByKey(key: string): Promise<boolean>;
    add(name: string, data: T, opts?: JobsOptions): Promise<unknown>;
}

export interface RegisterRepeatableOptions<T> {
    /** Nome do job — precisa bater com o `job.name` que o worker consome. */
    name: string;
    data: T;
    repeat: RepeatOptions;
    jobOptions?: JobsOptions;
}

export type RegisterRepeatableResult =
    | { action: "created" }
    /** Config mudou: as chaves antigas foram removidas e a nova registrada. */
    | { action: "rescheduled"; removedKeys: string[] }
    | { action: "unchanged" };

function sameSchedule(
    existing: { pattern?: string | null; every?: string | number | null; tz?: string | null },
    desired: RepeatOptions,
): boolean {
    const desiredEvery = desired.every === undefined ? null : String(desired.every);
    const existingEvery = existing.every === undefined || existing.every === null
        ? null
        : String(existing.every);

    return (
        (existing.pattern ?? null) === (desired.pattern ?? null) &&
        existingEvery === desiredEvery &&
        (existing.tz ?? null) === (desired.tz ?? null)
    );
}

/**
 * Registra (ou reagenda) um job repetivel.
 *
 * Idempotente de verdade: rodar a cada boot do worker nao acumula entradas, e
 * mudar o intervalo por env passa a valer no proximo restart.
 *
 * Nao fecha a fila — quem chama decide, porque alguns workers reaproveitam a
 * mesma instancia em runtime e outros usam uma fila descartavel so pro registro.
 */
export async function registerRepeatable<T>(
    queue: SchedulableQueue<T>,
    { name, data, repeat, jobOptions }: RegisterRepeatableOptions<T>,
): Promise<RegisterRepeatableResult> {
    const existing = await queue.getRepeatableJobs();
    const mine = existing.filter((job) => job.name === name);

    const upToDate = mine.some((job) => sameSchedule(job, repeat));
    const stale = mine.filter((job) => !sameSchedule(job, repeat));

    for (const job of stale) {
        await queue.removeRepeatableByKey(job.key);
    }

    const removedKeys = stale.map((job) => job.key);

    // Ja registrado com a config atual: nao reescreve. Cobre o caso em que o
    // boot anterior deixou uma entrada obsoleta ao lado da correta — a obsoleta
    // sai acima, a boa fica como esta.
    if (upToDate) {
        return removedKeys.length > 0
            ? { action: "rescheduled", removedKeys }
            : { action: "unchanged" };
    }

    await queue.add(name, data, { ...jobOptions, repeat });

    return removedKeys.length > 0
        ? { action: "rescheduled", removedKeys }
        : { action: "created" };
}
