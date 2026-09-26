import type { AvatarUser } from "@/lib/avatar";

export interface WallAuthor extends AvatarUser {
  id: string;
}

export interface WallMsg {
  id: string;
  message: string;
  theme: number;
  /** Validated against CARD_ART_STYLES at render time; see cardArt.ts. */
  artStyle: string;
  /** "light" | "dark", validated the same way. */
  artTone: string;
  createdAt: string;
  author: WallAuthor;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Deterministic tilt derived from the message ID so it never
 * changes between renders. Range: –2.5° → +2.5°
 */
export function getRotation(id: string): number {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  // map 0..99 → -2.5..+2.5
  return ((sum % 100) / 100 - 0.5) * 5;
}
