import IORedis from "ioredis";

import { logWorkerError } from "../lib/worker-observability";

// ─────────────────────────────────────────────────────────────────────────────
// Game worker (MVP skeleton).
//
// For the MVP, position sync runs purely client→Centrifugo→clients, so this
// worker is OPTIONAL. It exists as the home for SERVER-AUTHORITATIVE logic you
// add later: validating catches, processing the player market, anti-cheat, etc.
//
// It publishes to Centrifugo via the HTTP API so any backend event (e.g. a
// market trade confirmed in Postgres) can be broadcast to players in realtime.
// ─────────────────────────────────────────────────────────────────────────────

const CENTRIFUGO_API = process.env.CENTRIFUGO_API_URL ?? "http://realtime:8000/api";
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY ?? "";

/** Publish a payload to a Centrifugo channel from the backend. */
export async function publish(channel: string, data: unknown): Promise<void> {
  try {
    await fetch(CENTRIFUGO_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CENTRIFUGO_API_KEY,
      },
      body: JSON.stringify({ method: "publish", params: { channel, data } }),
    });
  } catch (err) {
    logWorkerError("game.centrifugo_publish_failed", err, { channel });
  }
}

/**
 * Example: a worker that listens for market events on Redis and broadcasts
 * them to the `game:market` channel. Wire this into worker/index.ts when you
 * build the player market in a later phase.
 */
export function startGameWorker(): void {
  const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
  const sub = redis.duplicate();

  sub.subscribe("game:market:events", (err) => {
    if (err) logWorkerError("game.subscribe_failed", err);
    else console.log("[game.worker] listening for market events");
  });

  sub.on("message", async (_channel, message) => {
    // message = JSON describing a confirmed trade/listing
    try {
      const event = JSON.parse(message);
      await publish("game:market", event);
    } catch (err) {
      logWorkerError("game.bad_market_event", err);
    }
  });
}
