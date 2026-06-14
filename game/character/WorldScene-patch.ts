// ─────────────────────────────────────────────────────────────────────────────
// WorldScene patch — use FarmerCharacter instead of Character when the player
// has a figure string. The rest of WorldScene stays unchanged.
// ─────────────────────────────────────────────────────────────────────────────
//
// In WorldScene.ts, replace the player creation block:
//
//   BEFORE:
//     const cfg = getCharacter(this);
//     this.player = new Character(this, spawnX, spawnY, cfg).setScale(this.zoom);
//
//   AFTER (paste the helper below and call it):
//
// ─────────────────────────────────────────────────────────────────────────────

import * as Phaser from "phaser";
import { FarmerCharacter } from "./FarmerCharacter";
import { Character }       from "./Character";
import { getCharacter }    from "../state";
import { DEFAULT_FIGURE }  from "./manifest";

type AnyCharacter = FarmerCharacter | Character;

/**
 * Creates the right character type based on what's saved in the registry.
 * If the player chose a figure string (via CharacterCreatorScene), a
 * FarmerCharacter is returned. Otherwise falls back to the old Character.
 */
export function createPlayerCharacter(
  scene: Phaser.Scene, x: number, y: number, zoom: number
): AnyCharacter {
  const cfg = getCharacter(scene) as unknown as {
    skin?: string;
    tint?: number;
    figure?: string;
  };

  if (cfg.figure) {
    // New system: layered Farmer Generator character
    return new FarmerCharacter(scene, x, y, cfg.figure, zoom);
  }

  // Legacy fallback (Abby.png / procedural sprite)
  return new Character(scene, x, y, {
    name: "Pescador",
    skin: cfg.skin ?? "abby",
    tint: cfg.tint ?? 0xffffff,
  }).setScale(zoom);
}

// ── Tool equip helper ────────────────────────────────────────────────────────

/**
 * Equip or remove the fishing rod on the player.
 * Call this when the player enters / leaves a fishing zone.
 *
 *   equipFishingTool(player, "tl_fishing_rod");  // equip
 *   equipFishingTool(player, null);              // remove
 */
export function equipFishingTool(player: AnyCharacter, itemId: string | null): void {
  if (player instanceof FarmerCharacter) {
    player.equipTool(itemId);
  }
  // Character (legacy) has no tool layer — no-op
}

// ── Multiplayer: figure string in PlayerState ────────────────────────────────
//
// In net/Network.ts, add `figure?: string` to PlayerState:
//
//   export interface PlayerState {
//     id: string; name: string; skin: string; tint: number;
//     x: number; y: number; anim: string;
//     figure?: string;   // ← ADD THIS
//   }
//
// In WorldScene.publishState(), include the figure:
//
//   const c = getCharacter(this) as { name: string; skin: string; tint: number; figure?: string };
//   this.net.publishState({
//     id: this.net.selfId, name: c.name, skin: c.skin, tint: c.tint,
//     x: this.body.x, y: this.body.y,
//     anim: moving ? `walk-${this.facing}` : `idle-down`,
//     figure: c.figure,             // ← ADD THIS
//   });
//
// In net/RemotePlayers.ts, update upsert() to prefer figure over skin:
//
//   upsert(state: PlayerState): void {
//     let r = this.players.get(state.id);
//     if (!r) {
//       let char: FarmerCharacter | Character;
//       if (state.figure) {
//         char = new FarmerCharacter(this.scene, state.x, state.y, state.figure, this.scale);
//       } else {
//         char = new Character(this.scene, state.x, state.y,
//           { name: state.name, skin: state.skin, tint: state.tint });
//         (char as Character).setScale(this.scale);
//       }
//       // ... rest stays the same
//     }
//   }
