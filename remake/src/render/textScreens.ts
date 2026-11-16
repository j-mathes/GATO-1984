import type { DemoPage, LauncherItem } from "../core/index.js";
import { LAUNCHER_MENU, LAUNCHER_PROMPT, TITLE_LINES } from "../core/index.js";
import { CONTINUE_PROMPT, REREAD_PROMPT, RETURN_PROMPT, type HistoryView } from "../app/historyViewer.js";
import { COLORS, Gfx } from "./gfx.js";
import type { SpriteLibrary } from "./sprites.js";

/** Title page of GATO.EXE: the DRAW-string logo is replaced by the sprite art, the text lines are the original's. */
export function drawTitle(g: Gfx, sprites: SpriteLibrary | null, timeMs: number): void {
  g.clear();
  g.centered(3, TITLE_LINES[0], COLORS.yellow);
  const sprite = sprites?.ship(3, Math.floor(timeMs / 400), true);
  if (sprite) {
    const f = sprite.frame;
    g.image(sprite.img, f.cell.x, f.cell.y, f.cell.w, f.cell.h, 120, 60, f.cell.w * 1.2, f.cell.h * 1.2);
  }
  g.centered(15, TITLE_LINES[1], COLORS.grey);
  g.centered(18, TITLE_LINES[2], COLORS.grey);
  g.centered(19, TITLE_LINES[3], COLORS.grey);
  g.centered(24, "PRESS ANY KEY", COLORS.white);
}

export function drawLauncherMenu(g: Gfx, entry: string, items: readonly LauncherItem[] = LAUNCHER_MENU): void {
  g.clear();
  g.centered(3, TITLE_LINES[0], COLORS.yellow);
  items.forEach((item, i) => g.text(6, 8 + i * 2, `[${item.number}]   ${item.label}`, COLORS.grey));
  g.text(7, 19, LAUNCHER_PROMPT[0], COLORS.white);
  g.text(7, 20, LAUNCHER_PROMPT[1], COLORS.white);
  g.text(7, 22, `${entry}_`, COLORS.yellow);
}

export interface OrdersView {
  header: string[];
  /** Body lines revealed so far. */
  body: string[];
  hidden: boolean;
  finished: boolean;
}

/** The incoming order message, printed character by character while it is sounded in Morse. */
export function drawOrders(g: Gfx, view: OrdersView): void {
  g.clear();
  view.header.forEach((l, i) => g.text(2, 2 + i, l, COLORS.yellow));
  view.body.forEach((l, i) => g.text(2, 7 + i, l, COLORS.white));
  if (view.hidden) g.centered(21, "(ORDERS RECEIVED IN MORSE ONLY)", COLORS.red);
  g.centered(24, view.finished ? "PRESS ANY KEY" : "PRESS ANY KEY TO SKIP", COLORS.grey);
}

export function drawHistory(g: Gfx, view: HistoryView): void {
  g.clear();
  if (view.phase === "page") {
    view.lines.forEach((l, i) => g.text80(1, 1 + i, l.slice(0, 80), COLORS.grey));
    g.text80(25, 23, CONTINUE_PROMPT, COLORS.white);
  } else if (view.phase === "end") {
    g.text80(1, 21, "", COLORS.grey);
    g.text80(7, 22, REREAD_PROMPT, COLORS.white);
    g.text80(7, 23, RETURN_PROMPT, COLORS.white);
  }
}

/** Narration box laid over the screen the demo is showing. */
export function drawDemoNarration(g: Gfx, page: DemoPage, soundOn: boolean): void {
  const rows = page.lines.length;
  const top = 25 - rows - 1;
  g.rect(0, (top - 1) * 8 - 2, 320, rows * 8 + 12, COLORS.black);
  g.rect(0, (top - 1) * 8 - 2, 320, rows * 8 + 12, COLORS.yellow, false);
  page.lines.forEach((l, i) => g.text(2, top + i, l.slice(0, 38), COLORS.yellow));
  g.text(1, 1, `F1 EXIT  F2 SOUND ${soundOn ? "ON " : "OFF"}`, COLORS.grey);
}
