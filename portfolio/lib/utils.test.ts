import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cn,
  decryptLanyardData,
  encryptLanyardData,
  formatDistanceToNow,
} from "./utils";

describe("formatDistanceToNow", () => {
  const NOW = new Date("2026-04-09T22:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // As strings abaixo sao a saida real de Intl.RelativeTimeFormat, que substituiu
  // um formato compacto escrito a mao ("30m ago"). O teste ficou para tras na
  // troca e vinha afirmando o formato antigo.
  it("formats recent dates as relative strings", () => {
    expect(formatDistanceToNow(new Date("2026-04-09T21:59:40.000Z"))).toBe("just now");
    expect(formatDistanceToNow(new Date("2026-04-09T21:30:00.000Z"))).toBe("30 minutes ago");
    expect(formatDistanceToNow(new Date("2026-04-09T19:00:00.000Z"))).toBe("3 hours ago");
    expect(formatDistanceToNow(new Date("2026-04-05T22:00:00.000Z"))).toBe("4 days ago");
  });

  // `numeric: "auto"` troca o numero por palavra quando existe uma: -1 dia nao
  // vira "1 day ago", vira "yesterday". Cobrir isso evita que alguem "conserte"
  // a saida achando que e bug.
  it("uses the word form that numeric:auto produces for one unit ago", () => {
    expect(formatDistanceToNow(new Date("2026-04-08T22:00:00.000Z"))).toBe("yesterday");
  });

  it("translates when the locale is pt", () => {
    expect(formatDistanceToNow(new Date("2026-04-09T21:59:40.000Z"), "pt")).toBe(
      "agora mesmo",
    );
    expect(formatDistanceToNow(new Date("2026-04-09T21:30:00.000Z"), "pt")).toBe(
      "há 30 minutos",
    );
    expect(formatDistanceToNow(new Date("2026-04-05T22:00:00.000Z"), "pt")).toBe(
      "há 4 dias",
    );
  });

  /**
   * Acima de 30 dias a funcao cai para data absoluta.
   *
   * A versao anterior deste teste comparava com `toLocaleDateString()` SEM
   * argumento — ou seja, com o locale da maquina. A implementacao formata em
   * "en-US" por padrao, entao o teste passava em maquina en-US (e no CI, que
   * roda Linux com locale C) e falhava em maquina pt-BR, onde a mesma data vira
   * "31/01/2026" em vez de "1/31/2026".
   *
   * Teste que depende do ambiente e pior que teste ausente: passa no CI e da
   * falsa confianca. O locale agora e explicito nos dois lados.
   */
  it("falls back to an absolute date for anything older than 30 days", () => {
    const old = new Date("2026-02-01T00:00:00.000Z");

    expect(formatDistanceToNow(old)).toBe(old.toLocaleDateString("en-US"));
    expect(formatDistanceToNow(old, "pt")).toBe(old.toLocaleDateString("pt-BR"));
  });
});

describe("cn", () => {
  it("merges truthy class values and tailwind conflicts", () => {
    expect(cn("px-2", undefined, "px-4", false, "font-bold")).toBe("px-4 font-bold");
  });
});

describe("lanyard obfuscation", () => {
  it("round-trips usernames and variants", () => {
    const encrypted = encryptLanyardData("romulo-dev", "dark");

    expect(encrypted).not.toContain("romulo-dev");
    expect(decryptLanyardData(encrypted)).toEqual({
      username: "romulo-dev",
      variant: "dark",
    });
  });

  it("supports unicode usernames", () => {
    const encrypted = encryptLanyardData("romulo🚀", "light");

    expect(decryptLanyardData(encrypted)).toEqual({
      username: "romulo🚀",
      variant: "light",
    });
  });

  it("rejects malformed payloads", () => {
    expect(decryptLanyardData("")).toBeNull();
    expect(decryptLanyardData("not-valid")).toBeNull();
  });
});
