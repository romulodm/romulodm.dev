import * as Phaser from "phaser";

/** A simple advance-on-key dialogue box. Calls onDone() when finished. */
export class Dialogue {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private lines: string[];
  private index = 0;
  private onDone: () => void;
  public active = true;

  constructor(scene: Phaser.Scene, speaker: string, lines: string[], onDone: () => void) {
    this.scene = scene;
    this.lines = lines.length ? lines : ["..."];
    this.onDone = onDone;

    const cam = scene.cameras.main;
    const W = cam.width, H = cam.height;

    const box = scene.add.rectangle(W / 2, H - 70, Math.min(760, W - 40), 96, 0x1b2733, 0.96)
      .setStrokeStyle(3, 0x5a4632).setScrollFactor(0).setDepth(500);
    const name = scene.add.text(W / 2 - 360, H - 110, speaker, {
      fontFamily: "monospace", fontSize: "13px", color: "#9fe07a",
    }).setScrollFactor(0).setDepth(501);
    this.text = scene.add.text(W / 2 - 360, H - 90, "", {
      fontFamily: "monospace", fontSize: "16px", color: "#e8e0c8", wordWrap: { width: 700 },
    }).setScrollFactor(0).setDepth(501);
    const hint = scene.add.text(W / 2 + 360, H - 32, "[E] continuar", {
      fontFamily: "monospace", fontSize: "11px", color: "#9fd0ee",
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(501);

    this.objects.push(box, name, this.text, hint);
    this.render();
  }

  private text!: Phaser.GameObjects.Text;

  private render(): void { this.text.setText(this.lines[this.index]); }

  /** Advance to next line; closes when past the last line. */
  advance(): void {
    this.index++;
    if (this.index >= this.lines.length) this.close();
    else this.render();
  }

  private close(): void {
    this.active = false;
    this.objects.forEach((o) => (o as Phaser.GameObjects.GameObject & { destroy(): void }).destroy());
    this.objects = [];
    this.onDone();
  }
}
