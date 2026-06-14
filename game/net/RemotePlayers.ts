import * as Phaser from "phaser";
import { Character, registerCharacterAnims } from "../character/Character";
import type { PlayerState } from "./Network";

interface Remote {
  char: Character;
  label: Phaser.GameObjects.Text;
  targetX: number;
  targetY: number;
  anim: string;
  lastSeen: number;
}

/** Manages the sprites of every OTHER player in the current scene. */
export class RemotePlayers {
  private scene: Phaser.Scene;
  private players = new Map<string, Remote>();
  private scale: number;

  constructor(scene: Phaser.Scene, scale = 2) {
    this.scene = scene;
    this.scale = scale;
  }

  upsert(state: PlayerState): void {
    let r = this.players.get(state.id);
    if (!r) {
      // Ensure the skin's anims exist (in case this player uses a sheet we have)
      registerCharacterAnims(this.scene, state.skin);
      const char = new Character(this.scene, state.x, state.y, {
        name: state.name, skin: this.scene.textures.exists(state.skin) ? state.skin : "abby", tint: state.tint,
      }).setScale(this.scale).setDepth(9);
      const label = this.scene.add.text(state.x, state.y - 40, state.name, {
        fontFamily: "monospace", fontSize: "10px", color: "#9fd0ee",
        backgroundColor: "#1b2733aa", padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(20);
      r = { char, label, targetX: state.x, targetY: state.y, anim: state.anim, lastSeen: Date.now() };
      this.players.set(state.id, r);
    }
    r.targetX = state.x;
    r.targetY = state.y;
    r.anim = state.anim;
    r.lastSeen = Date.now();
  }

  remove(id: string): void {
    const r = this.players.get(id);
    if (r) { r.char.destroy(); r.label.destroy(); this.players.delete(id); }
  }

  update(): void {
    const now = Date.now();
    this.players.forEach((r, id) => {
      // Interpolate towards the last known position
      const nx = Phaser.Math.Linear(r.char.x, r.targetX, 0.2);
      const ny = Phaser.Math.Linear(r.char.y, r.targetY, 0.2);
      r.char.setPosition(nx, ny);
      r.label.setPosition(nx, ny - 40);

      if (r.anim.startsWith("walk")) r.char.play(r.anim);
      else r.char.stop();

      // Drop players we haven't heard from in 10s (stale)
      if (now - r.lastSeen > 10000) this.remove(id);
    });
  }

  clear(): void {
    this.players.forEach((r) => { r.char.destroy(); r.label.destroy(); });
    this.players.clear();
  }
}
