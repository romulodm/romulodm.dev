import * as Phaser from "phaser";
import { Character } from "../character/Character";
import {
  getCharacter, getMoney, addMoney, getBait, addBait,
  getFish, addFish, removeFish,
  RODS, PRICES, FISH_BY_ID, RARITY, rollFish,
} from "../state";

const W = 960;
const H = 600;
// The Fish.json map is 480×512 @ 16px tiles.
// We zoom ×2 so it fills the 960px canvas width, and the camera scrolls vertically.
const MAP_ZOOM = 2;

export default class ShopScene extends Phaser.Scene {
  private player!: Character;
  private playerBody!: Phaser.Physics.Arcade.Image;
  private map!: Phaser.Tilemaps.Tilemap;
  private prompt!: Phaser.GameObjects.Text;
  private menuOpen = false;
  private menuTab = "iscas";
  private menuObjects: Phaser.GameObjects.GameObject[] = [];
  private lootResult = "";
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>;
  private zoneDoor!: Phaser.Geom.Rectangle;
  private zoneCounter!: Phaser.Geom.Rectangle;

  constructor() { super("ShopScene"); }

  create() {
    this.cameras.main.fadeIn(240, 0, 0, 0);

    // ── Tiled map ─────────────────────────────────────────────────────────
    this.map = this.make.tilemap({ key: "shop_map" });

    // addTilesetImage(name in JSON, texture key loaded in BootScene)
    const tsArr = [
      this.map.addTilesetImage("Fishing", "ts_fishing"),
      this.map.addTilesetImage("Walls_Floor", "ts_floors"),
      this.map.addTilesetImage("16_Grocery_store", "ts_grocery"),
      this.map.addTilesetImage("Walls_2_TILESET_A4_", "ts_walls2"),
      this.map.addTilesetImage("1_Generic", "ts_generic"),
      this.map.addTilesetImage("9_Fishing", "ts_fishing"), // duplicate name, same texture
    ].filter(Boolean) as Phaser.Tilemaps.Tileset[];

    // Visual layers
    this.map.createLayer("Floor_and_Walls", tsArr, 0, 0);
    this.map.createLayer("Moveis", tsArr, 0, 0);
    this.map.createLayer("Moveis_2", tsArr, 0, 0);

    // Collision layer (invisible)
    const colLayer = this.map.createLayer("Colision", tsArr, 0, 0);
    if (colLayer) {
      colLayer.setVisible(false);
      colLayer.setCollisionByExclusion([-1]);
    }

    // ── Camera zoom + bounds ──────────────────────────────────────────────
    this.cameras.main.setZoom(MAP_ZOOM);
    this.cameras.main.setBounds(
      0, 0,
      this.map.widthInPixels * MAP_ZOOM,
      this.map.heightInPixels * MAP_ZOOM
    );

    // ── Read spawn point from Object Layer ────────────────────────────────
    const spawnObj = this.map.findObject(
      "Camada de Objetos 1",
      (o: Phaser.Types.Tilemaps.TiledObject) => o.name === "player_spawn"
    );
    const spawnX = spawnObj?.x ?? 240;
    const spawnY = spawnObj?.y ?? 490;

    // ── Player ────────────────────────────────────────────────────────────
    const cfg = getCharacter(this);

    // Physics body (invisible)
    this.playerBody = this.physics.add.image(spawnX, spawnY, "__DEFAULT").setVisible(false);
    this.playerBody.body!.setSize(16, 10);
    this.playerBody.setCollideWorldBounds(true);

    if (colLayer) {
      this.physics.add.collider(this.playerBody, colLayer);
    }

    // Set world bounds to match the map (pre-zoom coords)
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Visual character
    this.player = new Character(this, spawnX, spawnY, cfg);
    this.player.setScale(1.6).setDepth(10);

    // Camera follows player
    this.cameras.main.startFollow(this.playerBody, true, 0.12, 0.12);

    // ── Interaction zones from Object Layer ───────────────────────────────
    this.zoneDoor = this.getZone("door") ?? new Phaser.Geom.Rectangle(224, 490, 48, 16);
    this.zoneCounter = this.getZone("counter") ?? new Phaser.Geom.Rectangle(224, 200, 80, 16);

    // ── Prompt ────────────────────────────────────────────────────────────
    this.prompt = this.add.text(0, 0, "", {
      fontFamily: "monospace", fontSize: "11px", color: "#fff",
      backgroundColor: "#1b2733dd", padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setDepth(50).setScrollFactor(0).setVisible(false);

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.keyE = this.input.keyboard!.addKey("E");
    this.keyEsc = this.input.keyboard!.addKey("ESC");

    this.registry.events.on("changedata", () => { if (this.menuOpen) this.rebuildMenu(); }, this);
    this.events.once("shutdown", () => this.registry.events.off("changedata", undefined, this));
  }

  private getZone(name: string): Phaser.Geom.Rectangle | null {
    const obj = this.map.findObject(
      "Camada de Objetos 1",
      (o: Phaser.Types.Tilemaps.TiledObject) => o.name === name
    );
    if (!obj) return null;
    return new Phaser.Geom.Rectangle(obj.x!, obj.y!, obj.width ?? 32, obj.height ?? 16);
  }

  update() {
    this.player.setPosition(this.playerBody.x, this.playerBody.y - 6);

    if (this.menuOpen) {
      this.playerBody.setVelocity(0, 0);
      this.player.stop();
      if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) this.closeMenu();
      return;
    }

    const speed = 120;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasdKeys["A"].isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasdKeys["D"].isDown) vx = speed;
    if (this.cursors.up.isDown || this.wasdKeys["W"].isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.wasdKeys["S"].isDown) vy = speed;

    this.playerBody.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      const dir = Math.abs(vx) >= Math.abs(vy)
        ? (vx < 0 ? "left" : "right")
        : (vy < 0 ? "up" : "down");
      this.player.play(`walk-${dir}`);
    } else {
      this.player.stop();
    }

    const px = this.playerBody.x;
    const py = this.playerBody.y;

    let action: { type: string; label: string } | null = null;

    if (Phaser.Geom.Rectangle.Contains(this.zoneDoor, px, py)) {
      action = { type: "exit", label: "[E] Sair" };
    } else if (Phaser.Geom.Rectangle.Contains(this.zoneCounter, px, py)) {
      action = { type: "counter", label: "[E] Abrir loja" };
    }

    if (action) {
      // Prompt is screen-space, convert world pos to screen pos
      const cam = this.cameras.main;
      const sx = (px - cam.worldView.x) * MAP_ZOOM;
      const sy = (py - 20 - cam.worldView.y) * MAP_ZOOM;
      this.prompt.setText(action.label).setPosition(sx, sy).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        if (action.type === "exit") this.exitShop();
        else if (action.type === "counter") this.openMenu();
      }
    } else {
      this.prompt.setVisible(false);
    }
  }

  // ── Menu ─────────────────────────────────────────────────────────────────

  private openMenu() { this.menuOpen = true; this.playerBody.setVelocity(0, 0); this.rebuildMenu(); }
  private closeMenu() { this.menuOpen = false; this.clearMenu(); }

  private clearMenu() {
    this.menuObjects.forEach((o) => (o as Phaser.GameObjects.GameObject & { destroy: () => void }).destroy());
    this.menuObjects = [];
  }

  private add2(obj: Phaser.GameObjects.GameObject) {
    this.menuObjects.push(obj);
    return obj;
  }

  private txt(x: number, y: number, s: string, style: object, ox = 0, oy = 0.5) {
    return this.add2(
      this.add.text(x, y, s, { fontFamily: "monospace", fontSize: "14px", color: "#e8e0c8", ...style })
        .setOrigin(ox, oy).setDepth(201).setScrollFactor(0)
    ) as Phaser.GameObjects.Text;
  }

  private btn(x: number, y: number, label: string, cb: () => void, enabled = true) {
    const t = this.add.text(x, y, label, {
      fontFamily: "monospace", fontSize: "13px",
      color: enabled ? "#1b2733" : "#888",
      backgroundColor: enabled ? "#f0c674" : "#54504a",
      padding: { x: 8, y: 4 },
    }).setOrigin(0, 0.5).setDepth(201).setScrollFactor(0);
    if (enabled) {
      t.setInteractive({ useHandCursor: true });
      t.on("pointerover", () => t.setBackgroundColor("#ffd98a"));
      t.on("pointerout", () => t.setBackgroundColor("#f0c674"));
      t.on("pointerdown", cb);
    }
    this.menuObjects.push(t);
    return t;
  }

  private rebuildMenu() {
    this.clearMenu();
    const cx = W / 2, money = getMoney(this);

    const panel = this.add.rectangle(cx, H / 2, 660, 460, 0x1b2733, 0.97)
      .setStrokeStyle(3, 0x5a4632).setDepth(200).setScrollFactor(0);
    this.menuObjects.push(panel);

    this.txt(cx, 120, "LOJA DE PESCA", { fontSize: "20px", color: "#f0c674" }, 0.5);
    this.txt(cx - 310, 120, `${money}g`, { color: "#9fe07a" });

    // Tabs
    const tabs = [["iscas", "Iscas"], ["varas", "Varas"], ["lootbox", "Lootbox"], ["vender", "Vender"]];
    tabs.forEach(([id, label], i) => {
      const active = this.menuTab === id;
      const t = this.add.text(cx - 280 + i * 145, 160, label, {
        fontFamily: "monospace", fontSize: "14px",
        color: active ? "#1b2733" : "#e8e0c8",
        backgroundColor: active ? "#9fd0ee" : "#3a4a58",
        padding: { x: 10, y: 6 },
      }).setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });
      t.on("pointerdown", () => { this.menuTab = id; this.rebuildMenu(); });
      this.menuObjects.push(t);
    });

    const top = 210;
    if (this.menuTab === "iscas") this.renderIscas(cx, top);
    else if (this.menuTab === "varas") this.renderVaras(cx, top);
    else if (this.menuTab === "lootbox") this.renderLootbox(cx, top);
    else if (this.menuTab === "vender") this.renderVender(cx, top);

    this.txt(cx, 510, "[ESC] fechar", { fontSize: "11px", color: "#9fd0ee" }, 0.5);
  }

  private renderIscas(cx: number, top: number) {
    this.txt(cx - 300, top, `Isca — ${PRICES.bait}g cada`, {});
    const m = getMoney(this);
    this.btn(cx - 300, top + 50, `Comprar ×1 (${PRICES.bait}g)`, () => this.buyBait(1), m >= PRICES.bait);
    this.btn(cx - 60, top + 50, `Comprar ×10 (${PRICES.bait * 10}g)`, () => this.buyBait(10), m >= PRICES.bait * 10);
    this.txt(cx - 300, top + 96, `Iscas atuais: ${getBait(this)}`, { color: "#9fd0ee" });
  }

  private renderVaras(cx: number, top: number) {
    const owned = this.registry.get("ownedRods") as number[];
    const m = getMoney(this);
    let y = top;
    [2, 3].forEach((tier) => {
      const rod = RODS[tier];
      this.txt(cx - 300, y, `${rod.name} — barra +${rod.barBonus}`, {});
      if (owned.includes(tier)) {
        this.txt(cx + 130, y, "✓ Adquirida", { color: "#9fe07a" });
      } else {
        this.btn(cx + 100, y, `Comprar (${rod.price}g)`, () => this.buyRod(tier), m >= rod.price);
      }
      y += 70;
    });
    this.txt(cx - 300, y + 4, "A melhor vara é equipada automaticamente.", { fontSize: "11px", color: "#9fd0ee" });
  }

  private renderLootbox(cx: number, top: number) {
    this.txt(cx - 300, top, `Caixa Misteriosa — ${PRICES.lootbox}g`, {});
    this.txt(cx - 300, top + 30, "Pode conter ouro, iscas, peixes ou uma vara!", { fontSize: "11px", color: "#9fd0ee" });
    this.btn(cx - 300, top + 76, `Abrir caixa (${PRICES.lootbox}g)`, () => this.openLootbox(), getMoney(this) >= PRICES.lootbox);
    if (this.lootResult) {
      this.txt(cx - 300, top + 130, this.lootResult, { color: "#ffcf5a", fontSize: "15px" });
    }
  }

  private renderVender(cx: number, top: number) {
    const fish = getFish(this);
    const ids = Object.keys(fish);
    if (ids.length === 0) {
      this.txt(cx - 300, top, "Nenhum peixe no inventário.", { color: "#9fd0ee" });
      return;
    }
    let y = top;
    ids.slice(0, 8).forEach((id) => {
      const f = FISH_BY_ID[id]; if (!f) return;
      this.txt(cx - 300, y, `${f.name} ×${fish[id]}`, { color: RARITY[f.rarity].text });
      this.txt(cx - 70, y, `${f.value}g`, { color: "#9fe07a" });
      this.btn(cx + 10, y, "Vender 1", () => this.sellFish(id, 1));
      this.btn(cx + 130, y, "Tudo", () => this.sellFish(id, fish[id]));
      y += 42;
    });
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  private buyBait(n: number) {
    const cost = n * PRICES.bait;
    if (getMoney(this) < cost) return;
    addMoney(this, -cost); addBait(this, n);
    this.game.events.emit("toast", `+${n} isca(s)`, "#9fd0ee");
  }

  private buyRod(tier: number) {
    const rod = RODS[tier];
    if (getMoney(this) < rod.price) return;
    addMoney(this, -rod.price);
    const owned = [...(this.registry.get("ownedRods") as number[]), tier];
    this.registry.set("ownedRods", owned);
    this.registry.set("rodTier", Math.max(...owned));
    this.game.events.emit("toast", `${rod.name} equipada!`, "#9fe07a");
  }

  private sellFish(id: string, n: number) {
    const f = FISH_BY_ID[id]; if (!f) return;
    removeFish(this, id, n);
    addMoney(this, f.value * n);
    this.game.events.emit("toast", `Vendido ${f.name} ×${n} (+${f.value * n}g)`, "#9fe07a");
  }

  private openLootbox() {
    if (getMoney(this) < PRICES.lootbox) return;
    addMoney(this, -PRICES.lootbox);
    const roll = Math.random();
    if (roll < 0.35) {
      const g = Phaser.Math.Between(20, 60); addMoney(this, g);
      this.lootResult = `🪙 +${g}g!`;
    } else if (roll < 0.6) {
      addBait(this, 5);
      this.lootResult = "🪱 +5 iscas!";
    } else if (roll < 0.93) {
      const f = rollFish(3); addFish(this, f.id, 1);
      this.lootResult = `🐟 ${f.name} (${RARITY[f.rarity].label})!`;
    } else {
      const owned = this.registry.get("ownedRods") as number[];
      const next = !owned.includes(2) ? 2 : !owned.includes(3) ? 3 : null;
      if (next) {
        const updated = [...owned, next];
        this.registry.set("ownedRods", updated);
        this.registry.set("rodTier", Math.max(...updated));
        this.lootResult = `🎣 JACKPOT: ${RODS[next].name}!`;
      } else {
        addMoney(this, 150);
        this.lootResult = "🪙 Jackpot convertido: +150g!";
      }
    }
    this.rebuildMenu();
  }

  private exitShop() {
    this.cameras.main.fadeOut(240, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("FishingScene"));
  }
}
