import * as Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import CharacterCreatorScene from "./scenes/CharacterCreatorScene";
import UIScene from "./scenes/UIScene";
import FishingMinigame from "./scenes/FishingMinigame";
import WorldScene from "./world/WorldScene";
import { DEFAULT_OPTIONS, type GameOptions } from "./config";

export type { GameOptions } from "./config";

export function createGame(parent: string | HTMLElement, options: Partial<GameOptions> = {}): Phaser.Game {
  const opts: GameOptions = { ...DEFAULT_OPTIONS, ...options };

  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 960,
    height: 600,
    parent,
    pixelArt: true,
    backgroundColor: "#1b2733",
    physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    callbacks: {
      preBoot: (game) => { game.registry.set("options", opts); },
    },
    scene: [BootScene, CharacterCreatorScene, WorldScene, FishingMinigame, UIScene],
  });
}
