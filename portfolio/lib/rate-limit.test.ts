import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Estado do Redis falso, controlado por teste.
const redisState = {
  mode: "ok" as "ok" | "down" | "slow",
  counters: new Map<string, number>(),
};

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    async eval(_script: string, _numKeys: number, key: string) {
      if (redisState.mode === "down") throw new Error("ECONNREFUSED");
      if (redisState.mode === "slow") {
        return new Promise((resolve) => setTimeout(() => resolve(1), 5_000));
      }

      const next = (redisState.counters.get(key) ?? 0) + 1;
      redisState.counters.set(key, next);
      return next;
    },
  }),
}));

vi.mock("@sentry/nextjs", () => ({
  withScope: (fn: (scope: unknown) => void) =>
    fn({
      setTag: () => {},
      setLevel: () => {},
      setFingerprint: () => {},
      setContext: () => {},
    }),
  captureException: () => {},
  captureMessage: () => {},
}));

const { getRequestIp, rateLimit } = await import("./rate-limit");

beforeEach(() => {
  redisState.mode = "ok";
  redisState.counters.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getRequestIp", () => {
  it("usa o ÚLTIMO item do X-Forwarded-For, não o primeiro", () => {
    // O nginx usa $proxy_add_x_forwarded_for, que ANEXA o $remote_addr ao que
    // o cliente mandou. Ler o primeiro item deixa o valor sob controle de quem
    // ataca: `curl -H "X-Forwarded-For: 1.2.3.4"`.
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" });
    expect(getRequestIp(headers)).toBe("203.0.113.9");
  });

  it("aceita tanto Request quanto Headers", () => {
    const request = new Request("https://example.test/", {
      headers: { "x-forwarded-for": "9.9.9.9, 8.8.8.8" },
    });

    expect(getRequestIp(request)).toBe("8.8.8.8");
    expect(getRequestIp(new Headers({ "x-real-ip": "5.5.5.5" }))).toBe("5.5.5.5");
  });

  it("lê o próprio .get() de um Headers que também tem um campo `headers`", () => {
    // Forma do HeadersAdapter do Next (o que `await headers()` devolve): estende
    // Headers e guarda o objeto cru em `this.headers`, sem `.get()`.
    class AdapterLike extends Headers {
      headers = { "x-real-ip": "ignored" };
    }
    const headers = new AdapterLike({ "x-real-ip": "7.7.7.7" });

    expect(getRequestIp(headers)).toBe("7.7.7.7");
  });

  it("prefere x-real-ip quando presente", () => {
    const headers = new Headers({
      "x-real-ip": "5.5.5.5",
      "x-forwarded-for": "1.1.1.1",
    });

    expect(getRequestIp(headers)).toBe("5.5.5.5");
  });

  it("cai para 'anonymous' sem headers de proxy", () => {
    expect(getRequestIp(new Headers())).toBe("anonymous");
  });
});

describe("rateLimit", () => {
  it("libera até o máximo e bloqueia depois", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(await rateLimit("test:normal", 3, 60));
    }

    expect(results).toEqual([false, false, false, true, true]);
  });

  it("bloqueia quando o Redis cai e o modo é 'closed'", async () => {
    redisState.mode = "down";

    // Usado em login e pagamento: não conseguir contar é motivo para recusar.
    await expect(rateLimit("test:closed", 10, 60, "closed")).resolves.toBe(true);
  });

  it("cai para o contador em memória quando o Redis cai e o modo é 'open'", async () => {
    redisState.mode = "down";

    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(await rateLimit("test:open", 3, 60, "open"));
    }

    // Degrada, mas continua limitando — não vira barra livre.
    expect(results).toEqual([false, false, false, true, true]);
  });

  it("aborta em vez de pendurar a request quando o Redis está lento", async () => {
    redisState.mode = "slow";

    const startedAt = Date.now();
    await rateLimit("test:slow", 10, 60, "open");
    const elapsed = Date.now() - startedAt;

    // Sem timeout, um Redis lento esgota o pool de requests — pior que não
    // ter rate limit nenhum.
    expect(elapsed).toBeLessThan(1_000);
  });
});
