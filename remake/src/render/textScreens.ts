import type { DemoPage, LauncherItem } from "../core/index.js";
import { LAUNCHER_MENU, LAUNCHER_PROMPT, TITLE_LINES } from "../core/index.js";
import { CONTINUE_PROMPT, REREAD_PROMPT, RETURN_PROMPT, type HistoryView } from "../app/historyViewer.js";
import { COLORS, Gfx } from "./gfx.js";
import type { SpriteLibrary } from "./sprites.js";
import { TITLE_ART_HEIGHT, TITLE_ART_WIDTH, type TitleArt } from "./titleArt.js";

/** Frame of title_screen.json that backs the launcher menu. */
export const MENU_FRAME_ID = "launcher_menu";
/** Frame of title_screen.json shown first: the "Spectrum HoloByte presents" logo (black background). */
export const SPLASH_FRAME_ID = "spectrum_logo";

/** Whether the loaded artwork can show the intro logo. */
export function hasSplash(art: TitleArt | null): boolean {
  return art?.frame(SPLASH_FRAME_ID) !== undefined;
}

/** First screen of GATO.EXE (0x6a6-0x979): the finished Spectrum HoloByte logo with its own palette; TM and PRESENTS sit on their LOCATE cells. */
export function drawSplash(g: Gfx, art: TitleArt | null): void {
  const frame = art?.frame(SPLASH_FRAME_ID);
  if (!art || !frame) {
    g.clear();
    return;
  }
  g.clear(frame.palette[0]);
  g.image(art.image(SPLASH_FRAME_ID), 0, 0, TITLE_ART_WIDTH, TITLE_ART_HEIGHT, 0, 0, TITLE_ART_WIDTH, TITLE_ART_HEIGHT);
  for (const t of frame.text) g.text(t.col, t.row, t.text, frame.palette[t.colorIndex]);
}

/** Frame with the solid GATO lettering that the title page's venetian-blind wipe starts from. */
export const TITLE_LETTERS_FRAME_ID = "title_letters";

/**
 * The erase lines GATO.EXE draws over the solid lettering (0x0a3f-0x0ab0): `FOR Y = 103 TO 19 STEP -4 : LINE (0,Y)-(319,Y),0`, then
 * `FOR Y = 20 TO 100 STEP 4 : LINE (0,Y)-(319,Y),0`. Together they leave the striped lettering of the `title` frame.
 */
export const TITLE_WIPE_ROWS: readonly number[] = [
  ...Array.from({ length: 22 }, (_, i) => 103 - 4 * i),
  ...Array.from({ length: 21 }, (_, i) => 20 + 4 * i),
];
/** The original draws the solid letters and wipes at once; its speed depended on the CPU, so these times are remake choices. */
export const TITLE_HOLD_MS = 400;
export const TITLE_WIPE_MS = 900;

/** How many of the wipe lines are on screen `sinceMs` after the title page appeared. */
export function titleWipeLines(sinceMs: number): number {
  const progress = (sinceMs - TITLE_HOLD_MS) / TITLE_WIPE_MS;
  return Math.max(0, Math.min(TITLE_WIPE_ROWS.length, Math.floor(progress * TITLE_WIPE_ROWS.length)));
}

/**
 * Title page of GATO.EXE. With the exported artwork it is the original picture (striped GATO lettering, credits and the (c) ring
 * as drawn by the BASIC program, text placed on the original LOCATE cells); the old sprite layout is only a fallback when the
 * asset could not be loaded. "PRESS ANY KEY" is a remake addition: the original advances by itself.
 * `sinceMs` is the time since the page appeared: the solid `title_letters` frame is shown first and the original's erase lines
 * run over it one by one until the striped `title` frame is reached; leave it out to show the finished page.
 */
export function drawTitle(g: Gfx, art: TitleArt | null, sprites: SpriteLibrary | null, timeMs: number, sinceMs?: number): void {
  const frame = art?.primary;
  if (art && frame) {
    const letters = art.frame(TITLE_LETTERS_FRAME_ID);
    const lines = sinceMs === undefined || !letters ? TITLE_WIPE_ROWS.length : titleWipeLines(sinceMs);
    if (letters && lines < TITLE_WIPE_ROWS.length) {
      g.clear(letters.palette[0]);
      g.image(art.image(TITLE_LETTERS_FRAME_ID), 0, 0, TITLE_ART_WIDTH, TITLE_ART_HEIGHT, 0, 0, TITLE_ART_WIDTH, TITLE_ART_HEIGHT);
      for (const y of TITLE_WIPE_ROWS.slice(0, lines)) g.rect(0, y, TITLE_ART_WIDTH, 1, letters.palette[0] as string);
      for (const t of letters.text) g.text(t.col, t.row, t.text, letters.palette[t.colorIndex]);
      return;
    }
    g.clear(frame.palette[0]);
    g.image(art.image(), 0, 0, TITLE_ART_WIDTH, TITLE_ART_HEIGHT, 0, 0, TITLE_ART_WIDTH, TITLE_ART_HEIGHT);
    for (const t of frame.text) g.text(t.col, t.row, t.text, frame.palette[t.colorIndex]);
    g.centered(25, "PRESS ANY KEY", frame.palette[3]);
    return;
  }
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

/**
 * Launcher menu. With the exported artwork it is the original screen: the `launcher_menu` frame (sky, sea and the surfaced submarine on the
 * COLOR 1,1 palette) with the six text lines on their LOCATE cells and the typed item at row 22, column 24. Without the frame the old
 * plain layout is used.
 */
export function drawLauncherMenu(g: Gfx, entry: string, items: readonly LauncherItem[] = LAUNCHER_MENU, art: TitleArt | null = null): void {
  const frame = art?.frame(MENU_FRAME_ID);
  if (art && frame) {
    g.clear(frame.palette[0]);
    g.image(art.image(MENU_FRAME_ID), 0, 0, TITLE_ART_WIDTH, TITLE_ART_HEIGHT, 0, 0, TITLE_ART_WIDTH, TITLE_ART_HEIGHT);
    for (const t of frame.text) g.text(t.col, t.row, t.text, frame.palette[t.colorIndex]);
    g.text(24, 22, `${entry}_`, frame.palette[3]);
    return;
  }
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

/** Controls quick-reference (remake addition, key ? or H), one string per row of the 40-column text grid. */
export const CONTROLS_HELP: readonly string[] = [
  "CONTROLS              (any key closes)",
  "F1 F3 F5 F7  ahead flank/full/std/slow",
  "F9 / F10     all stop / reverse",
  "F2 / F4      periscope up / down",
  "F6 radar     F8 fire torpedo",
  "LEFT/RIGHT   rudder     UP/DOWN planes",
  "5            centre rudder and planes",
  "P A S F      scope port/aft/stbd/fwd",
  "D / E        diesel / electric",
  "T            torpedo doors",
  "C Q L R M    chart quadrant log damage",
  "             radio room",
  "TAB          GAME CONTROL",
  "W            wake trails on / off",
  "V            display mode",
  "ESC          quit to the menu",
];

/** Dimmed quick-reference box over the current mission screen. */
export function drawHelpOverlay(g: Gfx): void {
  const top = 3;
  const height = CONTROLS_HELP.length * 8 + 8;
  g.rect(8, (top - 1) * 8 - 4, 304, height, COLORS.black);
  g.rect(8, (top - 1) * 8 - 4, 304, height, COLORS.cyan, false);
  CONTROLS_HELP.forEach((line, i) => g.text(2, top + i, line, i === 0 ? COLORS.yellow : COLORS.white));
}
