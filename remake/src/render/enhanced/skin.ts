import { COLORS, LOGICAL_HEIGHT, LOGICAL_WIDTH, type Gfx, type TextSkin } from "../gfx.js";
import { PANEL, rgba } from "./colors.js";
import { FONT_FAMILIES } from "./typography.js";

/**
 * The look of the text screens (GAME CONTROL, advanced options, control assignments, the help, message boxes, the demo's narration) in the
 * enhanced graphics: a gunmetal board with a brass frame, cream and amber typewriter text. The screens draw exactly as in the original; the
 * skin changes only what `Gfx` does with their calls (see TextSkin).
 */
const P = PANEL.day;

export const TYPEWRITER_SKIN: TextSkin = {
  bodyFont: FONT_FAMILIES.body,
  titleFont: FONT_FAMILIES.title,
  colors: {
    [COLORS.white]: "#f3ecd6",
    [COLORS.grey]: "#c5b88f",
    [COLORS.yellow]: "#ffc65a",
    [COLORS.cyan]: "#8fd3da",
    [COLORS.green]: "#74e08c",
    [COLORS.red]: "#ff7060",
    [COLORS.blue]: "#161c20", // text on a highlighted (cream) row
    [COLORS.brown]: "#c9924f",
    "#555555": P.metalTop,
    "#5555ff": P.metalTop,
  },
  backdrop(g: Gfx): void {
    const c = g.ctx;
    const w = g.backingWidth;
    const h = g.backingHeight;
    const board = c.createLinearGradient(0, 0, 0, h);
    board.addColorStop(0, "#3d464d");
    board.addColorStop(1, "#1d2327");
    c.fillStyle = board;
    c.fillRect(0, 0, w, h);
    // the 40 x 25 text area: a darker plate with a thin brass edge (the screens use every row and column, so nothing may sit inside the text area)
    const x = g.toX(0);
    const y = g.toY(0);
    const pw = g.toLength(LOGICAL_WIDTH);
    const ph = g.toLength(LOGICAL_HEIGHT);
    const plate = c.createLinearGradient(0, y, 0, y + ph);
    plate.addColorStop(0, "#2b3238");
    plate.addColorStop(1, "#171c20");
    c.fillStyle = plate;
    c.fillRect(x, y, pw, ph);
    c.strokeStyle = P.brass;
    c.lineWidth = g.toLength(0.9);
    c.strokeRect(x + g.toLength(0.45), y + g.toLength(0.45), pw - g.toLength(0.9), ph - g.toLength(0.9));
  },
};
