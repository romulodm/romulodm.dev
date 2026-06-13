import * as Phaser from "phaser";
import { Character, registerCharacterAnims } from "../character/Character";
import { getCharacter, rollFish, getBait, addBait } from "../state";
import type { Fish } from "../state";

const W = 960;
const H = 600;

interface ResumeData { success: boolean; fish: Fish }

export default class FishingScene extends Phaser.Scene {
  private player!: Character;
  private playerBody!: Phaser.Physics.Arcade.Image;
  private romulo!: Phaser.GameObjects.Sprite;
  private water!: Phaser.GameObjects.TileSprite;
  private shimmer!: Phaser.GameObjects.TileSprite;
  private prompt!: Phaser.GameObjects.Text;
  private dialogue: { next: () => void } | null = null;
  private busy = false;
  private waterLineY = 480;
  private doorZone!: Phaser.Geom.Rectangle;
  private romuloZone!: Phaser.Geom.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private keyE!: Phaser.Input.Keyboard.Key;
  private facing = "down";

  constructor() { super("FishingScene"); }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ── Animated water ────────────────────────────────────────────────────
    this.water = this.add.tileSprite(0, 0, W, H, "water_tile").setOrigin(0);
    this.shimmer = this.add.tileSprite(0, 0, W, H, "water_tile").setOrigin(0).setAlpha(0.22);

    // ── Dock planks ───────────────────────────────────────────────────────
    this.add.tileSprite(60, 80, 840, 400, "plank_tile").setOrigin(0);

    // Pier posts
    for (let x = 80; x < 900; x += 60) {
      this.add.rectangle(x, 490, 8, 28, 0x5a3a1a).setOrigin(0.5, 0);
    }

    // ── World bounds = dock area ──────────────────────────────────────────
    this.physics.world.setBounds(76, 120, 808, 330);

    // ── Static colliders ──────────────────────────────────────────────────
    const addWall = (x: number, y: number, w: number, h: number) => {
      const r = this.add.rectangle(x, y, w, h, 0, 0);
      this.physics.add.existing(r, true);
      return r as unknown as Phaser.Physics.Arcade.StaticBody;
    };

    // Building facade
    this.add.rectangle(W / 2, 90, 200, 80, 0xd9c19a).setOrigin(0.5, 0);
    this.add.text(W / 2, 96, "LOJA DE PESCA", {
      fontFamily: "monospace", fontSize: "13px", color: "#5a3a1a",
      backgroundColor: "#f0c674aa", padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 0);

    const leftWall = addWall(W / 2 - 70, 148, 60, 60);
    const rightWall = addWall(W / 2 + 70, 148, 60, 60);

    // ── Door zone ─────────────────────────────────────────────────────────
    this.doorZone = new Phaser.Geom.Rectangle(W / 2 - 26, 130, 52, 60);

    // ── NPC Romulo ────────────────────────────────────────────────────────
    registerCharacterAnims(this, "abby");
    this.romulo = this.add.sprite(220, 340, "abby").setScale(2.5).setTint(0xa0c0a0);
    this.romulo.play("abby_idle-down");
    this.add.text(220, 298, "Romulo", {
      fontFamily: "monospace", fontSize: "11px", color: "#9fe07a",
      backgroundColor: "#1b2733aa", padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    this.romuloZone = new Phaser.Geom.Rectangle(155, 290, 130, 80);

    // ── Player (invisible physics body + visual Character) ────────────────
    const cfg = getCharacter(this);
    this.playerBody = this.physics.add.image(W / 2, 350, "__DEFAULT").setVisible(false);
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.body!.setSize(24, 16);

    this.player = new Character(this, W / 2, 350, cfg);
    this.player.setScale(2.5).setDepth(10);

    // Collide the invisible body with walls
    this.physics.add.collider(this.playerBody, [leftWall as any, rightWall as any]);

    // ── Prompt text ───────────────────────────────────────────────────────
    this.prompt = this.add.text(0, 0, "", {
      fontFamily: "monospace", fontSize: "13px", color: "#fff",
      backgroundColor: "#1b2733dd", padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(50).setVisible(false);

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.keyE = this.input.keyboard!.addKey("E");

    // ── Resume from minigame ──────────────────────────────────────────────
    this.onResume = (sys: unknown, data: ResumeData) => {
      this.busy = false;
      if (data?.success) {
        this.game.events.emit("toast", `🐟 Pescou: ${data.fish.name}!`, "#9fe07a");
      } else if (data) {
        this.game.events.emit("toast", "O peixe escapou...", "#ff8a8a");
      }
    };
    this.events.on("resume", this.onResume, this);
    this.events.once("shutdown", () => this.events.off("resume", this.onResume, this));

    this.game.events.emit("toast", "Pressione E perto da água para pescar", "#9fd0ee");
  }

  private onResume!: (sys: unknown, data: ResumeData) => void;

  update(_: number, delta: number) {
    // ── Animate water ─────────────────────────────────────────────────────
    this.water.tilePositionY += 0.15;
    this.shimmer.tilePositionX += 0.08;
    this.shimmer.tilePositionY -= 0.06;

    // ── Sync visual character to physics body ─────────────────────────────
    this.player.setPosition(this.playerBody.x, this.playerBody.y - 8);

    if (this.dialogue) {
      this.playerBody.setVelocity(0, 0);
      this.player.stop();
      this.prompt.setVisible(false);
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.dialogue.next();
      return;
    }
    if (this.busy) {
      this.playerBody.setVelocity(0, 0);
      this.player.stop();
      this.prompt.setVisible(false);
      return;
    }

    // ── Movement ──────────────────────────────────────────────────────────
    const speed = 180;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.keys["A"].isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.keys["D"].isDown) vx = speed;
    if (this.cursors.up.isDown || this.keys["W"].isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.keys["S"].isDown) vy = speed;

    this.playerBody.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) >= Math.abs(vy)) {
        this.facing = vx < 0 ? "left" : "right";
      } else {
        this.facing = vy < 0 ? "up" : "down";
      }
      this.player.play(`walk-${this.facing}`);
    } else {
      this.player.stop();
    }

    // ── Interaction detection ─────────────────────────────────────────────
    const px = this.playerBody.x;
    const py = this.playerBody.y;
    let action: { type: string; label: string } | null = null;

    if (Phaser.Geom.Rectangle.Contains(this.doorZone, px, py)) {
      action = { type: "shop", label: "[E] Entrar na loja" };
    } else if (Phaser.Geom.Rectangle.Contains(this.romuloZone, px, py)) {
      action = { type: "talk", label: "[E] Falar com Romulo" };
    } else if (py > this.waterLineY - 60) {
      action = { type: "fish", label: "[E] Pescar" };
    }

    if (action) {
      this.prompt.setText(action.label).setPosition(px, py - 50).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        if (action.type === "shop") this.enterShop();
        else if (action.type === "talk") this.startDialogue();
        else if (action.type === "fish") this.tryFish();
      }
    } else {
      this.prompt.setVisible(false);
    }
  }

  private startDialogue() {
    this.busy = true;
    const cfg = getCharacter(this);
    const lines = [
      `Romulo: Ei, ${cfg.name}! Bem-vindo ao píer.`,
      "Romulo: Segura ESPAÇO no minigame pra puxar a linha.",
      "Romulo: Mantém o peixe dentro da barra verde até encher.",
      "Romulo: Sem iscas? Dá um pulo na loja ali. Boa pesca!",
    ];
    let i = 0;

    const box = this.add.rectangle(W / 2, H - 70, 760, 96, 0x1b2733, 0.95)
      .setDepth(100).setStrokeStyle(3, 0x5a4632);
    const txt = this.add.text(W / 2 - 360, H - 104, lines[0], {
      fontFamily: "monospace", fontSize: "16px", color: "#e8e0c8", wordWrap: { width: 720 },
    }).setDepth(101);
    const hint = this.add.text(W / 2 + 360, H - 32, "[E] continuar", {
      fontFamily: "monospace", fontSize: "11px", color: "#9fd0ee",
    }).setOrigin(1, 1).setDepth(101);

    this.dialogue = {
      next: () => {
        i++;
        if (i >= lines.length) {
          box.destroy(); txt.destroy(); hint.destroy();
          this.dialogue = null;
          this.busy = false;
        } else {
          txt.setText(lines[i]);
        }
      },
    };
  }

  private tryFish() {
    if (getBait(this) <= 0) {
      this.game.events.emit("toast", "Sem iscas! Compre na loja.", "#ff8a8a");
      return;
    }
    this.busy = true;
    addBait(this, -1);

    const bx = this.playerBody.x;
    const by = this.waterLineY + 24;
    const bobber = this.add.image(bx, by, "bobber").setScale(2.5).setDepth(40);
    const bob = this.tweens.add({ targets: bobber, y: by - 5, yoyo: true, repeat: -1, duration: 500 });

    const fish = rollFish(this.registry.get("rodTier") as number);
    const wait = Phaser.Math.Between(800, 2200);

    this.time.delayedCall(wait, () => {
      const ex = this.add.text(bx, by - 32, "!", {
        fontFamily: "monospace", fontSize: "26px", color: "#ffcf5a",
      }).setOrigin(0.5).setDepth(41);

      this.time.delayedCall(400, () => {
        bob.remove(); bobber.destroy(); ex.destroy();
        this.scene.pause();
        this.scene.launch("FishingMinigame", { fish, parentKey: "FishingScene" });
        this.scene.bringToTop("FishingMinigame");
        this.scene.bringToTop("UIScene");
      });
    });
  }

  private enterShop() {
    if (this.busy) return;
    this.busy = true;
    this.cameras.main.fadeOut(240, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("ShopScene"));
  }
}
