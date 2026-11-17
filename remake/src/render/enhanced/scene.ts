import type { PlayScreen } from "../../input/keyboard.js";
import type { Gfx } from "../gfx.js";
import type { PlayView } from "../playScreens.js";

/**
 * The enhanced renderer: one scene per mission screen, drawn in a logical space that is ENHANCED_HEIGHT (800) units high and as wide as the
 * window allows (1280 to 1422), at the resolution of the display. A scene is only used while the enhanced graphics are on, and only if
 * it is registered; a screen without a scene is drawn by the original code (centred, in its own 320 x 200 view), so the scenes can be
 * added one screen at a time. The original drawing code is not touched by any of this.
 */
export interface EnhancedFrame {
  /** Already set to the enhanced view: draw in the units of `width` x `height`. */
  g: Gfx;
  view: PlayView;
  screen: PlayScreen;
  width: number;
  height: number;
}

export type EnhancedScene = (frame: EnhancedFrame) => void;

export class EnhancedRenderer {
  private readonly scenes = new Map<PlayScreen, EnhancedScene>();

  register(screen: PlayScreen, scene: EnhancedScene): void {
    this.scenes.set(screen, scene);
  }

  scene(screen: PlayScreen): EnhancedScene | undefined {
    return this.scenes.get(screen);
  }

  get screens(): PlayScreen[] {
    return [...this.scenes.keys()];
  }
}
