import * as Phaser from "phaser";
import type { CharacterConfig } from "../state";

/**
 * A Character is a Phaser Container that stacks multiple sprite layers
 * (body, hair, outfit, hat …) so each combination renders without
 * pre-generating a new spritesheet.
 *
 * All layers share the same animation key — they play in lockstep.
 *
 * Usage:
 *   const player = new Character(scene, x, y, config);
 *   player.play("walk-down");
 *   player.setPart("outfit", "outfit_fishing");
 */
export class Character {
  public container: Phaser.GameObjects.Container;
  private layers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, config: CharacterConfig) {
    this.scene = scene;
    this.container = scene.add.container(x, y);

    // Base layer — always the character body/skin sheet
    // More layers (hair, outfit, hat) are added with addLayer()
    this.addLayer("body", config.skin, config.tint);
  }

  /** Add or replace a named layer. Order of insertion = render order. */
  addLayer(name: string, textureKey: string, tint = 0xffffff): this {
    // Remove existing layer with this name if present
    this.removeLayer(name);

    if (!this.scene.textures.exists(textureKey)) return this;

    const sprite = this.scene.add.sprite(0, 0, textureKey);
    sprite.setTint(tint);
    this.layers.set(name, sprite);
    this.container.add(sprite);
    return this;
  }

  removeLayer(name: string): this {
    const existing = this.layers.get(name);
    if (existing) {
      this.container.remove(existing, true);
      this.layers.delete(name);
    }
    return this;
  }

  /** Swap the texture on an existing layer without re-creating it. */
  setPart(name: string, textureKey: string): this {
    const layer = this.layers.get(name);
    if (layer && this.scene.textures.exists(textureKey)) {
      layer.setTexture(textureKey);
    }
    return this;
  }

  setTint(name: string, tint: number): this {
    this.layers.get(name)?.setTint(tint);
    return this;
  }

  /** Play the same animation key on every layer. */
  play(animKey: string): this {
    this.layers.forEach((sprite) => {
      // Each layer's anim key is prefixed with its texture key, e.g. "abby_walk-down"
      const fullKey = `${sprite.texture.key}_${animKey}`;
      if (this.scene.anims.exists(fullKey)) {
        sprite.play(fullKey, true);
      }
    });
    return this;
  }

  /** Stop all layer animations and snap to a specific frame. */
  stop(frame = 0): this {
    this.layers.forEach((sprite) => {
      sprite.anims.stop();
      sprite.setFrame(frame);
    });
    return this;
  }

  setScale(scale: number): this {
    this.container.setScale(scale);
    return this;
  }

  setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  get x(): number { return this.container.x; }
  get y(): number { return this.container.y; }

  setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  destroy(): void {
    this.container.destroy(true);
  }
}

// ─── Helper: register all animations for a spritesheet key ───────────────────
// Expects a 4×4 spritesheet (down / left / right / up) × 4 walk frames.
// frameWidth=32 frameHeight=48 for Abby.png
export function registerCharacterAnims(
  scene: Phaser.Scene,
  textureKey: string,
  frameWidth = 32,
  frameHeight = 48,
  frameRate = 8
): void {
  if (!scene.textures.exists(textureKey)) return;

  const make = (key: string, start: number, end: number) => {
    const fullKey = `${textureKey}_${key}`;
    if (!scene.anims.exists(fullKey)) {
      scene.anims.create({
        key: fullKey,
        frames: scene.anims.generateFrameNumbers(textureKey, { start, end }),
        frameRate,
        repeat: -1,
      });
    }
  };

  // Standard LimeZu 4×4 layout
  make("walk-down", 0, 3);
  make("walk-left", 4, 7);
  make("walk-right", 8, 11);
  make("walk-up", 12, 15);

  // Idle frames (first frame of each direction)
  make("idle-down", 0, 0);
  make("idle-left", 4, 4);
  make("idle-right", 8, 8);
  make("idle-up", 12, 12);
}
