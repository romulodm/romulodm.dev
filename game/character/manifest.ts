// ─────────────────────────────────────────────────────────────────────────────
// Character Asset Manifest
//
// Every customisable layer is declared here. To add a new item:
//   1. Drop the PNG in public/game/assets/characters/<Slot>/
//   2. Add an entry to the relevant SLOT array below.
//
// Figure string format (inspired by Habbo):
//   "bd-3.ey-brown.hr-unkept_brown_hazel.ot-braces_green.ac-straw_hat_cyan.tl-fishing_rod"
//
// Each segment is   <slotCode>-<itemId>
// ─────────────────────────────────────────────────────────────────────────────

export type SlotCode = "bd" | "ey" | "hr" | "ot" | "ac" | "tl";

export interface LayerItem {
  id: string;              // used in figure string
  label: string;           // shown in the UI
  textureKey: string;      // Phaser texture cache key
  path: string;            // public path relative to /game/assets/characters/
  frameWidth: number;
  frameHeight: number;
}

export interface Slot {
  code: SlotCode;
  label: string;           // "Corpo", "Olhos", etc.
  required: boolean;       // false = item can be removed ("none")
  items: LayerItem[];
}

// ── Sprite sheet constants ─────────────────────────────────────────────────
const FW = 32;  // frame width
const FH = 64;  // frame height (content 50px + 14px gap)

const BASE = "/game/assets/characters";

// ── Helper ─────────────────────────────────────────────────────────────────
function item(id: string, label: string, folder: string, file: string): LayerItem {
  return {
    id,
    label,
    textureKey: `char_${id}`,
    path: `${BASE}/${folder}/${file}`,
    frameWidth: FW,
    frameHeight: FH,
  };
}

// ─── Slots ────────────────────────────────────────────────────────────────────

export const SLOTS: Slot[] = [
  {
    code: "bd",
    label: "Corpo",
    required: true,
    items: [
      item("body_1", "Corpo 1", "Bodies", "Body_1.png"),
      item("body_2", "Corpo 2", "Bodies", "Body_2.png"),
      item("body_3", "Corpo 3", "Bodies", "Body_3.png"),
      item("body_4", "Corpo 4", "Bodies", "Body_4.png"),
      item("body_5", "Corpo 5", "Bodies", "Body_5.png"),
      item("body_6", "Corpo 6", "Bodies", "Body_6.png"),
      item("body_7", "Corpo 7", "Bodies", "Body_7.png"),
      item("body_8", "Corpo 8", "Bodies", "Body_8.png"),
      item("body_9", "Corpo 9", "Bodies", "Body_9.png"),
    ],
  },
  {
    code: "ey",
    label: "Olhos",
    required: true,
    items: [
      item("eyes_blue",   "Azul",       "Eyes", "Eyes_Blue.png"),
      item("eyes_brown",  "Castanho",   "Eyes", "Eyes_Brown.png"),
      item("eyes_gray",   "Cinza",      "Eyes", "Eyes_Gray.png"),
      item("eyes_green",  "Verde",      "Eyes", "Eyes_Green.png"),
      item("eyes_orange", "Laranja",    "Eyes", "Eyes_Orange.png"),
    ],
  },
  {
    code: "hr",
    label: "Cabelo",
    required: false,
    items: [
      item("hr_balding_blonde",       "Calvície Loiro",        "Hairstyles", "Hairstyle_Balding_Blonde.png"),
      item("hr_balding_blonde_ash",   "Calvície Loiro Cinza",  "Hairstyles", "Hairstyle_Balding_Blonde_Ash.png"),
      item("hr_balding_blue",         "Calvície Azul",         "Hairstyles", "Hairstyle_Balding_Blue.png"),
      item("hr_balding_brown_ash",    "Calvície Castanho Cinza","Hairstyles","Hairstyle_Balding_Brown_Ash.png"),
      item("hr_balding_brown_dark",   "Calvície Castanho Escuro","Hairstyles","Hairstyle_Balding_Brown_Dark.png"),
      item("hr_balding_brown_hazel",  "Calvície Castanho Avelã","Hairstyles","Hairstyle_Balding_Brown_Hazel.png"),
      item("hr_balding_brown_light",  "Calvície Castanho Claro","Hairstyles","Hairstyle_Balding_Brown_Light.png"),
      item("hr_balding_gray",         "Calvície Grisalho",     "Hairstyles", "Hairstyle_Balding_Gray.png"),
      item("hr_balding_orange",       "Calvície Ruivo",        "Hairstyles", "Hairstyle_Balding_Orange.png"),
      item("hr_long_blonde",          "Longo Loiro",           "Hairstyles", "Hairstyle_Long_Blonde.png"),
      item("hr_long_blonde_ash",      "Longo Loiro Cinza",     "Hairstyles", "Hairstyle_Long_Blonde_Ash.png"),
      item("hr_long_blue",            "Longo Azul",            "Hairstyles", "Hairstyle_Long_Blue.png"),
      item("hr_long_brown_ash",       "Longo Castanho Cinza",  "Hairstyles", "Hairstyle_Long_Brown_Ash.png"),
      item("hr_long_brown_dark",      "Longo Castanho Escuro", "Hairstyles", "Hairstyle_Long_Brown_Dark.png"),
      item("hr_long_brown_hazel",     "Longo Castanho Avelã",  "Hairstyles", "Hairstyle_Long_Brown_Hazel.png"),
      item("hr_long_brown_light",     "Longo Castanho Claro",  "Hairstyles", "Hairstyle_Long_Brown_Light.png"),
      item("hr_long_gray",            "Longo Grisalho",        "Hairstyles", "Hairstyle_Long_Gray.png"),
      item("hr_long_orange",          "Longo Ruivo",           "Hairstyles", "Hairstyle_Long_Orange.png"),
      item("hr_short_blonde",         "Curto Loiro",           "Hairstyles", "Hairstyle_Short_Blonde.png"),
      item("hr_short_blonde_ash",     "Curto Loiro Cinza",     "Hairstyles", "Hairstyle_Short_Blonde_Ash.png"),
      item("hr_short_blue",           "Curto Azul",            "Hairstyles", "Hairstyle_Short_Blue.png"),
      item("hr_short_brown_ash",      "Curto Castanho Cinza",  "Hairstyles", "Hairstyle_Short_Brown_Ash.png"),
      item("hr_short_brown_dark",     "Curto Castanho Escuro", "Hairstyles", "Hairstyle_Short_Brown_Dark.png"),
      item("hr_short_brown_hazel",    "Curto Castanho Avelã",  "Hairstyles", "Hairstyle_Short_Brown_Hazel.png"),
      item("hr_short_brown_light",    "Curto Castanho Claro",  "Hairstyles", "Hairstyle_Short_Brown_Light.png"),
      item("hr_short_gray",           "Curto Grisalho",        "Hairstyles", "Hairstyle_Short_Gray.png"),
      item("hr_short_orange",         "Curto Ruivo",           "Hairstyles", "Hairstyle_Short_Orange.png"),
      item("hr_tuft_blonde",          "Topete Loiro",          "Hairstyles", "Hairstyle_Tuft_Blonde.png"),
      item("hr_tuft_blonde_ash",      "Topete Loiro Cinza",    "Hairstyles", "Hairstyle_Tuft_Blonde_Ash.png"),
      item("hr_tuft_blue",            "Topete Azul",           "Hairstyles", "Hairstyle_Tuft_Blue.png"),
      item("hr_tuft_brown_ash",       "Topete Castanho Cinza", "Hairstyles", "Hairstyle_Tuft_Brown_Ash.png"),
      item("hr_tuft_brown_dark",      "Topete Castanho Escuro","Hairstyles", "Hairstyle_Tuft_Brown_Dark.png"),
      item("hr_tuft_brown_hazel",     "Topete Castanho Avelã", "Hairstyles", "Hairstyle_Tuft_Brown_Hazel.png"),
      item("hr_tuft_brown_light",     "Topete Castanho Claro", "Hairstyles", "Hairstyle_Tuft_Brown_Light.png"),
      item("hr_tuft_gray",            "Topete Grisalho",       "Hairstyles", "Hairstyle_Tuft_Gray.png"),
      item("hr_tuft_orange",          "Topete Ruivo",          "Hairstyles", "Hairstyle_Tuft_Orange.png"),
      item("hr_unkept_blonde",        "Despenteado Loiro",     "Hairstyles", "Hairstyle_Unkept_Blonde.png"),
      item("hr_unkept_blonde_ash",    "Despenteado Loiro Cinza","Hairstyles","Hairstyle_Unkept_Blonde_Ash.png"),
      item("hr_unkept_blue",          "Despenteado Azul",      "Hairstyles", "Hairstyle_Unkept_Blue.png"),
      item("hr_unkept_brown_ash",     "Despenteado Cast. Cinza","Hairstyles","Hairstyle_Unkept_Brown_Ash.png"),
      item("hr_unkept_brown_dark",    "Despenteado Cast. Escuro","Hairstyles","Hairstyle_Unkept_Brown_Dark.png"),
      item("hr_unkept_brown_hazel",   "Despenteado Cast. Avelã","Hairstyles","Hairstyle_Unkept_Brown_Hazel.png"),
      item("hr_unkept_brown_light",   "Despenteado Cast. Claro","Hairstyles","Hairstyle_Unkept_Brown_Light.png"),
      item("hr_unkept_gray",          "Despenteado Grisalho",  "Hairstyles", "Hairstyle_Unkept_Gray.png"),
      item("hr_unkept_orange",        "Despenteado Ruivo",     "Hairstyles", "Hairstyle_Unkept_Orange.png"),
    ],
  },
  {
    code: "ot",
    label: "Roupa",
    required: false,
    items: [
      item("ot_braces_brown",       "Suspensório Marrom",    "Outfits", "Outfit_Braces_Brown.png"),
      item("ot_braces_green",       "Suspensório Verde",     "Outfits", "Outfit_Braces_Green.png"),
      item("ot_braces_orange",      "Suspensório Laranja",   "Outfits", "Outfit_Braces_Orange.png"),
      item("ot_dungarees_black",    "Jardineira Preta",      "Outfits", "Outfit_Dungarees_Black.png"),
      item("ot_dungarees_green",    "Jardineira Verde",      "Outfits", "Outfit_Dungarees_Green.png"),
      item("ot_dungarees_red",      "Jardineira Vermelha",   "Outfits", "Outfit_Dungarees_Red.png"),
      item("ot_dungarees_violet",   "Jardineira Violeta",    "Outfits", "Outfit_Dungarees_Violet.png"),
      item("ot_laborer_blue",       "Trabalhador Azul",      "Outfits", "Outfit_Laborer_Blue.png"),
      item("ot_laborer_red",        "Trabalhador Vermelho",  "Outfits", "Outfit_Laborer_Red.png"),
      item("ot_laborer_violet",     "Trabalhador Violeta",   "Outfits", "Outfit_Laborer_Violet.png"),
      item("ot_vest_brown",         "Colete Marrom",         "Outfits", "Outfit_Vest_Brown.png"),
      item("ot_vest_brown_light",   "Colete Marrom Claro",   "Outfits", "Outfit_Vest_Brown_Light.png"),
      item("ot_vest_yellow",        "Colete Amarelo",        "Outfits", "Outfit_Vest_Yellow.png"),
    ],
  },
  {
    code: "ac",
    label: "Acessório",
    required: false,
    items: [
      item("ac_bamboo_brown",       "Chapéu Bambu Marrom",   "Accessories", "Accessory_Bamboo_Hat_Brown.png"),
      item("ac_bamboo_brown_dull",  "Chapéu Bambu Opaco",    "Accessories", "Accessory_Bamboo_Hat_Brown_Dull.png"),
      item("ac_gas_mask",           "Máscara de Gás",        "Accessories", "Accessory_Gas_Mask.png"),
      item("ac_straw_black",        "Palha Preto",           "Accessories", "Accessory_Straw_Hat_Black.png"),
      item("ac_straw_cyan",         "Palha Ciano",           "Accessories", "Accessory_Straw_Hat_Cyan.png"),
      item("ac_straw_green",        "Palha Verde",           "Accessories", "Accessory_Straw_Hat_Green.png"),
      item("ac_straw_red",          "Palha Vermelho",        "Accessories", "Accessory_Straw_Hat_Red.png"),
      item("ac_straw_violet",       "Palha Violeta",         "Accessories", "Accessory_Straw_Hat_Violet.png"),
    ],
  },
  {
    code: "tl",
    label: "Ferramenta",
    required: false,
    items: [
      item("tl_fishing_rod",        "Vara de Pesca",         "Tools", "Tool_Fishing_Rod.png"),
      // item("tl_axe",             "Machado",               "Tools", "Tool_Axe.png"),
      // item("tl_shovel",          "Pá",                    "Tools", "Tool_Shovel.png"),
    ],
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────

export const SLOT_BY_CODE: Record<SlotCode, Slot> =
  Object.fromEntries(SLOTS.map((s) => [s.code, s])) as Record<SlotCode, Slot>;

export const ITEM_BY_ID: Record<string, LayerItem & { slotCode: SlotCode }> =
  Object.fromEntries(
    SLOTS.flatMap((s) => s.items.map((it) => [it.id, { ...it, slotCode: s.code }]))
  );

/** Render order: body first, then layers on top in this sequence. */
export const LAYER_ORDER: SlotCode[] = ["bd", "ey", "hr", "ot", "ac", "tl"];

// ─── Figure string ─────────────────────────────────────────────────────────

export type FigureMap = Partial<Record<SlotCode, string | null>>;

/** Parse "bd-body_1.ey-eyes_blue.hr-hr_long_blonde" → { bd: "body_1", ... } */
export function parseFigure(fig: string): FigureMap {
  const out: FigureMap = {};
  if (!fig) return out;
  for (const seg of fig.split(".")) {
    const dash = seg.indexOf("-");
    if (dash < 0) continue;
    const code = seg.slice(0, dash) as SlotCode;
    const id   = seg.slice(dash + 1);
    out[code] = id || null;
  }
  return out;
}

/** Serialise { bd: "body_1", ey: "eyes_blue" } → "bd-body_1.ey-eyes_blue" */
export function serializeFigure(map: FigureMap): string {
  return LAYER_ORDER
    .filter((c) => map[c] != null)
    .map((c) => `${c}-${map[c]}`)
    .join(".");
}

/** Default figure used for new players. */
export const DEFAULT_FIGURE = "bd-body_1.ey-eyes_blue.hr-hr_short_brown_hazel.ot-ot_braces_green.ac-ac_straw_cyan";

/** Default figure WITH the fishing rod equipped. */
export const FISHING_FIGURE_SUFFIX = ".tl-tl_fishing_rod";
