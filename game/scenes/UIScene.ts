import * as Phaser from "phaser";
import { RODS } from "../state";

export default class UIScene extends Phaser.Scene {
  private moneyText!: Phaser.GameObjects.Text;
  private baitText!: Phaser.GameObjects.Text;
  private rodText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private toasts: Phaser.GameObjects.Text[] = [];

  constructor() { super("UIScene"); }

  create() {
    const r = this.registry;

    this.add.rectangle(960 - 8, 8, 196, 90, 0x1b2733, 0.88).setOrigin(1, 0).setStrokeStyle(2, 0x5a4632);
    this.moneyText = this.add.text(960 - 16, 14, "", { fontFamily: "monospace", fontSize: "16px", color: "#f0c674" }).setOrigin(1, 0);
    this.baitText  = this.add.text(960 - 16, 34, "", { fontFamily: "monospace", fontSize: "13px", color: "#9fd0ee" }).setOrigin(1, 0);
    this.rodText   = this.add.text(960 - 16, 52, "", { fontFamily: "monospace", fontSize: "11px", color: "#c9d6e0" }).setOrigin(1, 0);
    this.levelText = this.add.text(960 - 16, 70, "", { fontFamily: "monospace", fontSize: "11px", color: "#d39bff" }).setOrigin(1, 0);
    this.nameText  = this.add.text(16, 14, "", { fontFamily: "monospace", fontSize: "14px", color: "#f0c674" }).setOrigin(0, 0);

    this.refresh();
    r.events.on("changedata", this.refresh, this);
    this.events.once("shutdown", () => r.events.off("changedata", this.refresh, this));

    this.game.events.on("toast", this.showToast, this);
    this.events.once("shutdown", () => this.game.events.off("toast", this.showToast, this));
  }

  private refresh = () => {
    const r = this.registry;
    this.moneyText.setText(`💰 ${r.get("money")}g`);
    this.baitText.setText(`🪱 Iscas: ${r.get("bait")}`);
    const rod = RODS[r.get("rodTier") as number] ?? RODS[1];
    this.rodText.setText(`🎣 ${rod.name}`);
    this.levelText.setText(`⭐ Nv ${r.get("level")} (${r.get("xp")} xp)`);
    const c = r.get("character") as { name: string } | undefined;
    this.nameText.setText(c?.name ?? "");
  };

  private showToast = (msg: string, color = "#ffffff") => {
    const y = 110 + this.toasts.length * 28;
    const t = this.add.text(480, y, msg, {
      fontFamily: "monospace", fontSize: "15px", color,
      backgroundColor: "#1b2733cc", padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 0).setDepth(1000);
    this.toasts.push(t);
    this.tweens.add({
      targets: t, y: y - 20, alpha: { from: 1, to: 0 }, delay: 1100, duration: 600,
      onComplete: () => { t.destroy(); this.toasts = this.toasts.filter((x) => x !== t); },
    });
  };
}
