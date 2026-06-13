import * as Phaser from "phaser";
import { addFish, RARITY, RODS, type Fish } from "../state";

const W = 960;
const H = 600;

interface InitData { fish: Fish; parentKey: string }

export default class FishingMinigame extends Phaser.Scene {
  private fish!: Fish;
  private parentKey!: string;
  private barY = 0;
  private barH = 0;
  private barV = 0;
  private fishY = 0;
  private fishTarget = 0;
  private fishSpeed = 0;
  private retargetEvery = 0;
  private retargetTimer = 0;
  private progress = 28;
  private g!: Phaser.GameObjects.Graphics;
  private fishIcon!: Phaser.GameObjects.Image;
  private progressText!: Phaser.GameObjects.Text;
  private space!: Phaser.Input.Keyboard.Key;
  private pointerHeld = false;
  private finished = false;
  private trackTop = 0;
  private trackBottom = 0;
  private trackH = 0;
  private trackX = 0;

  constructor() { super("FishingMinigame"); }

  init(data: InitData) {
    this.fish = data.fish;
    this.parentKey = data.parentKey ?? "FishingScene";
  }

  create() {
    const fish = this.fish;
    const rodTier = this.registry.get("rodTier") as number;
    const rod = RODS[rodTier] ?? RODS[1];

    // Dim background
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0);

    // Track geometry
    this.trackX = W / 2 + 160;
    this.trackTop = 110;
    this.trackBottom = 470;
    this.trackH = this.trackBottom - this.trackTop;

    // Header
    this.add.rectangle(W / 2, 64, 440, 58, 0x1b2733, 0.95).setStrokeStyle(2, 0x5a4632);
    this.add.text(W / 2, 50, `🐟 Fisgou um ${fish.name}!`, {
      fontFamily: "monospace", fontSize: "18px", color: RARITY[fish.rarity].text,
    }).setOrigin(0.5);
    this.add.text(W / 2, 76, `${RARITY[fish.rarity].label} · Segure ESPAÇO`, {
      fontFamily: "monospace", fontSize: "12px", color: "#c9d6e0",
    }).setOrigin(0.5);

    // Bar
    this.barH = Phaser.Math.Clamp(100 - fish.difficulty * 10 + rod.barBonus, 38, 160);
    this.barY = this.trackBottom - this.barH;
    this.barV = 0;

    // Fish
    this.fishY = this.trackTop + this.trackH / 2;
    this.fishTarget = this.fishY;
    this.fishSpeed = 55 + fish.difficulty * 40;
    this.retargetEvery = 1500 - fish.difficulty * 180;

    this.g = this.add.graphics();
    this.fishIcon = this.add.image(this.trackX, this.fishY, "fish_icon")
      .setTint(fish.color).setScale(1.8);

    this.progressText = this.add.text(W / 2 - 160, 64, "", {
      fontFamily: "monospace", fontSize: "16px", color: "#9fe07a",
    }).setOrigin(0.5);

    this.space = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on("pointerdown", () => (this.pointerHeld = true));
    this.input.on("pointerup", () => (this.pointerHeld = false));

    this.finished = false;
  }

  private finish(success: boolean) {
    if (this.finished) return;
    this.finished = true;
    if (success) addFish(this, this.fish.id, 1);
    const parent = this.parentKey;
    const fish = this.fish;
    this.scene.stop();
    this.scene.resume(parent, { success, fish });
  }

  update(_t: number, delta: number) {
    if (this.finished) return;
    const dt = delta / 1000;

    // Bar physics
    const holding = this.space.isDown || this.pointerHeld;
    this.barV += (holding ? -700 : 540) * dt;
    this.barV = Phaser.Math.Clamp(this.barV, -280, 280);
    this.barY += this.barV * dt;
    if (this.barY < this.trackTop) { this.barY = this.trackTop; this.barV = 0; }
    if (this.barY + this.barH > this.trackBottom) { this.barY = this.trackBottom - this.barH; this.barV = 0; }

    // Fish movement
    this.retargetTimer += delta;
    if (this.retargetTimer >= this.retargetEvery) {
      this.retargetTimer = 0;
      this.fishTarget = Phaser.Math.Between(this.trackTop + 10, this.trackBottom - 10);
    }
    const dir = Math.sign(this.fishTarget - this.fishY);
    this.fishY += dir * this.fishSpeed * dt;
    this.fishY += Phaser.Math.FloatBetween(-1, 1) * this.fish.difficulty * 0.3;
    this.fishY = Phaser.Math.Clamp(this.fishY, this.trackTop, this.trackBottom);
    this.fishIcon.setY(this.fishY);

    // Progress
    const inside = this.fishY >= this.barY && this.fishY <= this.barY + this.barH;
    this.progress += (inside ? 28 : -20) * dt;
    this.progress = Phaser.Math.Clamp(this.progress, 0, 100);

    if (this.progress >= 100) return this.finish(true);
    if (this.progress <= 0) return this.finish(false);

    // Draw
    const g = this.g;
    g.clear();

    // Track bg
    g.fillStyle(0x0d1a26, 1);
    g.fillRoundedRect(this.trackX - 28, this.trackTop - 12, 56, this.trackH + 24, 10);
    g.lineStyle(2, 0x5a4632, 1);
    g.strokeRoundedRect(this.trackX - 28, this.trackTop - 12, 56, this.trackH + 24, 10);

    // Catch bar
    g.fillStyle(inside ? 0x6fd06f : 0x3a8a3a, 0.88);
    g.fillRoundedRect(this.trackX - 22, this.barY, 44, this.barH, 8);

    // Progress bar (left)
    const pbX = this.trackX - 72;
    g.fillStyle(0x0d1a26, 1);
    g.fillRoundedRect(pbX - 8, this.trackTop - 12, 16, this.trackH + 24, 6);
    const ph = (this.progress / 100) * (this.trackH + 20);
    g.fillStyle(0x6fd06f, 1);
    g.fillRoundedRect(pbX - 6, this.trackBottom + 8 - ph, 12, ph, 4);

    this.progressText.setText(`${Math.floor(this.progress)}%`);
  }
}
