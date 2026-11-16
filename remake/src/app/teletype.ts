/**
 * The BASIC text screen (SCREEN 0, 40 columns) as DEMO.EXE and GATO1 use it for the orders: 24 scrolling rows (row 25 is never
 * written), characters printed in the current colours, and a scroll that fills the new bottom line with the current background.
 * With COLOR 0,7 (black on light grey) this is what produces the grey band that grows upwards on a black screen.
 */

export const TELETYPE_COLUMNS = 40;
/** Rows BASIC prints and scrolls in; the 25th row stays black. */
export const TELETYPE_ROWS = 24;

export interface TeletypeCell {
  ch: string;
  /** Printed (or scrolled in) with the grey background; false = untouched black. */
  grey: boolean;
}

export class Teletype {
  readonly cells: TeletypeCell[][] = Array.from({ length: TELETYPE_ROWS }, () => Array.from({ length: TELETYPE_COLUMNS }, () => ({ ch: " ", grey: false })));
  row = TELETYPE_ROWS - 1;
  col = 0;

  /** PRINT without a newline: characters go into the cursor cell, the cursor wraps at column 40 and scrolls past the last row. */
  print(text: string): void {
    for (const ch of text) {
      if (this.col >= TELETYPE_COLUMNS) this.newline();
      const cell = this.cells[this.row]?.[this.col];
      if (cell) {
        cell.ch = ch;
        cell.grey = true;
      }
      this.col += 1;
    }
    if (this.col >= TELETYPE_COLUMNS) this.newline(); // the cursor wraps as soon as the last column is written
  }

  newline(): void {
    this.col = 0;
    if (this.row < TELETYPE_ROWS - 1) this.row += 1;
    else this.scroll();
  }

  private scroll(): void {
    this.cells.shift();
    this.cells.push(Array.from({ length: TELETYPE_COLUMNS }, () => ({ ch: " ", grey: true })));
  }
}

/**
 * The screen of the orders routine after the lines have been printed up to now. `source` are the lines of the file, `revealed` the part of
 * each that has been typed (same length, as from revealedLines). Start: LOCATE 24,1, PRINT of 40 spaces and a newline (the print wraps at
 * column 40 and the newline scrolls once more); a non-blank line is printed as it is; a blank line is two newlines.
 */
export function ordersScreen(source: readonly string[], revealed: readonly string[]): Teletype {
  const t = new Teletype();
  t.print(" ".repeat(TELETYPE_COLUMNS));
  t.newline();
  for (let i = 0; i < source.length; i += 1) {
    const full = source[i] ?? "";
    const typed = revealed[i] ?? "";
    if (full.length === 0) {
      const previous = i === 0 || (revealed[i - 1] ?? "").length >= (source[i - 1] ?? "").length;
      if (!previous) break;
      t.newline();
      t.newline();
      continue;
    }
    t.print(typed);
    if (typed.length < full.length) break;
  }
  return t;
}
