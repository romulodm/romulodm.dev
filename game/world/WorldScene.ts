import * as Phaser from "phaser";
import { Character } from "../character/Character";
import { FarmerCharacter } from "../character/FarmerCharacter";
import { Network, type PlayerState } from "../net/Network";
import { RemotePlayers } from "../net/RemotePlayers";
import { Dialogue } from "../ui/Dialogue";
import { ShopMenu } from "../ui/ShopMenu";
import { Wardrobe } from "../ui/Wardrobe";
import { readProps, objectKind, type TiledProps } from "./tiled";
import { ASSET_MANIFEST, SCENE_MANIFEST, type GameOptions, DEFAULT_OPTIONS } from "../config";
import {
  getCharacter, getBait, addBait, rollFish, serialize, type Fish,
} from "../state";
import { persistSave } from "../save/save";

interface InitData { sceneId: string; spawnName?: string }

/** Common surface implemented by both Character and FarmerCharacter. */
type PlayerChar = {
  play(anim: string): unknown;
  stop(frame?: number): unknown;
  setPosition(x: number, y: number): unknown;
  setDepth(d: number): unknown;
  setFacing?(dir: string): void;
  destroy(): void;
  x: number; y: number;
};

interface Interactable {
  kind: string;
  rect: Phaser.Geom.Rectangle;
  props: TiledProps;
  name: string;
}

export default class WorldScene extends Phaser.Scene {
  private sceneId = "city";
  private spawnName?: string;
  private map?: Phaser.Tilemaps.Tilemap;
  private zoom = 2;

  private player!: PlayerChar;
  private body!: Phaser.Physics.Arcade.Image;
  private collisionLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  private wallGroups: Phaser.Physics.Arcade.StaticGroup[] = [];
  private interactables: Interactable[] = [];
  private prompt!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  private facing = "down";
  private busy = false;
  private modal: Dialogue | ShopMenu | Wardrobe | null = null;

  private net!: Network;
  private remotes!: RemotePlayers;
  private lastPublish = 0;

  constructor() { super("WorldScene"); }

  private get options(): GameOptions {
    return (this.registry.get("options") as GameOptions) ?? DEFAULT_OPTIONS;
  }

  init(data: InitData) {
    this.sceneId = data?.sceneId ?? "city";
    this.spawnName = data?.spawnName;
    this.busy = false;
    this.modal = null;
    this.collisionLayers = [];
    this.wallGroups = [];
    this.interactables = [];
  }

  create() {
    this.cameras.main.fadeIn(220, 0, 0, 0);
    const def = SCENE_MANIFEST[this.sceneId];

    // ── Build map (or fallback) ───────────────────────────────────────────
    let spawnX = 480, spawnY = 300;
    if (def && this.cache.tilemap.exists(def.mapKey)) {
      this.buildMap(def.mapKey);
      const sp = this.resolveSpawn();
      spawnX = sp.x; spawnY = sp.y;
    } else {
      this.buildFallback();
    }

    // ── Player ────────────────────────────────────────────────────────────
    const cfg = getCharacter(this) as { skin?: string; tint?: number; figure?: string; name?: string };
    this.body = this.physics.add.image(spawnX, spawnY, "__WHITE").setVisible(false);
    this.body.body!.setSize(16, 12);
    this.body.setCollideWorldBounds(true);
    // Tile-based collision layers
    this.collisionLayers.forEach((l) => this.physics.add.collider(this.body, l));
    // Object-based collision groups (walls / collision object layers)
    this.wallGroups.forEach((g) => this.physics.add.collider(this.body, g));

    // Layered Farmer Generator character if the player created one; else legacy.
    if (cfg.figure) {
      this.player = new FarmerCharacter(this, spawnX, spawnY, cfg.figure, this.zoom) as unknown as PlayerChar;
      this.player.setDepth(10);
    } else {
      this.player = new Character(this, spawnX, spawnY, {
        name: cfg.name ?? "Pescador", skin: cfg.skin ?? "abby", tint: cfg.tint ?? 0xffffff,
      }).setScale(this.zoom).setDepth(10) as unknown as PlayerChar;
    }
    this.cameras.main.startFollow(this.body, true, 0.12, 0.12);

    // ── Prompt (screen space) ─────────────────────────────────────────────
    this.prompt = this.add.text(0, 0, "", {
      fontFamily: "monospace", fontSize: "12px", color: "#fff",
      backgroundColor: "#1b2733dd", padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(120).setVisible(false);

    // ── Input ─────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.keyE = this.input.keyboard!.addKey("E");
    this.keyEsc = this.input.keyboard!.addKey("ESC");

    // ── Networking (shared instance lives on the registry) ────────────────
    this.net = this.registry.get("network") as Network;
    if (!this.net) {
      this.net = new Network(this.options);
      this.registry.set("network", this.net);
      this.net.connect();
    }
    this.remotes = new RemotePlayers(this, this.zoom);
    this.net.onPublication = (s: PlayerState) => this.remotes.upsert(s);
    this.net.onLeave = (id: string) => this.remotes.remove(id);
    this.net.joinScene(this.sceneId);

    this.events.once("shutdown", () => {
      this.net.leaveScene();
      this.remotes.clear();
    });

    // ── Resume from fishing minigame ──────────────────────────────────────
    this.events.on("resume", (_sys: unknown, data?: { success: boolean; fish: Fish }) => {
      this.busy = false;
      if (data?.success) {
        this.game.events.emit("toast", `🐟 Pescou: ${data.fish.name}!`, "#9fe07a");
        this.playCatchAnim(data.fish);
        this.autosave();
      } else if (data) {
        this.game.events.emit("toast", "O peixe escapou...", "#ff8a8a");
      }
    });
  }

  // ── Map building ────────────────────────────────────────────────────────

  private buildMap(mapKey: string) {
    const map = this.make.tilemap({ key: mapKey });
    this.map = map;

    // Connect each tileset referenced in the JSON to a loaded texture.
    const tsObjs: Phaser.Tilemaps.Tileset[] = [];
    map.tilesets.forEach((ts) => {
      const entry = ASSET_MANIFEST.tilesets.find((e) => e.tiledName === ts.name);
      const textureKey = entry?.textureKey ?? `ts_${ts.name}`;
      const added = map.addTilesetImage(ts.name, this.textures.exists(textureKey) ? textureKey : undefined);
      if (added) tsObjs.push(added);
    });

    // Create every tile layer in order; wire collision.
    map.layers.forEach((ld) => {
      const layer = map.createLayer(ld.name, tsObjs, 0, 0);
      if (!layer) return;
      const lname = ld.name.toLowerCase();
      if (lname.includes("colis") || lname.includes("collision")) {
        layer.setVisible(false);
        layer.setCollisionByExclusion([-1]);
        this.collisionLayers.push(layer);
      } else {
        layer.setCollisionByProperty({ collides: true });
        this.collisionLayers.push(layer);
      }
    });

    // Camera + world bounds
    // Camera + world bounds. Bounds are in WORLD pixels (not multiplied by
    // zoom). With zoom >= 2 the map fills the viewport and follow() centers it.
    this.cameras.main.setZoom(this.zoom);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.roundPixels = true;
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.readObjects(map);
  }

  private buildFallback() {
    // No map asset yet — draw a simple room so the engine still runs.
    if (!this.textures.exists("plank_tile")) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x9c6b3f); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x7a5230); g.fillRect(0, 0, 32, 2); g.fillRect(0, 16, 32, 2);
      g.generateTexture("plank_tile", 32, 32); g.destroy();
    }
    this.add.tileSprite(0, 0, 960, 640, "plank_tile").setOrigin(0);
    this.add.text(480, 40, `Mapa "${this.sceneId}" ainda não criado no Tiled`, {
      fontFamily: "monospace", fontSize: "14px", color: "#ffcf5a",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.zoom = 2;
    this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(0, 0, 960, 640);
    this.physics.world.setBounds(40, 40, 880, 560);

    // A demo "door" back to city and a fishing spot so it's testable.
    this.interactables.push({
      kind: "fishing", name: "fishing",
      rect: new Phaser.Geom.Rectangle(360, 360, 240, 200), props: {},
    });
  }

  private resolveSpawn(): { x: number; y: number } {
    if (!this.map) return { x: 480, y: 300 };
    // 1) named spawn requested by the door we came through
    if (this.spawnName) {
      const named = this.findObject((o, p) => o.name === this.spawnName || p.spawn === this.spawnName);
      if (named) return { x: named.x ?? 480, y: named.y ?? 300 };
    }
    // 2) default spawn object
    const def = this.findObject((o, p) => objectKind(o, p) === "spawn");
    if (def) return { x: def.x ?? 480, y: def.y ?? 300 };
    // 3) map center
    return { x: this.map.widthInPixels / 2, y: this.map.heightInPixels / 2 };
  }

  private findObject(
    pred: (o: Phaser.Types.Tilemaps.TiledObject, p: TiledProps) => boolean
  ): Phaser.Types.Tilemaps.TiledObject | undefined {
    if (!this.map) return undefined;
    for (const layer of this.map.objects) {
      for (const obj of layer.objects) {
        if (pred(obj, readProps(obj))) return obj;
      }
    }
    return undefined;
  }

  private readObjects(map: Phaser.Tilemaps.Tilemap) {
    // A wall is any object whose kind/name is a collision keyword — works no
    // matter which object layer it lives in (so one shared layer is fine).
    const WALL_KINDS = new Set(["wall", "walls", "collision", "colisao", "colisão", "colis"]);
    const group = this.physics.add.staticGroup();
    let hasWalls = false;

    for (const layer of map.objects) {
      for (const obj of layer.objects) {
        const props = readProps(obj);
        const kind = objectKind(obj, props);

        // ── Collision objects (any layer) ────────────────────────────────
        if (WALL_KINDS.has(kind)) {
          hasWalls = true;
          const x = obj.x ?? 0, y = obj.y ?? 0;
          const w = obj.width ?? 16, h = obj.height ?? 16;

          if (obj.polygon || obj.polyline) {
            // Arcade is AABB-only: use the polygon's bounding box.
            const pts = (obj.polygon ?? obj.polyline)!;
            const xs = pts.map((p) => (p.x ?? 0) + x);
            const ys = pts.map((p) => (p.y ?? 0) + y);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            const bw = Math.max(4, maxX - minX), bh = Math.max(4, maxY - minY);
            const r = this.add.rectangle(minX + bw / 2, minY + bh / 2, bw, bh, 0x000000, 0);
            this.physics.add.existing(r, true);
            group.add(r);
          } else {
            // Rectangle or ellipse → bounding rectangle collider.
            const r = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0);
            this.physics.add.existing(r, true);
            group.add(r);
          }
          continue; // never an interactable
        }

        // ── Spawn handled separately ─────────────────────────────────────
        if (kind === "spawn") continue;

        // ── Everything else = interactable ───────────────────────────────
        const w = obj.width ?? map.tileWidth;
        const h = obj.height ?? map.tileHeight;
        this.interactables.push({
          kind, props, name: obj.name ?? "",
          rect: new Phaser.Geom.Rectangle(obj.x ?? 0, obj.y ?? 0, w || 16, h || 16),
        });
      }
    }

    if (hasWalls) this.wallGroups.push(group);
    else group.destroy(true);
  }

  // ── Update loop ───────────────────────────────────────────────────────────

  update(time: number, _delta: number) {
    // Modal overlays capture input
    if (this.modal) {
      this.body.setVelocity(0, 0);
      this.player.stop();
      this.prompt.setVisible(false);
      if (this.modal instanceof Dialogue) {
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.modal.advance();
      } else if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
        (this.modal as ShopMenu | Wardrobe).close();
      }
      this.remotes.update();
      return;
    }

    if (this.busy) {
      this.body.setVelocity(0, 0);
      this.player.stop();
      this.prompt.setVisible(false);
      this.remotes.update();
      return;
    }

    // Movement
    const speed = 150;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd["A"].isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasd["D"].isDown) vx = speed;
    if (this.cursors.up.isDown || this.wasd["W"].isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.wasd["S"].isDown) vy = speed;
    this.body.setVelocity(vx, vy);

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      this.facing = Math.abs(vx) >= Math.abs(vy) ? (vx < 0 ? "left" : "right") : (vy < 0 ? "up" : "down");
      this.player.play(`walk-${this.facing}`);
    } else {
      this.player.stop();
    }
    this.player.setPosition(this.body.x, this.body.y - 6);

    // Multiplayer broadcast (throttled)
    if (this.net.isMultiplayer && time - this.lastPublish > 80) {
      this.lastPublish = time;
      const c = getCharacter(this);
      this.net.publishState({
        id: this.net.selfId, name: c.name, skin: c.skin, tint: c.tint,
        x: this.body.x, y: this.body.y,
        anim: moving ? `walk-${this.facing}` : `idle-${this.facing}`,
      });
    }
    this.remotes.update();

    // Interactions
    this.handleInteractions();
  }

  private handleInteractions() {
    const px = this.body.x, py = this.body.y;
    let nearest: Interactable | null = null;
    let bestDist = Infinity;

    for (const it of this.interactables) {
      if (!Phaser.Geom.Rectangle.Contains(it.rect, px, py)) continue;
      const cxp = it.rect.centerX, cyp = it.rect.centerY;
      const d = Phaser.Math.Distance.Between(px, py, cxp, cyp);
      if (d < bestDist) { bestDist = d; nearest = it; }
    }

    if (!nearest) { this.prompt.setVisible(false); return; }

    const label = this.promptLabel(nearest);
    const cam = this.cameras.main;
    const sx = (px - cam.worldView.x) * this.zoom;
    const sy = (py - 24 - cam.worldView.y) * this.zoom;
    this.prompt.setText(label).setPosition(sx, sy).setVisible(true);

    if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.trigger(nearest);
  }

  private promptLabel(it: Interactable): string {
    switch (it.kind) {
      case "door": return `[E] ${it.props.label ?? "Entrar"}`;
      case "fishing": return "[E] Pescar";
      case "shop": return "[E] Abrir loja";
      case "sell": return "[E] Vender peixes";
      case "npc": return `[E] Falar com ${it.props.name ?? it.name ?? "NPC"}`;
      case "wardrobe": return "[E] Trocar de roupa";
      case "bed": return "[E] Dormir (salvar)";
      case "chest": return "[E] Baú";
      default: return "[E] Interagir";
    }
  }

  private trigger(it: Interactable) {
    switch (it.kind) {
      case "door": return this.goToScene(String(it.props.target ?? "city"), it.props.spawn ? String(it.props.spawn) : undefined);
      case "fishing": return this.tryFish();
      case "shop": return this.openShop({ tabs: ["iscas", "varas", "lootbox", "vender"], title: "Loja de Pesca" });
      case "sell": return this.openShop({ tabs: ["vender"], priceMultiplier: Number(it.props.priceMultiplier ?? 0.7), title: "Vender (Trailer)" });
      case "npc": return this.openDialogue(it);
      case "wardrobe": return this.openWardrobe();
      case "bed": return this.sleep();
      case "chest": return this.game.events.emit("toast", "Baú: em breve", "#9fd0ee");
    }
  }

  // ── Interaction handlers ──────────────────────────────────────────────────

  private goToScene(target: string, spawn?: string) {
    if (this.busy) return;
    this.busy = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.restart({ sceneId: target, spawnName: spawn });
    });
  }

  private openDialogue(it: Interactable) {
    this.busy = true;
    const raw = String(it.props.dialogue ?? "Olá!");
    const lines = raw.split("|").map((s) => s.trim());
    const speaker = String(it.props.name ?? it.name ?? "NPC");
    this.modal = new Dialogue(this, speaker, lines, () => { this.modal = null; this.busy = false; });
  }

  private openShop(opts: { tabs: Array<"iscas" | "varas" | "lootbox" | "vender">; priceMultiplier?: number; title?: string }) {
    this.busy = true;
    const menu = new ShopMenu(this, opts, () => { this.modal = null; this.busy = false; this.autosave(); });
    this.modal = menu;
    const onChange = () => menu.refresh();
    this.registry.events.on("changedata", onChange);
    // detach when closed
    const orig = menu.close.bind(menu);
    menu.close = () => { this.registry.events.off("changedata", onChange); orig(); };
  }

  private openWardrobe() {
    this.busy = true;
    this.modal = new Wardrobe(this, (changed) => {
      this.modal = null; this.busy = false;
      if (changed) {
        // Legacy Character supports tinting; FarmerCharacter uses layers instead.
        const cfg = getCharacter(this);
        if (this.player instanceof Character) this.player.setTint("body", cfg.tint);
        this.autosave();
      }
    });
  }

  private sleep() {
    this.autosave();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.game.events.emit("toast", "💤 Jogo salvo. Bom dia!", "#9fe07a");
      this.cameras.main.fadeIn(400, 0, 0, 0);
    });
  }

  private tryFish() {
    if (getBait(this) <= 0) { this.game.events.emit("toast", "Sem iscas! Compre na loja.", "#ff8a8a"); return; }
    this.busy = true;
    addBait(this, -1);

    const fish = rollFish(this.registry.get("rodTier") as number);
    const bx = this.body.x, by = this.body.y + 24;
    const bobber = this.textures.exists("bobber")
      ? this.add.image(bx, by, "bobber").setScale(this.zoom).setDepth(40)
      : this.add.circle(bx, by, 4, 0xc0392b).setDepth(40);
    const bob = this.tweens.add({ targets: bobber, y: by - 5, yoyo: true, repeat: -1, duration: 500 });

    this.time.delayedCall(Phaser.Math.Between(800, 2200), () => {
      const ex = this.add.text(bx, by - 30, "!", { fontFamily: "monospace", fontSize: "24px", color: "#ffcf5a" })
        .setOrigin(0.5).setDepth(41);
      this.time.delayedCall(400, () => {
        bob.remove(); bobber.destroy(); ex.destroy();
        this.scene.pause();
        this.scene.launch("FishingMinigame", { fish, parentKey: "WorldScene" });
        this.scene.bringToTop("FishingMinigame");
        this.scene.bringToTop("UIScene");
      });
    });
  }

  private playCatchAnim(fish: Fish) {
    const x = this.body.x, y = this.body.y;
    if (this.textures.exists("fish_icon")) {
      const f = this.add.image(x, y, "fish_icon").setTint(fish.color).setScale(this.zoom).setDepth(60);
      this.tweens.add({
        targets: f, y: y - 90, angle: 360, duration: 450, ease: "Quad.out", yoyo: true,
        onComplete: () => f.destroy(),
      });
    }
  }

  private autosave() {
    persistSave(this.options, serialize(this)).catch(() => { });
  }
}