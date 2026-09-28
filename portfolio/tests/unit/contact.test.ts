import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  CONTACT_LIMITS,
  CONTACT_STATUSES,
  CONTACT_TOPICS,
  hashIp,
} from "@/lib/contact";

/**
 * `lib/contact.ts` duplica os enums `ContactTopic` e `ContactStatus` do Prisma,
 * porque o cliente precisa da lista para montar o `<select>` e não pode importar
 * o client do Prisma. Duplicação silenciosa é dívida: se alguém adicionar um
 * tópico no schema e esquecer daqui, o formulário simplesmente não oferece a
 * opção nova, e nada quebra até alguém reparar.
 *
 * Este teste lê o schema e compara. É o único guarda-corpo dessa duplicação.
 */
function readPrismaEnum(name: string): string[] {
  const schemaPath = fileURLToPath(
    new URL("../../../packages/database/prisma/schema.prisma", import.meta.url),
  );
  const schema = readFileSync(schemaPath, "utf8");

  const match = schema.match(new RegExp(`enum\\s+${name}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`enum ${name} não encontrado em schema.prisma`);

  return match[1]
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trim())
    .filter(Boolean);
}

describe("vocabulário do contato", () => {
  it("CONTACT_TOPICS espelha o enum ContactTopic do Prisma", () => {
    expect([...CONTACT_TOPICS].sort()).toEqual(readPrismaEnum("ContactTopic").sort());
  });

  it("CONTACT_STATUSES espelha o enum ContactStatus do Prisma", () => {
    expect([...CONTACT_STATUSES].sort()).toEqual(readPrismaEnum("ContactStatus").sort());
  });

  it("os limites batem com os VarChar do schema", () => {
    const schemaPath = fileURLToPath(
      new URL("../../../packages/database/prisma/schema.prisma", import.meta.url),
    );
    const model = readFileSync(schemaPath, "utf8").match(
      /model\s+ContactMessage\s*\{([\s\S]*?)\n\}/,
    );
    expect(model).not.toBeNull();

    const body = model![1];
    // Divergir aqui não dá erro de validação legível: dá erro do Postgres.
    expect(body).toContain(`@db.VarChar(${CONTACT_LIMITS.nameMax})`);
    expect(body).toContain(`@db.VarChar(${CONTACT_LIMITS.emailMax})`);
    expect(body).toContain(`@db.VarChar(${CONTACT_LIMITS.messageMax})`);
    expect(body).toContain(`@db.VarChar(${CONTACT_LIMITS.userAgentMax})`);
  });
});

describe("hashIp", () => {
  it("é determinístico para o mesmo IP e o mesmo sal", () => {
    process.env.APP_SECRET = "sal-de-teste";
    expect(hashIp("203.0.113.7")).toBe(hashIp("203.0.113.7"));
  });

  it("separa IPs diferentes", () => {
    process.env.APP_SECRET = "sal-de-teste";
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("203.0.113.8"));
  });

  it("muda quando o sal muda — sem sal o hash de um IPv4 é reversível por força bruta", () => {
    process.env.APP_SECRET = "sal-a";
    const withSaltA = hashIp("203.0.113.7");

    process.env.APP_SECRET = "sal-b";
    expect(hashIp("203.0.113.7")).not.toBe(withSaltA);
  });

  it("é um digest SHA-256 em hexadecimal", () => {
    process.env.APP_SECRET = "sal-de-teste";
    const digest = hashIp("203.0.113.7");

    // Sem asserção de "não contém o IP": num hex de 64 caracteres a substring
    // "203" aparece por acaso em ~1,5% dos casos, e isso seria um teste
    // instável. O que garante a irreversibilidade é o sal, testado acima.
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });
});
