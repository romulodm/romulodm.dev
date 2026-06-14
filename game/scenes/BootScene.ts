import * as Phaser from "phaser";
import { ASSET_MANIFEST, START_SCENE, DEFAULT_OPTIONS, type GameOptions } from "../config";
import { initState } from "../state";
import { registerCharacterAnims } from "../character/Character";
import { registerFarmerAnims } from "../character/FarmerCharacter";
import { SLOTS } from "../character/manifest";
import { loadSave } from "../save/save";

export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    const bar = this.add.rectangle(480, 300, 0, 12, 0x9fd0ee).setOrigin(0, 0.5);
    this.add.rectangle(480, 300, 322, 16).setStrokeStyle(1, 0x5a4632);
    this.add.text(480, 322, "Carregando...", {
      fontFamily: "monospace", fontSize: "13px", color: "#c9d6e0",
    }).setOrigin(0.5);
    this.load.on("progress", (p: number) => (bar.width = 320 * p));

    // ── Tilesets ────────────────────────────────────────────────────────
    const seen = new Set<string>();
    for (const ts of ASSET_MANIFEST.tilesets) {
      if (seen.has(ts.textureKey)) continue;
      seen.add(ts.textureKey);
      this.load.image(ts.textureKey, ts.path);
    }

    // ── Maps ────────────────────────────────────────────────────────────
    for (const m of ASSET_MANIFEST.maps) {
      this.load.tilemapTiledJSON(m.key, m.path);
    }

    // ── Legacy character (abby fallback) ─────────────────────────────
    for (const c of ASSET_MANIFEST.characters) {
      this.load.spritesheet(c.key, c.path, {
        frameWidth: c.frameWidth,
        frameHeight: c.frameHeight,
      });
    }

    // ── Farmer Generator assets ──────────────────────────────────────
    // Dedupe by textureKey — multiple items can share a sheet
    const seenChar = new Set<string>();
    for (const slot of SLOTS) {
      for (const item of slot.items) {
        if (seenChar.has(item.textureKey)) continue;
        seenChar.add(item.textureKey);
        this.load.spritesheet(item.textureKey, item.path, {
          frameWidth: item.frameWidth,
          frameHeight: item.frameHeight,
        });
      }
    }

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[Boot] asset not found (fallback will be used): ${file.key} @ ${file.url}`);
    });
  }

  async create() {
    const options = (this.registry.get("options") as GameOptions) ?? DEFAULT_OPTIONS;
    const save = await loadSave(options);
    initState(this.game, save);

    // ── Register legacy anims ──────────────────────────────────────────
    for (const c of ASSET_MANIFEST.characters) {
      if (this.textures.exists(c.key)) registerCharacterAnims(this, c.key);
    }

    // ── Register Farmer Generator anims ───────────────────────────────
    const seenAnim = new Set<string>();
    for (const slot of SLOTS) {
      for (const item of slot.items) {
        if (seenAnim.has(item.textureKey)) continue;
        seenAnim.add(item.textureKey);
        if (this.textures.exists(item.textureKey)) {
          registerFarmerAnims(this, item.textureKey);
        }
      }
    }

    this.makeFallbacks();

    this.scene.launch("UIScene");
    this.scene.bringToTop("UIScene");

    const char = this.registry.get("character") as { name: string; figure?: string };
    // Go to creator if no name OR no figure string yet
    if (!char?.name || char.name === "Pescador" || !char?.figure) {
      this.scene.start("CharacterCreatorScene");
    } else {
      this.scene.start("WorldScene", { sceneId: START_SCENE });
    }
  }

  private makeFallbacks() {
    // ── Abby fallback (canvas-based spritesheet) ─────────────────────
    if (!this.textures.exists("abby")) {
      const FW = 32, FH = 48, COLS = 4, ROWS = 4;
      const canvas = document.createElement("canvas");
      canvas.width = FW * COLS;
      canvas.height = FH * ROWS;
      const ctx = canvas.getContext("2d")!;
      const shirts = ["#c0392b", "#2980b9", "#27ae60", "#8e44ad"];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const ox = col * FW, oy = row * FH;
          ctx.fillStyle = "#6b4423"; ctx.fillRect(ox + 8, oy + 2, 16, 6);
          ctx.fillStyle = "#e8b890"; ctx.fillRect(ox + 10, oy + 4, 12, 16);
          ctx.fillStyle = "#333333";
          ctx.fillRect(ox + 12, oy + 8, 2, 2);
          ctx.fillRect(ox + 18, oy + 8, 2, 2);
          ctx.fillStyle = shirts[row]; ctx.fillRect(ox + 8, oy + 20, 16, 16);
          const shift = (col % 2) * 2;
          ctx.fillStyle = "#2c5f8a";
          ctx.fillRect(ox + 8, oy + 36 + shift, 6, 10 - shift);
          ctx.fillRect(ox + 18, oy + 36 - shift, 6, 10 - shift);
        }
      }
      this.textures.addSpriteSheet("abby", canvas as unknown as HTMLImageElement, {
        frameWidth: FW, frameHeight: FH,
      });
      registerCharacterAnims(this, "abby");
    }

    // ── Generic fallbacks ─────────────────────────────────────────────
    const mk = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      draw(g); g.generateTexture(key, w, h); g.destroy();
    };

    mk("bobber", 8, 8, (g) => {
      g.fillStyle(0xc0392b); g.fillRect(0, 0, 8, 4);
      g.fillStyle(0xeeeeee); g.fillRect(0, 4, 8, 4);
    });

    mk("fish_icon", 24, 14, (g) => {
      g.fillStyle(0xffffff); g.fillEllipse(11, 7, 18, 11);
      g.fillTriangle(18, 7, 24, 1, 24, 13);
      g.fillStyle(0x000000); g.fillCircle(5, 6, 1.3);
    });
  }
}