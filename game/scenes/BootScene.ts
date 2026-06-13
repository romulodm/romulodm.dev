import * as Phaser from "phaser";
import { initState } from "../state";
import { registerCharacterAnims } from "../character/Character";

// Asset base path — all game assets live under /game/assets/ in the portfolio.
const A = (path: string) => `/game/assets/${path}`;

export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    // ── Loading bar ────────────────────────────────────────────────────────
    const bar = this.add.rectangle(480, 300, 0, 12, 0x9fd0ee).setOrigin(0, 0.5);
    const border = this.add.rectangle(480, 300, 320, 16).setOrigin(0.5).setStrokeStyle(1, 0x5a4632);
    this.add.text(480, 320, "Carregando...", {
      fontFamily: "monospace", fontSize: "13px", color: "#c9d6e0",
    }).setOrigin(0.5);
    this.load.on("progress", (p: number) => (bar.width = 320 * p));

    // ── Characters ────────────────────────────────────────────────────────
    // frameWidth=32 frameHeight=48 for LimeZu 128×192 sheets
    this.load.spritesheet("abby", A("characters/Abby.png"), {
      frameWidth: 32, frameHeight: 48,
    });
    // Add more character sheets here as you get them, e.g.:
    // this.load.spritesheet("alex", A("characters/Alex.png"), { frameWidth: 32, frameHeight: 48 });

    // ── Shop map (Tiled JSON) ─────────────────────────────────────────────
    this.load.tilemapTiledJSON("shop_map", A("maps/Fish.json"));

    // ── Tilesets used by Fish.json ────────────────────────────────────────
    this.load.image("ts_fishing", A("tilesets/9_Fishing.png"));
    this.load.image("ts_floors", A("tilesets/Floors_2_TILESET_A2_.png"));
    this.load.image("ts_grocery", A("tilesets/16_Grocery_store.png"));
    this.load.image("ts_walls2", A("tilesets/Walls_2_TILESET_A4_.png"));
    this.load.image("ts_generic", A("tilesets/1_Generic.png"));

    // ── Fishing scene decorative assets ───────────────────────────────────
    // Uncomment as you add the PNGs to the assets folder:
    // this.load.image("tileset_camping", A("tilesets/11_Camping_32x32.png"));
    // this.load.tilemapTiledJSON("fishing_map", A("maps/fishing_scene.json"));

    // Handle load errors gracefully — missing files fall back to procedural art
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[BootScene] Asset not found, using fallback: ${file.key}`);
    });
  }

  create() {
    initState(this.game);

    // ── Register character animations ──────────────────────────────────────
    // Works for any 4×4 LimeZu character sheet loaded above
    ["abby"].forEach((key) => registerCharacterAnims(this, key));

    // ── Procedural fallback textures ──────────────────────────────────────
    // Used automatically when a PNG failed to load (file not yet in assets/).
    this.makeFallbacks();

    // ── Start flow ────────────────────────────────────────────────────────
    this.scene.start("CharacterCreatorScene");
    this.scene.launch("UIScene");
    this.scene.bringToTop("UIScene");
  }

  // ── Procedural pixel-art fallbacks ────────────────────────────────────────
  private makeFallbacks() {
    const mk = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      if (this.textures.exists(key)) return; // real asset loaded, skip
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // Fallback player sprite (32×48, no animation — static)
    mk("abby", 128, 192, (g) => {
      // Draw a simple placeholder across all 16 frames (4×4 grid)
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const ox = col * 32;
          const oy = row * 48;
          g.fillStyle(0xe8b890); g.fillRect(ox + 10, oy + 4, 12, 16); // head
          g.fillStyle(0xc0392b); g.fillRect(ox + 8, oy + 20, 16, 16); // body
          g.fillStyle(0x2c5f8a); g.fillRect(ox + 8, oy + 36, 6, 10); // legs L
          g.fillStyle(0x2c5f8a); g.fillRect(ox + 18, oy + 36, 6, 10); // legs R
          g.fillStyle(0x6b4423); g.fillRect(ox + 8, oy + 2, 16, 6); // hair
        }
      }
    });

    // Water tile
    mk("water_tile", 32, 32, (g) => {
      g.fillStyle(0x2b6db0); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x3a83c6); g.fillRect(0, 0, 32, 14);
      g.fillStyle(0x9fd0ee, 0.6); g.fillRect(6, 8, 5, 1); g.fillRect(20, 4, 6, 1);
    });

    // Dock plank tile
    mk("plank_tile", 32, 32, (g) => {
      g.fillStyle(0x9c6b3f); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x7a5230); g.fillRect(0, 0, 32, 2); g.fillRect(0, 16, 32, 2);
      g.fillStyle(0x6b4626); g.fillRect(15, 0, 2, 32);
    });

    // Generic bobber
    mk("bobber", 8, 8, (g) => {
      g.fillStyle(0xc0392b); g.fillRect(0, 0, 8, 4);
      g.fillStyle(0xeeeeee); g.fillRect(0, 4, 8, 4);
    });

    // Fish silhouette (tintable)
    mk("fish_icon", 24, 14, (g) => {
      g.fillStyle(0xffffff); g.fillEllipse(11, 7, 18, 11);
      g.fillTriangle(18, 7, 24, 1, 24, 13);
      g.fillStyle(0x000000); g.fillCircle(5, 6, 1.3);
    });
  }
}
