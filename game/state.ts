import type Phaser from "phaser";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RarityKey = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Rarity {
  label: string;
  color: number;
  text: string;
  weight: number;
}

export interface Fish {
  id: string;
  name: string;
  rarity: RarityKey;
  value: number;
  difficulty: number;
  color: number;
  minRod: number;
}

export interface Rod {
  name: string;
  barBonus: number;
  price: number;
}

export interface CharacterConfig {
  name: string;
  skin: string;   // spritesheet key
  tint: number;   // colour tint for personalisation
}

export interface GameState {
  money: number;
  bait: number;
  rodTier: number;
  ownedRods: number[];
  fish: Record<string, number>;
  character: CharacterConfig;
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
  { id: "sardinha",  name: "Sardinha",      rarity: "common",    value: 8,   difficulty: 1, color: 0x9fb4c7, minRod: 1 },
  { id: "tilapia",   name: "Tilápia",       rarity: "common",    value: 12,  difficulty: 1, color: 0x8fa86b, minRod: 1 },
  { id: "lambari",   name: "Lambari",       rarity: "common",    value: 10,  difficulty: 2, color: 0xb9c4a0, minRod: 1 },
  { id: "truta",     name: "Truta",         rarity: "uncommon",  value: 28,  difficulty: 2, color: 0xc78f5a, minRod: 1 },
  { id: "robalo",    name: "Robalo",        rarity: "uncommon",  value: 35,  difficulty: 3, color: 0x6b8fa8, minRod: 1 },
  { id: "dourado",   name: "Dourado",       rarity: "rare",      value: 80,  difficulty: 3, color: 0xe0c050, minRod: 2 },
  { id: "salmao",    name: "Salmão",        rarity: "rare",      value: 95,  difficulty: 4, color: 0xd97b5a, minRod: 2 },
  { id: "esturjao",  name: "Esturjão",      rarity: "epic",      value: 200, difficulty: 4, color: 0x7a6bb0, minRod: 2 },
  { id: "peixe_lua", name: "Peixe-Lua",     rarity: "epic",      value: 240, difficulty: 5, color: 0x88c0d0, minRod: 3 },
  { id: "lendario",  name: "Peixe Lendário",rarity: "legendary", value: 600, difficulty: 5, color: 0xf0a020, minRod: 3 },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));

export const RODS: Record<number, Rod> = {
  1: { name: "Vara de Bambu", barBonus: 0,   price: 0   },
  2: { name: "Vara de Fibra", barBonus: 14,  price: 150 },
  3: { name: "Vara Iridium",  barBonus: 30,  price: 600 },
};

export const PRICES = {
  bait: 5,
  lootbox: 50,
};

// ─── Default character ─────────────────────────────────────────────────────────

export const DEFAULT_CHARACTER: CharacterConfig = {
  name: "Pescador",
  skin: "abby",
  tint: 0xffffff,
};

// ─── Registry helpers ─────────────────────────────────────────────────────────
// The Phaser registry persists across scene switches.

export function initState(game: Phaser.Game): void {
  const r = game.registry;
  if (r.get("inited")) return;
  r.set("money",     90);
  r.set("bait",      5);
  r.set("rodTier",   1);
  r.set("ownedRods", [1]);
  r.set("fish",      {} as Record<string, number>);
  r.set("character", { ...DEFAULT_CHARACTER });
  r.set("inited",    true);
}

export function getMoney(scene: Phaser.Scene): number {
  return scene.registry.get("money") as number;
}
export function addMoney(scene: Phaser.Scene, amount: number): void {
  scene.registry.set("money", Math.max(0, getMoney(scene) + amount));
}

export function getBait(scene: Phaser.Scene): number {
  return scene.registry.get("bait") as number;
}
export function addBait(scene: Phaser.Scene, n = 1): void {
  scene.registry.set("bait", Math.max(0, getBait(scene) + n));
}

export function getFish(scene: Phaser.Scene): Record<string, number> {
  return scene.registry.get("fish") as Record<string, number>;
}
export function addFish(scene: Phaser.Scene, fishId: string, n = 1): void {
  const fish = { ...getFish(scene) };
  fish[fishId] = (fish[fishId] || 0) + n;
  scene.registry.set("fish", fish);
}
export function removeFish(scene: Phaser.Scene, fishId: string, n = 1): void {
  const fish = { ...getFish(scene) };
  if (!fish[fishId]) return;
  fish[fishId] -= n;
  if (fish[fishId] <= 0) delete fish[fishId];
  scene.registry.set("fish", fish);
}

export function getCharacter(scene: Phaser.Scene): CharacterConfig {
  return scene.registry.get("character") as CharacterConfig;
}
export function setCharacter(scene: Phaser.Scene, cfg: CharacterConfig): void {
  scene.registry.set("character", cfg);
}

// ─── Roll a fish based on rod tier ────────────────────────────────────────────

export function rollFish(rodTier: number): Fish {
  const pool = FISH.filter((f) => f.minRod <= rodTier);
  const total = pool.reduce((s, f) => s + RARITY[f.rarity].weight, 0);
  let roll = Math.random() * total;
  for (const f of pool) {
    roll -= RARITY[f.rarity].weight;
    if (roll <= 0) return f;
  }
  return pool[0];
}
