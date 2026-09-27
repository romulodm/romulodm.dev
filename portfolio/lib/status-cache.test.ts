import { beforeEach, describe, expect, it, vi } from "vitest";

const redisState = {
  down: false,
  store: new Map<string, string>(),
};

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    async get(key: string) {
      if (redisState.down) throw new Error("ECONNREFUSED");
      return redisState.store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      if (redisState.down) throw new Error("ECONNREFUSED");
      redisState.store.set(key, value);
      return "OK";
    },
    async del(key: string) {
      if (redisState.down) throw new Error("ECONNREFUSED");
      redisState.store.delete(key);
      return 1;
    },
  }),
}));

const { cached, invalidate } = await import("./status-cache");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let keySeq = 0;
function freshKey() {
  return `test:key:${keySeq++}`;
}

beforeEach(() => {
  redisState.down = false;
  redisState.store.clear();
});

describe("cached", () => {
  it("não chama o producer de novo dentro do TTL", async () => {
    const key = freshKey();
    const producer = vi.fn(async () => ({ n: 1 }));

    const first = await cached({ key, ttlSeconds: 60, staleSeconds: 60 }, producer);
    const second = await cached({ key, ttlSeconds: 60, staleSeconds: 60 }, producer);

    expect(producer).toHaveBeenCalledTimes(1);
    expect(first.source).toBe("miss");
    expect(second.source).toBe("memory");
    expect(second.data).toEqual({ n: 1 });
  });

  it("dedupe: uma rajada concorrente dispara UM recálculo", async () => {
    const key = freshKey();
    let calls = 0;
    const producer = async () => {
      calls++;
      await sleep(30);
      return { calls };
    };

    // É o cenário que importa: o cache expira e 50 requests chegam juntas.
    // Sem single-flight, seriam 50 recálculos — o cache pioraria o problema.
    const results = await Promise.all(
      Array.from({ length: 50 }, () =>
        cached({ key, ttlSeconds: 60, staleSeconds: 60 }, producer),
      ),
    );

    expect(calls).toBe(1);
    expect(results.every((r) => r.data.calls === 1)).toBe(true);
  });

  it("serve stale imediatamente e revalida no fundo", async () => {
    const key = freshKey();
    let value = "antigo";
    const producer = async () => {
      await sleep(50);
      return value;
    };

    await cached({ key, ttlSeconds: 0.05, staleSeconds: 60 }, producer);
    await sleep(80); // passou do TTL, dentro da janela de stale

    value = "novo";
    const started = Date.now();
    const staleHit = await cached({ key, ttlSeconds: 0.05, staleSeconds: 60 }, producer);
    const elapsed = Date.now() - started;

    // Não esperou os 50ms do producer.
    expect(elapsed).toBeLessThan(40);
    expect(staleHit.data).toBe("antigo");
    expect(staleHit.source).toBe("stale");

    await sleep(80);
    const refreshed = await cached({ key, ttlSeconds: 60, staleSeconds: 60 }, producer);
    expect(refreshed.data).toBe("novo");
  });

  it("aplica TTL menor quando o resultado é ruim", async () => {
    const key = freshKey();

    await cached(
      {
        key,
        ttlSeconds: 30,
        staleSeconds: 120,
        ttlForResult: (data: { status: string }) =>
          data.status === "unhealthy" ? 5 : 150,
      },
      async () => ({ status: "unhealthy" }),
    );

    // O TTL curto vai para o Redis, para o estado ruim não congelar.
    expect(redisState.store.has(key)).toBe(true);
  });

  it("serve stale quando o producer falha", async () => {
    const key = freshKey();
    let shouldFail = false;
    const producer = async () => {
      if (shouldFail) throw new Error("banco fora");
      return "bom";
    };

    await cached({ key, ttlSeconds: 0.05, staleSeconds: 60 }, producer);
    await sleep(80);

    shouldFail = true;
    const result = await cached({ key, ttlSeconds: 0.05, staleSeconds: 60 }, producer);

    // Dado defasado é melhor que 500 numa página de status.
    expect(result.data).toBe("bom");
  });

  it("propaga o erro quando falha sem nada em cache", async () => {
    const key = freshKey();
    await expect(
      cached({ key, ttlSeconds: 60, staleSeconds: 60 }, async () => {
        throw new Error("banco fora");
      }),
    ).rejects.toThrow("banco fora");
  });

  it("continua funcionando com o Redis fora", async () => {
    const key = freshKey();
    redisState.down = true;
    const producer = vi.fn(async () => "ok");

    const first = await cached({ key, ttlSeconds: 60, staleSeconds: 60 }, producer);
    const second = await cached({ key, ttlSeconds: 60, staleSeconds: 60 }, producer);

    expect(first.data).toBe("ok");
    expect(second.source).toBe("memory");
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it("invalidate limpa memória e Redis", async () => {
    const key = freshKey();
    const producer = vi.fn(async () => "v1");

    await cached({ key, ttlSeconds: 60, staleSeconds: 60 }, producer);
    await invalidate(key);
    await cached({ key, ttlSeconds: 60, staleSeconds: 60 }, producer);

    expect(producer).toHaveBeenCalledTimes(2);
    expect(redisState.store.has(key)).toBe(true);
  });
});
