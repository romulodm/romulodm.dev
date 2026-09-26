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

export function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
