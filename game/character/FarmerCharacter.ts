import * as Phaser from "phaser";
import {
  LAYER_ORDER, ITEM_BY_ID, parseFigure, serializeFigure,
  type FigureMap, type SlotCode,
} from "./manifest";

// ── Animation row map for the 56×11 spritesheet ───────────────────────────
// Measured: 11 rows, each 64px (50px content + 14px gap).
// Rows correspond to animation groups laid out by the Farmer Generator:
const ANIM_ROWS: Record<string, number> = {
  "idle-down":  0,
  "walk-down":  1,
  "walk-up":    2,
  "walk-left":  3,
  "walk-right": 3,  // mirrored left in the sheet; we flip X in Phaser
  // Additional rows (action animations) — extend as needed
  "action-1":   4,
  "action-2":   5,
  "action-3":   6,
};

// Frame counts per row (measured from pixel scan)
const ANIM_FRAMES: Record<string, number> = {
  "idle-down":  4,
  "walk-down":  24,
  "walk-up":    24,
  "walk-left":  36,
  "walk-right": 36,
  "action-1":   36,
};

const FW = 32;
const FRAME_RATE = 8;

/**
 * A character built from a Farmer Generator figure string.
 * Each slot is one Phaser.GameObjects.Sprite stacked in a Container.
 * Swapping a layer is O(1) — just change the texture on that sprite.
 */
export class FarmerCharacter {
  public container: Phaser.GameObjects.Container;

  private scene: Phaser.Scene;
  private sprites: Map<SlotCode, Phaser.GameObjects.Sprite> = new Map();
  private figure: FigureMap;
  private scale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, figure: string, scale = 2) {
    this.scene = scene;
    this.scale = scale;
    this.figure = parseFigure(figure);
    this.container = scene.add.container(x, y).setScale(scale);
    this.rebuildSprites();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /** Get the current figure string. */
  getFigure(): string { return serializeFigure(this.figure); }

  /** Change one slot by item id (e.g. "body_3"). Pass null to remove. */
  setSlot(code: SlotCode, itemId: string | null): void {
    this.figure[code] = itemId;
    const sprite = this.sprites.get(code);
    if (!itemId) {
      sprite?.setVisible(false);
      return;
    }
    const it = ITEM_BY_ID[itemId];
    if (!it) return;
    if (this.scene.textures.exists(it.textureKey)) {
      if (sprite) {
        sprite.setTexture(it.textureKey).setVisible(true);
      } else {
        this.addSprite(code, it.textureKey);
      }
    }
  }

  /** Equip / unequip the fishing rod layer. */
  equipTool(itemId: string | null): void { this.setSlot("tl", itemId); }

  /** Play an animation key on all layers simultaneously. */
  play(animKey: string): void {
    this.sprites.forEach((sprite, code) => {
      const it = ITEM_BY_ID[this.figure[code] ?? ""];
      if (!it) return;
      const fullKey = `${it.textureKey}_${animKey}`;
      if (this.scene.anims.exists(fullKey)) sprite.play(fullKey, true);
    });
  }

  stop(frame = 0): void {
    this.sprites.forEach((s) => { s.anims.stop(); s.setFrame(frame); });
  }

  setPosition(x: number, y: number): this { this.container.setPosition(x, y); return this; }
  setDepth(d: number): this { this.container.setDepth(d); return this; }
  setScale(s: number): this { this.container.setScale(s); return this; }
  get x(): number { return this.container.x; }
  get y(): number { return this.container.y; }
  destroy(): void { this.container.destroy(true); }

  // ── Internals ──────────────────────────────────────────────────────────

  private rebuildSprites(): void {
    this.container.removeAll(true);
    this.sprites.clear();
    for (const code of LAYER_ORDER) {
      const itemId = this.figure[code];
      if (!itemId) continue;
      const it = ITEM_BY_ID[itemId];
      if (!it || !this.scene.textures.exists(it.textureKey)) continue;
      this.addSprite(code, it.textureKey);
    }
  }

  private addSprite(code: SlotCode, textureKey: string): Phaser.GameObjects.Sprite {
    const sprite = this.scene.add.sprite(0, 0, textureKey).setFrame(0);
    this.sprites.set(code, sprite);
    // Maintain render order
    this.container.removeAll(false);
    for (const c of LAYER_ORDER) {
      const s = this.sprites.get(c);
      if (s) this.container.add(s);
    }
    return sprite;
  }
}

// ── Global anim registration ───────────────────────────────────────────────

/**
 * Register all animations for a given texture key (one layer of a character).
 * Called automatically when the BootScene loads a character spritesheet.
 * The 56-col×11-row sheet uses row 0..10, each col being one frame.
 */
export function registerFarmerAnims(scene: Phaser.Scene, textureKey: string): void {
  if (!scene.textures.exists(textureKey)) return;

  // frameAt(row, col) = row * 56 + col
  const COLS = 56;

  const mk = (key: string, row: number, count: number, flipX = false) => {
    const fullKey = `${textureKey}_${key}`;
    if (scene.anims.exists(fullKey)) return;
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = 0; i < count; i++) {
      frames.push({ key: textureKey, frame: row * COLS + i });
    }
    scene.anims.create({ key: fullKey, frames, frameRate: FRAME_RATE, repeat: -1 });
  };

  // Row 0: 4 frames idle (facing down)
  mk("idle-down",  0,  4);
  // Row 1-2: walk down and up
  mk("walk-down",  1, 24);
  mk("walk-up",    2, 24);
  // Row 3-4: walk left; we flip X for walk-right at play time
  mk("walk-left",  3, 36);
  mk("walk-right", 3, 36); // same frames, flipped by caller
  // Row 9: 8-frame idle for up/left/right
  mk("idle-up",    9,  8);
  mk("idle-side",  9,  8);

  // Idle variants for other directions (row 0 only has facing-down)
  // Use single frames as static idles for now
  scene.anims.create({ key: `${textureKey}_idle-left`,  frames: [{ key: textureKey, frame: 3 * COLS }], frameRate: 1, repeat: 0 });
  scene.anims.create({ key: `${textureKey}_idle-right`, frames: [{ key: textureKey, frame: 3 * COLS }], frameRate: 1, repeat: 0 });
}
