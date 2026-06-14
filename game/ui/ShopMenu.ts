import * as Phaser from "phaser";
import {
  getMoney, addMoney, getBait, addBait, getFish, addFish, removeFish,
  RODS, PRICES, FISH_BY_ID, RARITY, rollFish,
} from "../state";

export interface ShopOptions {
  /** Tabs to show. Trailer = ["vender"] only, cheaper via priceMultiplier. */
  tabs: Array<"iscas" | "varas" | "lootbox" | "vender">;
  priceMultiplier?: number; // applied to SELL value (e.g. 0.7 in the trailer)
  title?: string;
}

/** Overlay shop menu. Lives on the scene; pauses player via the scene flag. */
export class ShopMenu {
  private scene: Phaser.Scene;
  private opts: ShopOptions;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private tab: string;
  private lootResult = "";
  private onClose: () => void;
  public active = true;

  constructor(scene: Phaser.Scene, opts: ShopOptions, onClose: () => void) {
    this.scene = scene;
    this.opts = opts;
    this.onClose = onClose;
    this.tab = opts.tabs[0];
    this.rebuild();
  }

  close(): void {
    this.active = false;
    this.clear();
    this.onClose();
  }

  refresh(): void { if (this.active) this.rebuild(); }

  private clear(): void {
    this.objects.forEach((o) => (o as Phaser.GameObjects.GameObject & { destroy(): void }).destroy());
    this.objects = [];
  }

  private cam() { return this.scene.cameras.main; }

  private txt(x: number, y: number, s: string, style: Partial<Phaser.Types.GameObjects.Text.TextStyle>, ox = 0) {
    const t = this.scene.add.text(x, y, s, { fontFamily: "monospace", fontSize: "14px", color: "#e8e0c8", ...style })
      .setOrigin(ox, 0.5).setScrollFactor(0).setDepth(601);
    this.objects.push(t);
    return t;
  }

  private btn(x: number, y: number, label: string, cb: () => void, enabled = true) {
    const t = this.scene.add.text(x, y, label, {
      fontFamily: "monospace", fontSize: "13px",
      color: enabled ? "#1b2733" : "#888",
      backgroundColor: enabled ? "#f0c674" : "#54504a",
      padding: { x: 8, y: 4 },
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(601);
    if (enabled) {
      t.setInteractive({ useHandCursor: true });
      t.on("pointerover", () => t.setBackgroundColor("#ffd98a"));
      t.on("pointerout", () => t.setBackgroundColor("#f0c674"));
      t.on("pointerdown", cb);
    }
    this.objects.push(t);
    return t;
  }

  private rebuild(): void {
    this.clear();
    const W = this.cam().width, H = this.cam().height;
    const cx = W / 2;

    const panel = this.scene.add.rectangle(cx, H / 2, Math.min(660, W - 30), 460, 0x1b2733, 0.97)
      .setStrokeStyle(3, 0x5a4632).setScrollFactor(0).setDepth(600);
    this.objects.push(panel);

    this.txt(cx, H / 2 - 200, this.opts.title ?? "LOJA", { fontSize: "20px", color: "#f0c674" }, 0.5);
    this.txt(cx - 300, H / 2 - 200, `${getMoney(this.scene)}g`, { color: "#9fe07a" });

    // Tabs
    this.opts.tabs.forEach((id, i) => {
      const active = this.tab === id;
      const label = { iscas: "Iscas", varas: "Varas", lootbox: "Lootbox", vender: "Vender" }[id];
      const t = this.scene.add.text(cx - 280 + i * 145, H / 2 - 160, label, {
        fontFamily: "monospace", fontSize: "14px",
        color: active ? "#1b2733" : "#e8e0c8",
        backgroundColor: active ? "#9fd0ee" : "#3a4a58",
        padding: { x: 10, y: 6 },
      }).setScrollFactor(0).setDepth(601).setInteractive({ useHandCursor: true });
      t.on("pointerdown", () => { this.tab = id; this.rebuild(); });
      this.objects.push(t);
    });

    const top = H / 2 - 110;
    if (this.tab === "iscas") this.renderIscas(cx, top);
    else if (this.tab === "varas") this.renderVaras(cx, top);
    else if (this.tab === "lootbox") this.renderLootbox(cx, top);
    else if (this.tab === "vender") this.renderVender(cx, top);

    this.txt(cx, H / 2 + 200, "[ESC] fechar", { fontSize: "11px", color: "#9fd0ee" }, 0.5);
  }

  private renderIscas(cx: number, top: number) {
    this.txt(cx - 300, top, `Isca — ${PRICES.bait}g cada`, {});
    const m = getMoney(this.scene);
    this.btn(cx - 300, top + 48, `Comprar ×1 (${PRICES.bait}g)`, () => this.buyBait(1), m >= PRICES.bait);
    this.btn(cx - 60, top + 48, `Comprar ×10 (${PRICES.bait * 10}g)`, () => this.buyBait(10), m >= PRICES.bait * 10);
    this.txt(cx - 300, top + 92, `Iscas atuais: ${getBait(this.scene)}`, { color: "#9fd0ee", fontSize: "13px" });
  }

  private renderVaras(cx: number, top: number) {
    const owned = this.scene.registry.get("ownedRods") as number[];
    const m = getMoney(this.scene);
    let y = top;
    [2, 3].forEach((tier) => {
      const rod = RODS[tier];
      this.txt(cx - 300, y, `${rod.name} — barra +${rod.barBonus}`, {});
      if (owned.includes(tier)) this.txt(cx + 130, y, "✓ Adquirida", { color: "#9fe07a", fontSize: "13px" });
      else this.btn(cx + 100, y, `Comprar (${rod.price}g)`, () => this.buyRod(tier), m >= rod.price);
      y += 70;
    });
  }

  private renderLootbox(cx: number, top: number) {
    this.txt(cx - 300, top, `Caixa Misteriosa — ${PRICES.lootbox}g`, {});
    this.txt(cx - 300, top + 30, "Ouro, iscas, peixes ou uma vara!", { fontSize: "11px", color: "#9fd0ee" });
    this.btn(cx - 300, top + 76, `Abrir (${PRICES.lootbox}g)`, () => this.openLootbox(), getMoney(this.scene) >= PRICES.lootbox);
    if (this.lootResult) this.txt(cx - 300, top + 126, this.lootResult, { color: "#ffcf5a", fontSize: "15px" });
  }

  private renderVender(cx: number, top: number) {
    const mult = this.opts.priceMultiplier ?? 1;
    if (mult < 1) this.txt(cx - 300, top - 28, `(Preços a ${Math.round(mult * 100)}% — mais conveniente)`, { fontSize: "11px", color: "#ffb27a" });
    const fish = getFish(this.scene);
    const ids = Object.keys(fish);
    if (!ids.length) { this.txt(cx - 300, top, "Nenhum peixe no inventário.", { color: "#9fd0ee" }); return; }
    let y = top;
    ids.slice(0, 8).forEach((id) => {
      const f = FISH_BY_ID[id]; if (!f) return;
      const price = Math.round(f.value * mult);
      this.txt(cx - 300, y, `${f.name} ×${fish[id]}`, { color: RARITY[f.rarity].text });
      this.txt(cx - 80, y, `${price}g`, { color: "#9fe07a", fontSize: "13px" });
      this.btn(cx + 10, y, "Vender 1", () => this.sellFish(id, 1, price));
      this.btn(cx + 130, y, "Tudo", () => this.sellFish(id, fish[id], price));
      y += 42;
    });
  }

  private buyBait(n: number) {
    const cost = n * PRICES.bait;
    if (getMoney(this.scene) < cost) return;
    addMoney(this.scene, -cost); addBait(this.scene, n);
    this.scene.game.events.emit("toast", `+${n} isca(s)`, "#9fd0ee");
  }

  private buyRod(tier: number) {
    const rod = RODS[tier];
    if (getMoney(this.scene) < rod.price) return;
    addMoney(this.scene, -rod.price);
    const owned = [...(this.scene.registry.get("ownedRods") as number[]), tier];
    this.scene.registry.set("ownedRods", owned);
    this.scene.registry.set("rodTier", Math.max(...owned));
    this.scene.game.events.emit("toast", `${rod.name} equipada!`, "#9fe07a");
  }

  private sellFish(id: string, n: number, unitPrice: number) {
    const f = FISH_BY_ID[id]; if (!f) return;
    removeFish(this.scene, id, n);
    addMoney(this.scene, unitPrice * n);
    this.scene.game.events.emit("toast", `Vendido ${f.name} ×${n} (+${unitPrice * n}g)`, "#9fe07a");
  }

  private openLootbox() {
    if (getMoney(this.scene) < PRICES.lootbox) return;
    addMoney(this.scene, -PRICES.lootbox);
    const roll = Math.random();
    if (roll < 0.35) { const g = Phaser.Math.Between(20, 60); addMoney(this.scene, g); this.lootResult = `🪙 +${g}g!`; }
    else if (roll < 0.6) { addBait(this.scene, 5); this.lootResult = "🪱 +5 iscas!"; }
    else if (roll < 0.93) { const f = rollFish(3); addFish(this.scene, f.id, 1); this.lootResult = `🐟 ${f.name} (${RARITY[f.rarity].label})!`; }
    else {
      const owned = this.scene.registry.get("ownedRods") as number[];
      const next = !owned.includes(2) ? 2 : !owned.includes(3) ? 3 : null;
      if (next) {
        const updated = [...owned, next];
        this.scene.registry.set("ownedRods", updated);
        this.scene.registry.set("rodTier", Math.max(...updated));
        this.lootResult = `🎣 JACKPOT: ${RODS[next].name}!`;
      } else { addMoney(this.scene, 150); this.lootResult = "🪙 Jackpot: +150g!"; }
    }
    this.rebuild();
  }
}
