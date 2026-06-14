import type * as Phaser from "phaser";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RarityKey = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Rarity { label: string; color: number; text: string; weight: number }

export interface Fish {
  id: string; name: string; rarity: RarityKey;
  value: number; difficulty: number; color: number; minRod: number;
}

export interface Rod { name: string; barBonus: number; price: number }

export interface CharacterConfig { name: string; skin: string; tint: number }

export interface SaveData {
  money: number;
  bait: number;
  rodTier: number;
  ownedRods: number[];
  fish: Record<string, number>;
  character: CharacterConfig;
  level: number;
  xp: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const RARITY: Record<RarityKey, Rarity> = {
  common:    { label: "Comum",    color: 0x9fb4c7, text: "#c9d6e0", weight: 50 },
  uncommon:  { label: "Incomum",  color: 0x6fae5a, text: "#9fe07a", weight: 28 },
  rare:      { label: "Raro",     color: 0x4a90d9, text: "#7ec1ff", weight: 14 },
  epic:      { label: "Épico",    color: 0x9b59b6, text: "#d39bff", weight: 6  },
  legendary: { label: "Lendário", color: 0xf0a020, text: "#ffcf5a", weight: 2  },
};

export const FISH: Fish[] = [
  { id: "sardinha",  name: "Sardinha",       rarity: "common",    value: 8,   difficulty: 1, color: 0x9fb4c7, minRod: 1 },
  { id: "tilapia",   name: "Tilápia",        rarity: "common",    value: 12,  difficulty: 1, color: 0x8fa86b, minRod: 1 },
  { id: "lambari",   name: "Lambari",        rarity: "common",    value: 10,  difficulty: 2, color: 0xb9c4a0, minRod: 1 },
  { id: "truta",     name: "Truta",          rarity: "uncommon",  value: 28,  difficulty: 2, color: 0xc78f5a, minRod: 1 },
  { id: "robalo",    name: "Robalo",         rarity: "uncommon",  value: 35,  difficulty: 3, color: 0x6b8fa8, minRod: 1 },
  { id: "dourado",   name: "Dourado",        rarity: "rare",      value: 80,  difficulty: 3, color: 0xe0c050, minRod: 2 },
  { id: "salmao",    name: "Salmão",         rarity: "rare",      value: 95,  difficulty: 4, color: 0xd97b5a, minRod: 2 },
  { id: "esturjao",  name: "Esturjão",       rarity: "epic",      value: 200, difficulty: 4, color: 0x7a6bb0, minRod: 2 },
  { id: "peixe_lua", name: "Peixe-Lua",      rarity: "epic",      value: 240, difficulty: 5, color: 0x88c0d0, minRod: 3 },
  { id: "lendario",  name: "Peixe Lendário", rarity: "legendary", value: 600, difficulty: 5, color: 0xf0a020, minRod: 3 },
];

export const FISH_BY_ID: Record<string, Fish> = Object.fromEntries(FISH.map((f) => [f.id, f]));

export const RODS: Record<number, Rod> = {
  1: { name: "Vara de Bambu", barBonus: 0,  price: 0   },
  2: { name: "Vara de Fibra", barBonus: 14, price: 150 },
  3: { name: "Vara Iridium",  barBonus: 30, price: 600 },
};

export const PRICES = { bait: 5, lootbox: 50 };

export const DEFAULT_CHARACTER: CharacterConfig = { name: "Pescador", skin: "abby", tint: 0xffffff };

export const DEFAULT_SAVE: SaveData = {
  money: 90, bait: 5, rodTier: 1, ownedRods: [1], fish: {},
  character: { ...DEFAULT_CHARACTER }, level: 1, xp: 0,
};

// ─── Registry helpers ─────────────────────────────────────────────────────────

export function initState(game: Phaser.Game, save?: Partial<SaveData>): void {
  const r = game.registry;
  if (r.get("inited")) return;
  const s: SaveData = { ...DEFAULT_SAVE, ...save, character: { ...DEFAULT_CHARACTER, ...(save?.character ?? {}) } };
  r.set("money", s.money);
  r.set("bait", s.bait);
  r.set("rodTier", s.rodTier);
  r.set("ownedRods", s.ownedRods);
  r.set("fish", s.fish);
  r.set("character", s.character);
  r.set("level", s.level);
  r.set("xp", s.xp);
  r.set("inited", true);
}

export function serialize(scene: Phaser.Scene): SaveData {
  const r = scene.registry;
  return {
    money: r.get("money"), bait: r.get("bait"), rodTier: r.get("rodTier"),
    ownedRods: r.get("ownedRods"), fish: r.get("fish"),
    character: r.get("character"), level: r.get("level"), xp: r.get("xp"),
  };
}

export const getMoney = (s: Phaser.Scene): number => s.registry.get("money");
export const addMoney = (s: Phaser.Scene, n: number): void => { s.registry.set("money", Math.max(0, getMoney(s) + n)); };
export const getBait  = (s: Phaser.Scene): number => s.registry.get("bait");
export const addBait  = (s: Phaser.Scene, n = 1): void => { s.registry.set("bait", Math.max(0, getBait(s) + n)); };
export const getFish  = (s: Phaser.Scene): Record<string, number> => s.registry.get("fish");

export function addFish(s: Phaser.Scene, id: string, n = 1): void {
  const fish = { ...getFish(s) };
  fish[id] = (fish[id] || 0) + n;
  s.registry.set("fish", fish);
  addXp(s, (FISH_BY_ID[id]?.value ?? 5));
}
export function removeFish(s: Phaser.Scene, id: string, n = 1): void {
  const fish = { ...getFish(s) };
  if (!fish[id]) return;
  fish[id] -= n;
  if (fish[id] <= 0) delete fish[id];
  s.registry.set("fish", fish);
}

export const getCharacter = (s: Phaser.Scene): CharacterConfig => s.registry.get("character");
export const setCharacter = (s: Phaser.Scene, c: CharacterConfig): void => { s.registry.set("character", c); };

export function addXp(s: Phaser.Scene, amount: number): void {
  let xp = (s.registry.get("xp") as number) + amount;
  let level = s.registry.get("level") as number;
  let need = level * 100;
  while (xp >= need) { xp -= need; level++; need = level * 100; s.game.events.emit("toast", `⭐ Nível ${level}!`, "#ffcf5a"); }
  s.registry.set("xp", xp);
  s.registry.set("level", level);
}

export function rollFish(rodTier: number): Fish {
  const pool = FISH.filter((f) => f.minRod <= rodTier);
  const total = pool.reduce((sum, f) => sum + RARITY[f.rarity].weight, 0);
  let roll = Math.random() * total;
  for (const f of pool) { roll -= RARITY[f.rarity].weight; if (roll <= 0) return f; }
  return pool[0];
}
