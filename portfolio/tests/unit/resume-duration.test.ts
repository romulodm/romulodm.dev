import { describe, expect, it } from "vitest";

import { getDuration } from "@/lib/resume-duration";

const NOW = new Date(2026, 9, 10);

describe("getDuration", () => {
  it("reads the same span written in each locale", () => {
    const expected = { years: 1, months: 2 };
    expect(getDuration("Janeiro 2025", "Março 2026", NOW)).toEqual(expected);
    expect(getDuration("January 2025", "March 2026", NOW)).toEqual(expected);
    expect(getDuration("Enero 2025", "Marzo 2026", NOW)).toEqual(expected);
  });

  it("treats the ongoing markers of every locale as the current month", () => {
    for (const ongoing of ["Atualmente", "Present", "Actualidad"]) {
      expect(getDuration("Abril 2026", ongoing, NOW)).toEqual({ years: 0, months: 6 });
    }
  });

  it("accepts the Latin American spelling of September", () => {
    expect(getDuration("Setiembre 2025", "Diciembre 2025", NOW)).toEqual({ years: 0, months: 3 });
    expect(getDuration("Septiembre 2025", "Diciembre 2025", NOW)).toEqual({ years: 0, months: 3 });
  });

  it("returns null for a date it cannot parse", () => {
    expect(getDuration("someday", "Present", NOW)).toBeNull();
  });
});
