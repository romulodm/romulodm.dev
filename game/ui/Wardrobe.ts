import * as Phaser from "phaser";
import { getCharacter, setCharacter } from "../state";

const TINTS = [
  { label: "Clara",  tint: 0xffffff },
  { label: "Média",  tint: 0xd4a574 },
  { label: "Morena", tint: 0xb07840 },
  { label: "Escura", tint: 0x7a4e28 },
];

/** Minimal wardrobe: change skin tint. Extend with more layers later. */
export class Wardrobe {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private onClose: (changed: boolean) => void;
  public active = true;
  private tintIndex = 0;
  private changed = false;

  constructor(scene: Phaser.Scene, onClose: (changed: boolean) => void) {
    this.scene = scene;
    this.onClose = onClose;
    const cur = getCharacter(scene);
    this.tintIndex = Math.max(0, TINTS.findIndex((t) => t.tint === cur.tint));
    this.build();
  }

  private build(): void {
    const W = this.scene.cameras.main.width, H = this.scene.cameras.main.height;
    const cx = W / 2, cy = H / 2;

    const panel = this.scene.add.rectangle(cx, cy, 420, 240, 0x1b2733, 0.97)
      .setStrokeStyle(3, 0x5a4632).setScrollFactor(0).setDepth(600);
    const title = this.scene.add.text(cx, cy - 90, "ARMÁRIO", {
      fontFamily: "monospace", fontSize: "18px", color: "#f0c674",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(601);
    const valueText = this.scene.add.text(cx, cy - 10, TINTS[this.tintIndex].label, {
      fontFamily: "monospace", fontSize: "16px", color: "#e8e0c8",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(601);

    const arrow = (x: number, dir: -1 | 1) => {
      const t = this.scene.add.text(x, cy - 10, dir < 0 ? "◀" : "▶", {
        fontFamily: "monospace", fontSize: "18px", color: "#f0c674",
      }).setOrigin(0.5).setScrollFactor(0).setDepth(601).setInteractive({ useHandCursor: true });
      t.on("pointerdown", () => {
        this.tintIndex = (this.tintIndex + dir + TINTS.length) % TINTS.length;
        valueText.setText(TINTS[this.tintIndex].label);
        const c = getCharacter(this.scene);
        setCharacter(this.scene, { ...c, tint: TINTS[this.tintIndex].tint });
        this.changed = true;
      });
      this.objects.push(t);
    };
    arrow(cx - 90, -1);
    arrow(cx + 90, 1);

    const done = this.scene.add.text(cx, cy + 70, "[ Pronto ]", {
      fontFamily: "monospace", fontSize: "15px", color: "#1b2733",
      backgroundColor: "#f0c674", padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(601).setInteractive({ useHandCursor: true });
    done.on("pointerdown", () => this.close());

    this.objects.push(panel, title, valueText, done);
  }

  close(): void {
    this.active = false;
    this.objects.forEach((o) => (o as Phaser.GameObjects.GameObject & { destroy(): void }).destroy());
    this.objects = [];
    this.onClose(this.changed);
  }
}
