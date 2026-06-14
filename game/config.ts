// ─────────────────────────────────────────────────────────────────────────────
// Manifests — this is the ONLY file you edit to register new maps/tilesets.
// The engine (WorldScene) is fully generic and reads everything from Tiled.
// ─────────────────────────────────────────────────────────────────────────────

export interface TilesetEntry {
  /** Exact "name" of the tileset as it appears inside the Tiled JSON. */
  tiledName: string;
  /** Texture key used to load the PNG (any unique string). */
  textureKey: string;
  /** Public path to the PNG. */
  path: string;
}

export interface MapEntry {
  key: string;   // tilemap cache key
  path: string;  // public path to the Tiled JSON
}

export interface CharacterEntry {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
}

export interface SceneDef {
  /** Tilemap key from ASSET_MANIFEST.maps */
  mapKey: string;
  /** Optional display name shown in the HUD */
  title?: string;
}

// ── Tilesets ─────────────────────────────────────────────────────────────────
// tiledName = nome exato do tileset dentro do JSON exportado pelo Tiled
// textureKey = chave interna do Phaser (qualquer string única)
// path = caminho público do PNG em portfolio/public/
export const ASSET_MANIFEST = {
  tilesets: [
    // Interiores / loja de pesca
    { tiledName: "Room_Builder_32x32", textureKey: "ts_room", path: "/game/assets/tilesets/Room_Builder_32x32.png" },
    { tiledName: "9_Fishing_32x32", textureKey: "ts_fishing", path: "/game/assets/tilesets/9_Fishing_32x32.png" },
    { tiledName: "9_Fishing", textureKey: "ts_fishing", path: "/game/assets/tilesets/9_Fishing_32x32.png" },
    { tiledName: "16_Grocery_store_32x32", textureKey: "ts_grocery", path: "/game/assets/tilesets/16_Grocery_store_32x32.png" },
    { tiledName: "16_Grocery_store", textureKey: "ts_grocery", path: "/game/assets/tilesets/16_Grocery_store_32x32.png" },
    // Exteriores / camping / cidade
    { tiledName: "11_Camping_32x32", textureKey: "ts_camping", path: "/game/assets/tilesets/11_Camping_32x32.png" },
    { tiledName: "1_Terrains_and_Fences_32x32", textureKey: "ts_terrain", path: "/game/assets/tilesets/1_Terrains_and_Fences_32x32.png" },
    { tiledName: "5_Floor_Modular_Buildings_32x32", textureKey: "ts_buildings", path: "/game/assets/tilesets/5_Floor_Modular_Buildings_32x32.png" },
    { tiledName: "5_Fruit_Trees_32x32", textureKey: "ts_fruit", path: "/game/assets/tilesets/5_Fruit_Trees_32x32.png" },
    { tiledName: "6_Trees_32x32", textureKey: "ts_trees", path: "/game/assets/tilesets/6_Trees_32x32.png" },
    { tiledName: "Tractor_32x32", textureKey: "ts_tractor", path: "/game/assets/tilesets/Tractor_32x32.png" },
  ] as TilesetEntry[],

  // ── Maps ───────────────────────────────────────────────────────────────────
  maps: [
    { key: "city", path: "/game/assets/maps/City.json" },
    { key: "camping", path: "/game/assets/maps/Camping.json" },
    { key: "bait_shop", path: "/game/assets/maps/Fish.json" },
    { key: "hotel_room", path: "/game/assets/maps/HotelRoom.json" },
    { key: "trailer", path: "/game/assets/maps/Trailer.json" },
  ] as MapEntry[],

  // ── Characters ───────────────────────────────────────────────────────────
  // Farmer Generator assets são carregados pelo BootScene-additions.ts
  // Aqui só entra o Abby como fallback legado
  characters: [
    { key: "abby", path: "/game/assets/characters/Abby.png", frameWidth: 32, frameHeight: 48 },
  ] as CharacterEntry[],
};

// ── Scenes ───────────────────────────────────────────────────────────────────
export const SCENE_MANIFEST: Record<string, SceneDef> = {
  city: { mapKey: "city", title: "Cidade" },
  camping: { mapKey: "camping", title: "Camping" },
  bait_shop: { mapKey: "bait_shop", title: "Loja de Pesca" },
  hotel_room: { mapKey: "hotel_room", title: "Seu Quarto" },
  trailer: { mapKey: "trailer", title: "Trailer" },
};

/** Cena inicial — mude para "bait_shop" enquanto testa a loja. */
export const START_SCENE = "bait_shop";

// ── Runtime options passed from React ─────────────────────────────────────────
export interface GameOptions {
  multiplayer: boolean;
  wsUrl?: string;
  userId?: string;
  getToken?: () => Promise<string>;
  backendSave?: boolean;
}

export const DEFAULT_OPTIONS: GameOptions = { multiplayer: false };