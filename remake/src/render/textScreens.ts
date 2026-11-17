import type { DemoIntro, DemoPage, LauncherItem } from "../core/index.js";
import type { Teletype } from "../app/teletype.js";
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
    for (const item of items.filter((i) => i.number > 4)) g.text(4, 14 + item.number, `[${item.number}]   ${item.label}`, frame.palette[3]); // remake items, rows 19 and below
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
  /** The text screen as printed so far (see ordersScreen). */
  screen: Teletype;
  hidden: boolean;
  finished: boolean;
  cursorOn?: boolean;
}

/**
 * The incoming order message, printed character by character while it is sounded in Morse: the text screen of the original (black text on
 * the growing light-grey band, row 25 never used by the program). The line on row 25 is a remake addition that says how to continue.
 */
export function drawOrders(g: Gfx, view: OrdersView): void {
  drawTeletype(g, view.screen, view.cursorOn);
  const note = view.finished ? "PRESS ANY KEY TO CONTINUE" : view.hidden ? "ORDERS IN MORSE ONLY - ANY KEY SKIPS" : "PRESS ANY KEY TO SKIP";
  g.text(1, 25, note, COLORS.grey);
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

/** Screens whose unboxed page text is drawn by the demo itself (the others, such as the damage report or GAME CONTROL, draw their own labels). */
const OWN_TEXT_SCREENS: ReadonlySet<string> = new Set(["playAgain", "radioRoom", "captainsLog"]);

/**
 * Narration of the demo, as DEMO.EXE draws it: `LINE (5,5)-(314,y),0,BF` fills a box at the TOP of the screen with the background colour of the
 * screen behind it and the lines are printed into it on their LOCATE cells in the foreground colour. Pages without a box are the text of
 * the screen itself; those are only drawn for screens that have no labels of their own. There is no F1/F2 banner after the intro.
 */
export function drawDemoNarration(g: Gfx, page: DemoPage, screen: string, background: string, foreground: string): void {
  const cells = page.text ?? [];
  if (page.box) {
    const { x1, y1, x2, y2 } = page.box;
    g.rect(x1, y1, x2 - x1 + 1, y2 - y1 + 1, background);
  } else if (!OWN_TEXT_SCREENS.has(screen)) return;
  if (cells.length > 0 && cells.every((c) => c.row !== null && c.col !== null)) {
    for (const c of cells) g.text(c.col as number, c.row as number, c.text, foreground);
  } else if (page.box) {
    page.lines.forEach((l, i) => g.text(2, 2 + i, l.slice(0, 38), foreground));
  }
}

/** The first page of the demo: SCREEN 1, COLOR 8,1 (grey background, white text), three lines on their LOCATE cells, the only place the F1/F2 keys are named. */
export function drawDemoIntro(g: Gfx, intro: DemoIntro | undefined, background: string, foreground: string): void {
  g.clear(background);
  for (const t of intro?.text ?? []) g.text(t.col, t.row, t.text, foreground);
}

const TELETYPE_GREY = "#aaaaaa";

/** The text screen of the orders (SCREEN 0, COLOR 0,7): black text on the light-grey band, the rest of the 40 x 25 screen black. */
export function drawTeletype(g: Gfx, screen: Teletype, cursorOn = false): void {
  g.clear(COLORS.black);
  screen.cells.forEach((cells, r) => {
    let start = -1;
    for (let c = 0; c <= cells.length; c += 1) {
      const grey = cells[c]?.grey ?? false;
      if (grey && start < 0) start = c;
      if (!grey && start >= 0) {
        g.rect(start * 8, r * 8, (c - start) * 8, 8, TELETYPE_GREY);
        start = -1;
      }
    }
    g.text(1, r + 1, cells.map((cell) => cell.ch).join(""), COLORS.black);
  });
  // the blinking BIOS cursor, an underscore in the cell the next character goes to
  if (cursorOn) g.text(screen.col + 1, screen.row + 1, "_", COLORS.black);
}

/** Blink phase of the text cursor (about 2 Hz). */
export function cursorBlink(timeMs: number): boolean {
  return Math.floor(timeMs / 266) % 2 === 0;
}

/** One-line helm status for the toast shown right after a helm command (remake addition). */
export function helmStatus(sub: { orderedSpeed: number; rudder: number; planes: number }): string {
  const rudder = sub.rudder > 0 ? "LEFT" : sub.rudder < 0 ? "RIGHT" : "MID";
  const planes = sub.planes < 0 ? "UP" : sub.planes > 0 ? "DOWN" : "LEVEL";
  return `ORDER ${sub.orderedSpeed.toFixed(1)}  RUDDER ${rudder}  PLANES ${planes}`;
}

/** Brief status line over the top of the screen (helm orders, time compression). */
export function drawToast(g: Gfx, text: string): void {
  g.rect(0, 0, 320, 11, COLORS.black);
  g.text(2, 1, text.slice(0, 38), COLORS.yellow);
}

/** One page of the controls quick-reference (remake addition, key ? or H): a title and rows of key + action for the 40-column text grid. */
export interface HelpPage {
  title: string;
  rows: readonly (readonly [key: string, action: string])[];
}

/** Which remake-only keys exist (the ADVANCED OPTIONS switches); the page of extras lists only those. */
export interface HelpExtras {
  trails: boolean;
  timeKeys: boolean;
  display: boolean;
  escQuit: boolean;
}

export const HELP_KEY_WIDTH = 6;
export const HELP_ACTION_WIDTH = 22;

export function controlsPages(extras: HelpExtras = { trails: true, timeKeys: true, display: true, escQuit: true }): HelpPage[] {
  const more: [string, string][] = [];
  if (extras.trails) more.push(["W", "Wake trails on / off"]);
  if (extras.timeKeys) more.push(["[", "Time speed down"], ["]", "Time speed up"]);
  if (extras.display) more.push(["V", "Display mode"]);
  more.push(["? or H", "This help"]);
  if (extras.escQuit) more.push(["ESC", "Back to the menu"]);
  return [
    {
      title: "SPEED AND ENGINES",
      rows: [
        ["F1", "Ahead flank (10)"],
        ["F3", "Ahead full (8)"],
        ["F5", "Ahead standard (6)"],
        ["F7", "Ahead slow (3)"],
        ["F9", "All stop"],
        ["F10", "Reverse"],
        ["D", "Diesel engine"],
        ["E", "Electric motor"],
      ],
    },
    {
      title: "STEERING",
      rows: [
        ["LEFT", "Rudder left"],
        ["RIGHT", "Rudder right"],
        ["UP", "Rise (planes up)"],
        ["DOWN", "Dive (planes down)"],
        ["5", "Centre rudder, planes"],
      ],
    },
    {
      title: "SCOPE AND WEAPONS",
      rows: [
        ["F2", "Raise periscope"],
        ["F4", "Lower periscope"],
        ["F", "Scope forward"],
        ["P", "Scope port"],
        ["A", "Scope aft"],
        ["S", "Scope starboard"],
        ["T", "Torpedo doors"],
        ["F8", "Fire torpedo"],
      ],
    },
    {
      title: "SCREENS",
      rows: [
        ["C", "Chart"],
        ["Q", "Quadrant map"],
        ["F6", "Radar"],
        ["L", "Captain's log"],
        ["R", "Damage report"],
        ["M", "Radio room"],
        ["TAB", "GAME CONTROL"],
      ],
    },
    { title: "REMAKE EXTRAS", rows: more },
  ];
}

export const HELP_FOOTER = "LEFT/RIGHT=PAGE  OTHER KEY=CLOSE";

/** Quick-reference box over the current mission screen: `page` of `pages` (0-based). */
export function drawHelpOverlay(g: Gfx, page: number, pages: readonly HelpPage[] = controlsPages()): void {
  const p = pages[Math.min(Math.max(page, 0), pages.length - 1)];
  if (!p) return;
  const top = 3;
  g.rect(8, 4, 304, 152, COLORS.black);
  g.rect(8, 4, 304, 152, COLORS.cyan, false);
  g.text(3, top, `CONTROLS - ${p.title}`, COLORS.yellow);
  g.text(35, top, `${pages.indexOf(p) + 1}/${pages.length}`, COLORS.grey);
  g.line(16, 29, 304, 29, COLORS.cyan);
  const keyWidth = Math.max(...p.rows.map(([k]) => k.length)) + 2; // actions line up per page, close to their keys
  p.rows.forEach(([key, action], i) => {
    g.text(3, top + 3 + i, key, COLORS.cyan);
    g.text(3 + keyWidth, top + 3 + i, action, COLORS.white);
  });
  g.text(3, 18, HELP_FOOTER, COLORS.grey);
}

export interface AdvancedRow {
  label: string;
  on: boolean;
}

export interface AdvancedView {
  rows: readonly AdvancedRow[];
  cursor: number;
  /** What the selected switch would give if it were changed, e.g. `ON: ...` while it is off. */
  hint: string;
}

/** Word wrap for the 38 usable columns of the text screen. */
export function wrapText(text: string, width = 38): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * ADVANCED OPTIONS (remake): the switches of the remake-only features, `ON` = the remake feature, `OFF` = the 1984 behaviour.
 * The selected row is inverted; the text under the list says what OFF gives for it.
 */
export function drawAdvancedOptions(g: Gfx, view: AdvancedView): void {
  g.clear(COLORS.blue);
  g.centered(1, "ADVANCED OPTIONS", COLORS.yellow);
  g.centered(2, "ON = REMAKE   OFF = 1984 ORIGINAL", COLORS.grey);
  view.rows.forEach((r, i) => {
    const y = 3 + i;
    const selected = i === view.cursor;
    if (selected) g.rect(0, (y - 1) * 8, 320, 8, COLORS.white);
    const color = selected ? COLORS.blue : COLORS.white;
    g.text(1, y, selected ? ">" : " ", color);
    g.text(3, y, r.label, color);
    g.text(36, y, r.on ? "ON " : "OFF", selected ? COLORS.blue : r.on ? COLORS.green : COLORS.grey);
  });
  const note = wrapText(view.hint.toUpperCase());
  note.slice(0, 3).forEach((l, i) => g.text(2, 22 + i, l, COLORS.yellow));
  g.text(2, 25, "UP/DOWN ENTER=CHANGE R=RESET ESC=BACK", COLORS.white);
}
