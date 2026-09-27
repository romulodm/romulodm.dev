import "server-only";

import { getRedis } from "@/lib/redis";

/**
 * Cache de leitura em duas camadas, com dedupe de recálculo.
 *
 *   L1 — memória do processo. Zero I/O. É o que resolve o caso real aqui,
 *        já que a aplicação roda num container só.
 *   L2 — Redis. Sobrevive a restart e serve outras instâncias, se um dia
 *        houver mais de uma.
 *
 * As duas propriedades que importam:
 *
 * - single-flight: quando o valor expira, uma rajada de requests dispara UM
 *   recálculo, não N. Sem isso, o cache piora o problema — o momento de maior
 *   tráfego é exatamente quando a chave expira.
 *
 * - stale-while-revalidate: expirado mas ainda dentro da janela de stale, o
 *   valor antigo é servido imediatamente e a atualização acontece no fundo.
 *   Ninguém espera por uma query lenta.
 */

type Entry<T> = { data: T; at: number };

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

type CachedOptions<T> = {
  key: string;
  /** Idade máxima, em segundos, para servir sem recalcular. */
  ttlSeconds: number;
  /** Janela extra em que o valor velho ainda é servido durante o recálculo. */
  staleSeconds: number;
  /**
   * TTL dinâmico a partir do resultado. Útil para não congelar um estado ruim:
   * um payload "unhealthy" deve expirar rápido para a recuperação aparecer.
   */
  ttlForResult?: (data: T) => number;
};

type CachedResult<T> = {
  data: T;
  /** Momento em que o valor foi de fato calculado. */
  computedAt: number;
  source: "memory" | "redis" | "stale" | "inflight" | "miss";
};

function ageSeconds(entry: Entry<unknown>, now: number): number {
  return (now - entry.at) / 1000;
}

async function readRedis<T>(key: string): Promise<Entry<T> | null> {
  try {
    const raw = await getRedis().get(key);
    return raw ? (JSON.parse(raw) as Entry<T>) : null;
  } catch {
    // Redis indisponível não pode derrubar a rota — cai para L1/recálculo.
    return null;
  }
}

async function writeRedis<T>(key: string, entry: Entry<T>, ttl: number) {
  try {
    await getRedis().set(key, JSON.stringify(entry), "EX", Math.max(1, Math.ceil(ttl)));
  } catch {
    // Cache é otimização, não pode propagar erro.
  }
}

export async function cached<T>(
  options: CachedOptions<T>,
  producer: () => Promise<T>,
): Promise<CachedResult<T>> {
  const { key, ttlSeconds, staleSeconds, ttlForResult } = options;
  const now = Date.now();

  // ── L1 ────────────────────────────────────────────────────────────────────
  const fromMemory = memory.get(key) as Entry<T> | undefined;
  if (fromMemory && ageSeconds(fromMemory, now) < ttlSeconds) {
    return { data: fromMemory.data, computedAt: fromMemory.at, source: "memory" };
  }

  // ── L2 ────────────────────────────────────────────────────────────────────
  const fromRedis = await readRedis<T>(key);
  if (fromRedis && ageSeconds(fromRedis, Date.now()) < ttlSeconds) {
    memory.set(key, fromRedis);
    return { data: fromRedis.data, computedAt: fromRedis.at, source: "redis" };
  }

  // Valor mais recente entre as duas camadas, mesmo que já expirado.
  const candidates = [fromRedis, fromMemory].filter(Boolean) as Entry<T>[];
  const stale = candidates.sort((a, b) => b.at - a.at)[0] ?? null;
  const staleIsUsable =
    stale !== null && ageSeconds(stale, Date.now()) < ttlSeconds + staleSeconds;

  // ── Recálculo com single-flight ───────────────────────────────────────────
  const running = inflight.get(key) as Promise<T> | undefined;

  if (running) {
    // Alguém já está recalculando. Se dá para servir stale, serve — ninguém
    // precisa esperar. Só o cold start (sem stale nenhum) espera.
    if (staleIsUsable) {
      return { data: stale!.data, computedAt: stale!.at, source: "stale" };
    }

    const data = await running;
    return { data, computedAt: Date.now(), source: "inflight" };
  }

  const promise = (async () => {
    const data = await producer();
    const entry: Entry<T> = { data, at: Date.now() };

    memory.set(key, entry);
    await writeRedis(key, entry, ttlForResult?.(data) ?? ttlSeconds + staleSeconds);

    return data;
  })();

  inflight.set(key, promise);
  promise.catch(() => {}).finally(() => inflight.delete(key));

  if (staleIsUsable) {
    // Revalidação em background: devolve o valor antigo agora.
    return { data: stale!.data, computedAt: stale!.at, source: "stale" };
  }

  try {
    const data = await promise;
    return { data, computedAt: Date.now(), source: "miss" };
  } catch (error) {
    // Falhou e existe algo velho? Melhor um dado defasado que um 500.
    if (stale) {
      return { data: stale.data, computedAt: stale.at, source: "stale" };
    }
    throw error;
  }
}

/** Descarta as duas camadas. Útil em testes e após um deploy. */
export async function invalidate(key: string): Promise<void> {
  memory.delete(key);
  try {
    await getRedis().del(key);
  } catch {
    // O TTL resolve sozinho.
  }
}
