import * as Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import CharacterCreatorScene from "./scenes/CharacterCreatorScene";
import FishingScene from "./scenes/FishingScene";
import ShopScene from "./scenes/ShopScene";
import FishingMinigame from "./scenes/FishingMinigame";
import UIScene from "./scenes/UIScene";

export function createGame(parent: string | HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 960,
    height: 600,
    parent,
    pixelArt: true,
    backgroundColor: "#1b2733",
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    scene: [
      BootScene,
      CharacterCreatorScene,
      FishingScene,
      ShopScene,
      FishingMinigame,
      UIScene,
    ],
  });
}
