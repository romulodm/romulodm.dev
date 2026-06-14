import type { GameOptions } from "../config";

export interface PlayerState {
  id: string;
  name: string;
  skin: string;
  tint: number;
  x: number;
  y: number;
  anim: string; // e.g. "walk-down" or "idle-down"
}

type PubHandler = (state: PlayerState) => void;
type LeaveHandler = (id: string) => void;

/**
 * Thin wrapper over centrifuge-js. In single-player (`multiplayer: false`)
 * every method is a no-op, so the exact same scene code runs in both modes.
 */
export class Network {
  private opts: GameOptions;
  private centrifuge: any = null;
  private sub: any = null;
  private channel = "";
  private connected = false;

  public selfId = "local";
  public onPublication: PubHandler = () => {};
  public onLeave: LeaveHandler = () => {};

  constructor(opts: GameOptions) {
    this.opts = opts;
    this.selfId = opts.userId ?? "local";
  }

  get isMultiplayer(): boolean { return this.opts.multiplayer; }

  async connect(): Promise<void> {
    if (!this.opts.multiplayer || !this.opts.wsUrl) return;
    try {
      // Dynamic import so single-player builds never need the dependency.
      const mod: any = await import("centrifuge");
      const Centrifuge = mod.Centrifuge ?? mod.default;

      this.centrifuge = new Centrifuge(this.opts.wsUrl, {
        getToken: async () => (this.opts.getToken ? this.opts.getToken() : ""),
      });
      this.centrifuge.on("connected", () => { this.connected = true; });
      this.centrifuge.on("disconnected", () => { this.connected = false; });
      this.centrifuge.connect();
    } catch (e) {
      console.warn("[Network] centrifuge unavailable, running offline:", e);
      this.centrifuge = null;
    }
  }

  /** Subscribe to a scene's presence channel; leave the previous one. */
  joinScene(sceneId: string): void {
    if (!this.centrifuge) return;
    this.leaveScene();
    this.channel = `game:scene:${sceneId}`;

    this.sub = this.centrifuge.newSubscription(this.channel, {
      getPresence: true,
    });

    this.sub.on("publication", (ctx: any) => {
      const data = ctx?.data as PlayerState | undefined;
      if (data && data.id !== this.selfId) this.onPublication(data);
    });
    this.sub.on("leave", (ctx: any) => {
      const id = ctx?.info?.user;
      if (id) this.onLeave(id);
    });

    this.sub.subscribe();
  }

  leaveScene(): void {
    if (this.sub) {
      try { this.sub.unsubscribe(); this.sub.removeAllListeners?.(); } catch { /* */ }
      this.sub = null;
    }
  }

  /** Broadcast our own position/animation to the current scene channel. */
  publishState(state: PlayerState): void {
    if (!this.sub || !this.connected) return;
    try { this.sub.publish(state); } catch { /* throttled / not ready */ }
  }

  disconnect(): void {
    this.leaveScene();
    try { this.centrifuge?.disconnect(); } catch { /* */ }
    this.centrifuge = null;
  }
}
