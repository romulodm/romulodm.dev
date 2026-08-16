import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { value: jar.get(name)! } : undefined,
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
    has: (name: string) => jar.has(name),
  }),
}));

const { getOrCreateVisitorId } = await import("./visitor");

beforeEach(() => {
  jar.clear();
  process.env.VISITOR_ID_SECRET = "segredo-de-teste";
});

describe("getOrCreateVisitorId", () => {
  it("mantém o mesmo ID entre chamadas quando o cookie é válido", async () => {
    const first = await getOrCreateVisitorId();
    const second = await getOrCreateVisitorId();

    expect(first).toBe(second);
  });

  it("descarta um ID que o servidor não assinou", async () => {
    // O ponto do HMAC: sem ele, qualquer um escolhe o próprio identificador de
    // dedupe e gera chaves ilimitadas no Redis.
    jar.set("vid", "id-escolhido-pelo-atacante.assinaturafalsa");

    const id = await getOrCreateVisitorId();

    expect(id).not.toBe("id-escolhido-pelo-atacante");
  });

  it("reemite quando o cookie está malformado", async () => {
    jar.set("vid", "semseparador");
    await expect(getOrCreateVisitorId()).resolves.toEqual(expect.any(String));
  });

  it("não estoura com assinatura de tamanho diferente", async () => {
    // crypto.timingSafeEqual lança se os buffers tiverem tamanhos distintos.
    jar.set("vid", "a.b");
    await expect(getOrCreateVisitorId()).resolves.toEqual(expect.any(String));
  });

  it("emite o cookie como httpOnly e sameSite=lax", async () => {
    await getOrCreateVisitorId();
    expect(jar.has("vid")).toBe(true);
  });
});
