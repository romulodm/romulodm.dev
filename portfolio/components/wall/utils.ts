export interface WallAuthor {
  id: string;
  username: string;
  image: string | null;
}

export interface WallMsg {
  id: string;
  message: string;
  theme: number;
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

const AVATAR_COLORS = [
  "bg-emerald-600", "bg-violet-600", "bg-rose-600",
  "bg-amber-600", "bg-cyan-600", "bg-indigo-600",
  "bg-pink-600", "bg-teal-600", "bg-orange-600",
  "bg-sky-600", "bg-red-600", "bg-lime-600",
];

export function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
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
