// components/wall/themes.ts

export type DecoType =
  | "lightning-smiley"
  | "diamond-dots"
  | "diag-lines"
  | "hearts"
  | "curl"
  | "spinner"
  | "diamond-center";

export type ThemeKey =
  | "purple"
  | "violet"
  | "green"
  | "teal"
  | "blue"
  | "navy"
  | "red"
  | "amber"
  | "magenta";

interface Theme {
  gradient: string;
  avatarBg: string;
  deco: DecoType | null;
}

const themes: Record<ThemeKey, Theme> = {
  purple: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #a855f733 0%, transparent 55%), linear-gradient(180deg, #5b1ea6 0%, #3a0f6e 100%)",
    avatarBg: "#a855f7",
    deco: "lightning-smiley",
  },
  violet: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #8b5cf633 0%, transparent 55%), linear-gradient(180deg, #6d28d9 0%, #3b1772 100%)",
    avatarBg: "#8b5cf6",
    deco: "lightning-smiley",
  },
  green: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #22c55e33 0%, transparent 55%), linear-gradient(180deg, #0e6b3a 0%, #063b22 100%)",
    avatarBg: "#22c55e",
    deco: "lightning-smiley",
  },
  teal: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #14b8a633 0%, transparent 55%), linear-gradient(180deg, #0c5b56 0%, #063634 100%)",
    avatarBg: "#14b8a6",
    deco: "lightning-smiley",
  },
  blue: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #3b82f633 0%, transparent 55%), linear-gradient(180deg, #1e3a8a 0%, #0c1e4a 100%)",
    avatarBg: "#3b82f6",
    deco: "lightning-smiley",
  },
  navy: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #6366f133 0%, transparent 55%), linear-gradient(180deg, #243a78 0%, #0f1a3d 100%)",
    avatarBg: "#6366f1",
    deco: "lightning-smiley",
  },
  red: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #ef444433 0%, transparent 55%), linear-gradient(180deg, #7a1620 0%, #3f0a10 100%)",
    avatarBg: "#ef4444",
    deco: "lightning-smiley",
  },
  amber: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #f59e0b33 0%, transparent 55%), linear-gradient(180deg, #a06a14 0%, #523208 100%)",
    avatarBg: "#f59e0b",
    deco: "lightning-smiley",
  },
  magenta: {
    gradient:
      "radial-gradient(120% 80% at 50% 0%, #d946ef33 0%, transparent 55%), linear-gradient(180deg, #7a1e6b 0%, #3f0a37 100%)",
    avatarBg: "#d946ef",
    deco: "lightning-smiley",
  },
};

// Indexed array used by `msg.theme % THEMES.length`
export const THEMES: (Theme & { key: ThemeKey })[] = (
  Object.entries(themes) as [ThemeKey, Theme][]
).map(([key, value]) => ({ key, ...value }));