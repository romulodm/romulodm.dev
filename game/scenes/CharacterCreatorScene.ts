import * as Phaser from "phaser";
import { FarmerCharacter } from "../character/FarmerCharacter";
import {
  SLOTS, SLOT_BY_CODE, parseFigure, serializeFigure,
  DEFAULT_FIGURE, type SlotCode, type FigureMap,
} from "../character/manifest";
import { setCharacter, getCharacter } from "../state";
import { START_SCENE } from "../config";

const W = 960, H = 600;
const PREVIEW_SCALE = 4;

// Estados de animação que o preview pode mostrar
type PreviewState = "idle" | "walk" | "fishing";
const STATES: { id: PreviewState; label: string }[] = [
  { id: "idle", label: "Parado" },
  { id: "walk", label: "Andando" },
  { id: "fishing", label: "Pescando" },
];

const DIRS = ["down", "left", "right", "up"];
const DIR_LABEL: Record<string, string> = { down: "Frente", left: "Esquerda", right: "Direita", up: "Costas" };

export default class CharacterCreatorScene extends Phaser.Scene {
  private figure!: FigureMap;
  private preview!: FarmerCharacter;
  private nameInput!: HTMLInputElement;

  private slotIndex: Record<SlotCode, number> = { bd: 0, ey: 0, hr: 0, ot: 0, ac: 0, tl: 0 };

  private dirIndex = 0;
  private stateIndex = 0;
  private dirLabel!: Phaser.GameObjects.Text;
  private stateLabel!: Phaser.GameObjects.Text;

  constructor() { super("CharacterCreatorScene"); }

  create() {
    const existing = getCharacter(this);
    const figStr = (existing as unknown as { figure?: string }).figure ?? DEFAULT_FIGURE;
    this.figure = parseFigure(figStr);

    for (const slot of SLOTS) {
      const currentId = this.figure[slot.code];
      const idx = currentId ? slot.items.findIndex((it) => it.id === currentId) : -1;
      this.slotIndex[slot.code] = Math.max(0, idx);
    }

    this.add.rectangle(0, 0, W, H, 0x1b2733).setOrigin(0);
    for (let x = 0; x < W; x += 32)
      for (let y = 0; y < H; y += 32)
        this.add.rectangle(x, y, 31, 31, 0x1e2d3d).setOrigin(0).setAlpha(0.4);

    this.add.text(W / 2, 30, "CRIE SEU PESCADOR", {
      fontFamily: "monospace", fontSize: "22px", color: "#f0c674",
    }).setOrigin(0.5);

    // ── Preview centralizado ────────────────────────────────────────────
    const boxX = 220, boxY = 300, boxW = 220, boxH = 320;
    this.add.rectangle(boxX, boxY, boxW, boxH, 0x10202c, 0.9).setStrokeStyle(2, 0x5a4632);

    // FarmerCharacter tem origem no centro do frame 32×64. Para centralizar
    // visualmente o corpo (que fica na metade de cima do frame), descemos um
    // pouco o container dentro da caixa.
    const charX = boxX;
    const charY = boxY + (16 * PREVIEW_SCALE) / 2; // empurra ~metade do gap pra baixo
    this.preview = new FarmerCharacter(this, charX, charY, figStr, PREVIEW_SCALE);
    this.preview.setDepth(10);
    this.refreshPreview();

    // ── Setas de rotação ────────────────────────────────────────────────
    this.dirLabel = this.add.text(boxX, boxY + boxH / 2 + 20, DIR_LABEL[DIRS[this.dirIndex]], {
      fontFamily: "monospace", fontSize: "13px", color: "#9fd0ee",
    }).setOrigin(0.5);
    this.rotArrow(boxX - 80, boxY + boxH / 2 + 20, -1);
    this.rotArrow(boxX + 80, boxY + boxH / 2 + 20, 1);

    // ── Botões de estado ────────────────────────────────────────────────
    this.stateLabel = this.add.text(boxX, boxY + boxH / 2 + 52, `Estado: ${STATES[this.stateIndex].label}`, {
      fontFamily: "monospace", fontSize: "13px", color: "#f0c674",
    }).setOrigin(0.5);
    this.stateArrow(boxX - 80, boxY + boxH / 2 + 52, -1);
    this.stateArrow(boxX + 80, boxY + boxH / 2 + 52, 1);

    // ── Seletores de aparência ──────────────────────────────────────────
    const cols = [560, 800];
    const rows = [140, 260, 380];
    const slotPos: [SlotCode, number, number][] = [
      ["bd", cols[0], rows[0]], ["ey", cols[1], rows[0]],
      ["hr", cols[0], rows[1]], ["ot", cols[1], rows[1]],
      ["ac", cols[0], rows[2]], ["tl", cols[1], rows[2]],
    ];
    for (const [code, cx, cy] of slotPos) this.buildSlotSelector(code, cx, cy);

    // ── Nome + jogar ─────────────────────────────────────────────────────
    this.add.text(680, 460, "Nome do personagem:", {
      fontFamily: "monospace", fontSize: "14px", color: "#9fd0ee",
    }).setOrigin(0.5);
    const existingName = (existing as unknown as { playerName?: string }).playerName ?? "";
    this.nameInput = this.createInput(680 - 130, 480, 260, existingName);

    const btn = this.add.text(680, 540, "[ JOGAR ]", {
      fontFamily: "monospace", fontSize: "20px", color: "#1b2733",
      backgroundColor: "#f0c674", padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => btn.setBackgroundColor("#ffd98a"));
    btn.on("pointerout", () => btn.setBackgroundColor("#f0c674"));
    btn.on("pointerdown", () => this.confirm());
    this.input.keyboard!.addKey("ENTER").on("down", () => this.confirm());
  }

  // ── Preview anim ────────────────────────────────────────────────────────

  private refreshPreview(): void {
    const dir = DIRS[this.dirIndex];
    const state = STATES[this.stateIndex].id;

    if (state === "fishing") {
      // Equipa a vara e mostra a animação de pesca se existir; senão idle.
      this.preview.equipTool("tl_fishing_rod");
      this.playOrFallback(`fishing-${dir}`, `idle-${dir}`);
    } else if (state === "walk") {
      this.playOrFallback(`walk-${dir}`, `idle-${dir}`);
    } else {
      this.playOrFallback(`idle-${dir}`, `walk-${dir}`);
    }
  }

  /** Toca animKey; se nenhuma camada tiver, cai para fallbackKey. */
  private playOrFallback(animKey: string, fallbackKey: string): void {
    const bodyId = this.figure.bd;
    const bodyTex = bodyId ? `char_${bodyId}` : "";
    if (bodyTex && this.anims.exists(`${bodyTex}_${animKey}`)) {
      this.preview.play(animKey);
    } else {
      this.preview.play(fallbackKey);
    }
  }

  private rotArrow(x: number, y: number, dir: -1 | 1): void {
    const t = this.add.text(x, y, dir < 0 ? "◀" : "▶", {
      fontFamily: "monospace", fontSize: "18px", color: "#f0c674",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on("pointerover", () => t.setColor("#ffd98a"));
    t.on("pointerout", () => t.setColor("#f0c674"));
    t.on("pointerdown", () => {
      this.dirIndex = (this.dirIndex + dir + DIRS.length) % DIRS.length;
      this.dirLabel.setText(DIR_LABEL[DIRS[this.dirIndex]]);
      this.refreshPreview();
    });
  }

  private stateArrow(x: number, y: number, dir: -1 | 1): void {
    const t = this.add.text(x, y, dir < 0 ? "◀" : "▶", {
      fontFamily: "monospace", fontSize: "16px", color: "#9fe07a",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on("pointerover", () => t.setColor("#bff0a0"));
    t.on("pointerout", () => t.setColor("#9fe07a"));
    t.on("pointerdown", () => {
      this.stateIndex = (this.stateIndex + dir + STATES.length) % STATES.length;
      this.stateLabel.setText(`Estado: ${STATES[this.stateIndex].label}`);
      // Sai da pesca → tira a vara (se o usuário não escolheu vara no slot tl)
      if (STATES[this.stateIndex].id !== "fishing") {
        this.preview.equipTool(this.figure.tl ?? null);
      }
      this.refreshPreview();
    });
  }

  // ── Seletores ─────────────────────────────────────────────────────────────

  private buildSlotSelector(code: SlotCode, cx: number, cy: number): void {
    const slot = SLOT_BY_CODE[code];
    this.add.text(cx, cy - 30, slot.label, {
      fontFamily: "monospace", fontSize: "12px", color: "#9fd0ee",
    }).setOrigin(0.5);
    const valueText = this.add.text(cx, cy, this.currentLabel(code), {
      fontFamily: "monospace", fontSize: "14px", color: "#e8e0c8",
    }).setOrigin(0.5);
    this.slotArrow(cx - 95, cy, -1, code, valueText);
    this.slotArrow(cx + 95, cy, 1, code, valueText);
  }

  private slotArrow(x: number, y: number, dir: -1 | 1, code: SlotCode, valueText: Phaser.GameObjects.Text): void {
    const t = this.add.text(x, y, dir < 0 ? "◀" : "▶", {
      fontFamily: "monospace", fontSize: "18px", color: "#f0c674",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on("pointerover", () => t.setColor("#ffd98a"));
    t.on("pointerout", () => t.setColor("#f0c674"));
    t.on("pointerdown", () => {
      const slot = SLOT_BY_CODE[code];
      const items = slot.required ? slot.items : [null, ...slot.items];
      this.slotIndex[code] = (this.slotIndex[code] + dir + items.length) % items.length;
      const picked = items[this.slotIndex[code]];
      const pickedId = picked ? picked.id : null;
      this.figure[code] = pickedId;
      this.preview.setSlot(code, pickedId);
      valueText.setText(this.currentLabel(code));
      this.refreshPreview();
    });
  }

  private currentLabel(code: SlotCode): string {
    const slot = SLOT_BY_CODE[code];
    const items = slot.required ? slot.items : [null, ...slot.items];
    const picked = items[this.slotIndex[code]];
    return picked ? picked.label : "— nenhum —";
  }

  // ── Input DOM ───────────────────────────────────────────────────────────

  private createInput(x: number, y: number, width: number, value: string): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text"; input.value = value; input.maxLength = 20; input.placeholder = "Seu nome";
    input.style.cssText = `position:absolute;font-family:monospace;font-size:16px;color:#e8e0c8;background:#10202c;border:2px solid #5a4632;border-radius:4px;padding:6px 10px;width:${width}px;outline:none;`;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / (this.game.config.width as number);
    const sy = rect.height / (this.game.config.height as number);
    input.style.left = `${rect.left + x * sx}px`;
    input.style.top = `${rect.top + y * sy}px`;
    document.body.appendChild(input);
    this.events.once("shutdown", () => input.remove());
    this.events.once("destroy", () => input.remove());
    return input;
  }

  private confirm(): void {
    const playerName = this.nameInput.value.trim() || "Pescador";
    const figureStr = serializeFigure(this.figure);
    setCharacter(this, {
      name: playerName, skin: "farmer", tint: 0xffffff,
      ...(this.registry.get("character") ?? {}),
      playerName, figure: figureStr,
    } as unknown as Parameters<typeof setCharacter>[1]);
    this.nameInput.remove();
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start("WorldScene", { sceneId: START_SCENE })
    );
  }
}