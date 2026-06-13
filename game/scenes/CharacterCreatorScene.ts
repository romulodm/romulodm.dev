import * as Phaser from "phaser";
import { getCharacter, setCharacter, DEFAULT_CHARACTER, type CharacterConfig } from "../state";

const W = 960;
const H = 600;

// Skin tint options — extend as you add more character sheets
const SKIN_TINTS = [
  { label: "Clara", tint: 0xffffff },
  { label: "Média", tint: 0xd4a574 },
  { label: "Morena", tint: 0xb07840 },
  { label: "Escura", tint: 0x7a4e28 },
];

// Available character spritesheets — add more as you get them from LimeZu
const SKINS = [
  { key: "abby", label: "Abby" },
  // { key: "alex", label: "Alex" },  // uncomment when you add Alex.png
];

export default class CharacterCreatorScene extends Phaser.Scene {
  private preview!: Phaser.GameObjects.Sprite;
  private nameInput!: HTMLInputElement;
  private config!: CharacterConfig;
  private skinIndex = 0;
  private tintIndex = 0;
  private animTimer = 0;
  private directions = ["walk-down", "walk-left", "walk-right", "walk-up"];
  private dirIndex = 0;

  constructor() { super("CharacterCreatorScene"); }

  create() {
    this.config = { ...getCharacter(this) };

    // ── Background ────────────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x1b2733).setOrigin(0);
    // Decorative tiles hint
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        this.add.rectangle(x, y, 31, 31, 0x1e2d3d).setOrigin(0).setAlpha(0.5);
      }
    }

    // ── Title ─────────────────────────────────────────────────────────────
    this.add.text(W / 2, 48, "CRIE SEU PERSONAGEM", {
      fontFamily: "monospace", fontSize: "22px", color: "#f0c674",
    }).setOrigin(0.5);

    // ── Preview panel ─────────────────────────────────────────────────────
    const panelX = W / 2 - 180;
    this.add.rectangle(panelX, H / 2, 220, 300, 0x10202c, 0.9)
      .setStrokeStyle(2, 0x5a4632);

    this.preview = this.add.sprite(panelX, H / 2 + 10, "abby")
      .setScale(4)
      .setFrame(0);
    this.playPreviewAnim();

    // ── Options panel ─────────────────────────────────────────────────────
    const ox = W / 2 + 40;
    let oy = 160;

    this.makeSelector(ox, oy, "Personagem", SKINS.map(s => s.label),
      this.skinIndex, (i) => {
        this.skinIndex = i;
        this.config.skin = SKINS[i].key;
        this.preview.setTexture(SKINS[i].key).setFrame(0);
        this.playPreviewAnim();
      });
    oy += 80;

    this.makeSelector(ox, oy, "Tom de Pele", SKIN_TINTS.map(t => t.label),
      this.tintIndex, (i) => {
        this.tintIndex = i;
        this.config.tint = SKIN_TINTS[i].tint;
        this.preview.setTint(SKIN_TINTS[i].tint);
      });
    oy += 80;

    // ── Name input ────────────────────────────────────────────────────────
    this.add.text(ox - 120, oy, "Nome:", {
      fontFamily: "monospace", fontSize: "15px", color: "#e8e0c8",
    }).setOrigin(0, 0.5);

    this.nameInput = this.createNameInput(ox - 120, oy + 28, 240, this.config.name);
    oy += 90;

    // ── Start button ──────────────────────────────────────────────────────
    const btn = this.add.text(W / 2, H - 70, "[ COMEÇAR A JOGAR ]", {
      fontFamily: "monospace", fontSize: "20px", color: "#1b2733",
      backgroundColor: "#f0c674", padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => btn.setBackgroundColor("#ffd98a"));
    btn.on("pointerout", () => btn.setBackgroundColor("#f0c674"));
    btn.on("pointerdown", () => this.startGame());

    // Keyboard shortcut
    this.input.keyboard!.addKey("ENTER").on("down", () => this.startGame());

    // ── Walk preview cycle ────────────────────────────────────────────────
    this.time.addEvent({
      delay: 1200,
      callback: () => {
        this.dirIndex = (this.dirIndex + 1) % this.directions.length;
        this.playPreviewAnim();
      },
      loop: true,
    });
  }

  private playPreviewAnim() {
    const key = `${this.config.skin}_${this.directions[this.dirIndex]}`;
    if (this.anims.exists(key)) {
      this.preview.play(key);
    }
    this.preview.setTint(this.config.tint);
  }

  private makeSelector(
    x: number, y: number,
    label: string, options: string[],
    initialIndex: number,
    onChange: (i: number) => void
  ) {
    let current = initialIndex;

    this.add.text(x - 120, y - 18, label, {
      fontFamily: "monospace", fontSize: "13px", color: "#9fd0ee",
    }).setOrigin(0, 0.5);

    const valueText = this.add.text(x, y + 8, options[current], {
      fontFamily: "monospace", fontSize: "16px", color: "#e8e0c8",
    }).setOrigin(0.5);

    const makeArrow = (cx: number, dir: -1 | 1) => {
      const t = this.add.text(cx, y + 8, dir < 0 ? "◀" : "▶", {
        fontFamily: "monospace", fontSize: "16px", color: "#f0c674",
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on("pointerdown", () => {
        current = (current + dir + options.length) % options.length;
        valueText.setText(options[current]);
        onChange(current);
      });
      t.on("pointerover", () => t.setColor("#ffd98a"));
      t.on("pointerout", () => t.setColor("#f0c674"));
    };

    makeArrow(x - 80, -1);
    makeArrow(x + 80, 1);
  }

  private createNameInput(x: number, y: number, width: number, defaultValue: string): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    input.value = defaultValue;
    input.maxLength = 16;
    input.style.cssText = `
      position: absolute;
      font-family: monospace;
      font-size: 16px;
      color: #e8e0c8;
      background: #10202c;
      border: 2px solid #5a4632;
      border-radius: 4px;
      padding: 6px 10px;
      width: ${width}px;
      outline: none;
    `;

    // Position relative to the canvas
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / this.game.config.width as number;
    const scaleY = rect.height / this.game.config.height as number;
    input.style.left = `${rect.left + x * scaleX}px`;
    input.style.top = `${rect.top + y * scaleY}px`;

    document.body.appendChild(input);

    // Remove the DOM element when the scene is destroyed
    this.events.once("shutdown", () => input.remove());
    this.events.once("destroy", () => input.remove());

    return input;
  }

  private startGame() {
    const name = this.nameInput.value.trim() || DEFAULT_CHARACTER.name;
    this.config.name = name;
    setCharacter(this, this.config);

    this.nameInput.remove();

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("FishingScene");
    });
  }
}
