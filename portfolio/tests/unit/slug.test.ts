import { describe, expect, it } from "vitest";

import { MAX_SLUG_LENGTH, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases, strips accents and joins words with hyphens", () => {
    expect(slugify("O NDA escondeu meu melhor trabalho")).toBe(
      "o-nda-escondeu-meu-melhor-trabalho",
    );
    expect(slugify("Ação, coração & pão!")).toBe("acao-coracao-pao");
  });

  it("keeps a slug that is already normalized unchanged", () => {
    expect(slugify("nda-portfolio")).toBe("nda-portfolio");
  });

  it("drops leading, trailing and repeated hyphens from typed input", () => {
    expect(slugify("--nda---portfolio-")).toBe("nda-portfolio");
  });

  it("never ends with a hyphen after cutting at the length limit", () => {
    const slug = slugify(`${"a".repeat(MAX_SLUG_LENGTH - 1)} b`);
    expect(slug.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("!!! ???")).toBe("");
  });
});
