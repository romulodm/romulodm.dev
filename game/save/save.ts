import type { SaveData } from "../state";
import { DEFAULT_SAVE } from "../state";
import type { GameOptions } from "../config";

const LS_KEY = "fishing-save-v1";

/** Load save data: from backend if logged in, else localStorage, else defaults. */
export async function loadSave(opts: GameOptions): Promise<SaveData> {
  if (opts.backendSave && opts.userId) {
    try {
      const res = await fetch("/api/game/state");
      if (res.ok) {
        const data = await res.json();
        if (data?.save) return { ...DEFAULT_SAVE, ...data.save };
      }
    } catch (e) {
      console.warn("[save] backend load failed, falling back to local", e);
    }
  }
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
    } catch { /* ignore */ }
  }
  return { ...DEFAULT_SAVE };
}

/** Save data: to backend if logged in, else localStorage. */
export async function persistSave(opts: GameOptions, save: SaveData): Promise<void> {
  if (opts.backendSave && opts.userId) {
    try {
      await fetch("/api/game/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ save }),
      });
      return;
    } catch (e) {
      console.warn("[save] backend save failed, falling back to local", e);
    }
  }
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(save)); } catch { /* ignore */ }
  }
}
