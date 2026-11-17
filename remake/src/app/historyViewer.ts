import type { HistoryPagesDocument } from "../core/index.js";

export const HISTORY_MARGIN = "      "; // ds:0x08b4, six spaces printed before every line
export const CONTINUE_PROMPT = "PRESS ANY KEY TO CONTINUE"; // LOCATE 23,25
export const REREAD_PROMPT = "PRESS 'R' TO REREAD THIS INFORMATION";
export const RETURN_PROMPT = "PRESS ANY OTHER KEY TO RETURN";

export type HistoryView =
  | { phase: "page"; index: number; count: number; lines: string[]; paging: boolean }
  | { phase: "end"; paging: boolean }
  | { phase: "done" };

const BACK_KEYS: ReadonlySet<string> = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace"]);

/**
 * History viewer (History.exe 1000:001a-0160): the text file is shown a page at a time; a '*' line in the file ends a page and
 * shows "PRESS ANY KEY TO CONTINUE"; after the last page the reread/return prompt waits for a key. Only the exact key "R"
 * rereads, any other key chains back to GATO (here: returns to the launcher).
 *
 * With `paging` (remake addition, switch HISTORY PAGE KEYS) the pages can also be turned back: the left and up arrows, PgUp and
 * Backspace go to the previous page, Home and End to the first and the last, Esc leaves; every other key still goes on.
 */
export class HistoryViewer {
  private index: number;
  private ended = false;
  private finished = false;
  private resume: number | null = null;

  constructor(
    private readonly doc: HistoryPagesDocument,
    private readonly paging = false,
    startPage = 0,
  ) {
    this.index = Math.max(0, Math.min(startPage, doc.pages.length - 1));
  }

  /** The page Esc left from, to open the history there next time; null when it was read to the end or left from the end prompt. */
  get resumePage(): number | null {
    return this.resume;
  }

  get view(): HistoryView {
    if (this.finished) return { phase: "done" };
    if (this.ended) return { phase: "end", paging: this.paging };
    return { phase: "page", index: this.index, count: this.doc.pages.length, lines: (this.doc.pages[this.index]?.lines ?? []).map((l) => HISTORY_MARGIN + l), paging: this.paging };
  }

  /** Feed one key press; returns the new view. */
  press(key: string): HistoryView {
    if (this.finished) return this.view;
    if (this.paging && this.pagingPress(key)) return this.view;
    if (this.ended) {
      if (key === "R") {
        this.index = 0;
        this.ended = false;
      } else this.finished = true;
      return this.view;
    }
    this.index += 1;
    if (this.index >= this.doc.pages.length) {
      this.index = this.doc.pages.length - 1;
      this.ended = true;
    }
    return this.view;
  }

  /** The keys that only paging adds; true when the key was one of them. */
  private pagingPress(key: string): boolean {
    const last = this.doc.pages.length - 1;
    if (key === "Escape") {
      if (!this.ended && this.index > 0) this.resume = this.index;
      this.finished = true;
      return true;
    }
    if (this.ended) {
      if (BACK_KEYS.has(key)) this.ended = false;
      else if (key === "Home") {
        this.index = 0;
        this.ended = false;
      } else return false;
      return true;
    }
    if (BACK_KEYS.has(key)) this.index = Math.max(0, this.index - 1);
    else if (key === "Home") this.index = 0;
    else if (key === "End") this.index = last;
    else return false;
    return true;
  }
}
