import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { DEFAULT_SECONDS, parseDuration, parseStatusCommand } from "@/lib/presence/status";
import { STATUS_PRESETS, isStatusPreset } from "@/lib/presence/status-presets";

describe("parseDuration", () => {
  it("reads minutes, hours and days", () => {
    expect(parseDuration("90m")).toBe(90 * 60);
    expect(parseDuration("2h")).toBe(2 * 3600);
    expect(parseDuration("3D")).toBe(3 * 86_400);
  });

  it("rejects anything that is not a single duration token", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("2")).toBeNull();
    expect(parseDuration("reuniao")).toBeNull();
    expect(parseDuration("2h 30m")).toBeNull();
  });
});

describe("parseStatusCommand", () => {
  it("keeps one text for every locale when there is no pipe", () => {
    expect(parseStatusCommand("em foco")).toEqual({
      status: { label: "em foco" },
      seconds: DEFAULT_SECONDS,
    });
  });

  it("consumes only a trailing duration", () => {
    expect(parseStatusCommand("reunião 2h de retro")).toEqual({
      status: { label: "reunião 2h de retro" },
      seconds: DEFAULT_SECONDS,
    });
    expect(parseStatusCommand("em foco 3h")?.seconds).toBe(3 * 3600);
  });

  it("treats a lone duration as the text", () => {
    expect(parseStatusCommand("2h")).toEqual({ status: { label: "2h" }, seconds: DEFAULT_SECONDS });
  });

  it("splits Portuguese and English on a pipe, with the duration after both", () => {
    expect(parseStatusCommand("em foco | heads down 2h")).toEqual({
      status: { label: "em foco", labels: { pt: "em foco", en: "heads down" } },
      seconds: 2 * 3600,
    });
  });

  it("accepts a Spanish translation as a third part", () => {
    expect(parseStatusCommand("em foco | heads down | concentrado 2h")).toEqual({
      status: {
        label: "em foco",
        labels: { pt: "em foco", en: "heads down", es: "concentrado" },
      },
      seconds: 2 * 3600,
    });
  });

  it("rejects an empty side or more than three parts", () => {
    expect(parseStatusCommand("em foco |")).toBeNull();
    expect(parseStatusCommand("| heads down")).toBeNull();
    expect(parseStatusCommand("a | b |")).toBeNull();
    expect(parseStatusCommand("a | b | c | d")).toBeNull();
    expect(parseStatusCommand("   ")).toBeNull();
  });

  it("caps each text at 60 characters", () => {
    const parsed = parseStatusCommand(`${"a".repeat(80)} | ${"b".repeat(80)}`);
    expect(parsed?.status.labels?.pt).toHaveLength(60);
    expect(parsed?.status.labels?.en).toHaveLength(60);
  });
});

/**
 * The card renders a preset through `home.built.presence.presets.<key>`, and
 * the webhook reads the Portuguese text from the same place. A preset added to
 * the table without its messages would show the raw key on the site, so every
 * key must exist, non-empty, in every locale.
 */
describe("status presets", () => {
  const readMessages = (locale: string) =>
    JSON.parse(
      readFileSync(fileURLToPath(new URL(`../../messages/${locale}.json`, import.meta.url)), "utf8"),
    );

  it.each(["pt", "en", "es"])("has a %s label for every preset", (locale) => {
    const presets = readMessages(locale).home.built.presence.presets as Record<string, string>;
    for (const key of Object.keys(STATUS_PRESETS)) {
      expect(presets[key], `${locale}: ${key}`).toBeTruthy();
    }
    expect(Object.keys(presets).sort()).toEqual(Object.keys(STATUS_PRESETS).sort());
  });

  it("only accepts keys from the table", () => {
    expect(isStatusPreset("foco")).toBe(true);
    expect(isStatusPreset("status")).toBe(false);
    expect(isStatusPreset("toString")).toBe(false);
  });

  it("uses command-safe names and durations within the cap", () => {
    for (const [key, seconds] of Object.entries(STATUS_PRESETS)) {
      expect(key).toMatch(/^[a-z0-9_]{1,32}$/);
      expect(seconds).toBeLessThanOrEqual(72 * 3600);
    }
  });
});
