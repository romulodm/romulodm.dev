import * as Phaser from "phaser";
import type { CharacterConfig } from "../state";

/**
 * Stacks sprite layers (body, hair, outfit…) in a Container so any
 * combination renders without pre-baking a spritesheet. All layers play
 * the same animation key in lockstep.
 */
export class Character {
  public container: Phaser.GameObjects.Container;
  private layers = new Map<string, Phaser.GameObjects.Sprite>();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, config: CharacterConfig) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.addLayer("body", config.skin, config.tint);
  }

  addLayer(name: string, textureKey: string, tint = 0xffffff): this {
    this.removeLayer(name);
    if (!this.scene.textures.exists(textureKey)) return this;
    const sprite = this.scene.add.sprite(0, 0, textureKey).setTint(tint);
    this.layers.set(name, sprite);
    this.container.add(sprite);
    return this;
  }

  removeLayer(name: string): this {
    const s = this.layers.get(name);
    if (s) { this.container.remove(s, true); this.layers.delete(name); }
    return this;
  }

  setPart(name: string, textureKey: string): this {
    const layer = this.layers.get(name);
    if (layer && this.scene.textures.exists(textureKey)) layer.setTexture(textureKey);
    return this;
  }

  setTint(name: string, tint: number): this { this.layers.get(name)?.setTint(tint); return this; }

  play(animKey: string): this {
    this.layers.forEach((sprite) => {
      const full = `${sprite.texture.key}_${animKey}`;
      if (this.scene.anims.exists(full)) sprite.play(full, true);
    });
    return this;
  }

  stop(frame = 0): this {
    this.layers.forEach((s) => { s.anims.stop(); s.setFrame(frame); });
    return this;
  }

  setScale(scale: number): this { this.container.setScale(scale); return this; }
  setDepth(depth: number): this { this.container.setDepth(depth); return this; }
  setPosition(x: number, y: number): this { this.container.setPosition(x, y); return this; }
  get x(): number { return this.container.x; }
  get y(): number { return this.container.y; }
  destroy(): void { this.container.destroy(true); }
}

/** Register 4×4 LimeZu walk/idle anims for a character sheet. */
export function registerCharacterAnims(
  scene: Phaser.Scene, textureKey: string, frameRate = 8
): void {
  if (!scene.textures.exists(textureKey)) return;
  const mk = (key: string, start: number, end: number) => {
    const full = `${textureKey}_${key}`;
    if (scene.anims.exists(full)) return;
    scene.anims.create({
      key: full,
      frames: scene.anims.generateFrameNumbers(textureKey, { start, end }),
      frameRate, repeat: -1,
    });
  };
  mk("walk-down", 0, 3);  mk("walk-left", 4, 7);
  mk("walk-right", 8, 11); mk("walk-up", 12, 15);
  mk("idle-down", 0, 0);  mk("idle-left", 4, 4);
  mk("idle-right", 8, 8); mk("idle-up", 12, 12);
}
