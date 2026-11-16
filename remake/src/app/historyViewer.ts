import type { HistoryPagesDocument } from "../core/index.js";

export const HISTORY_MARGIN = "      "; // ds:0x08b4, six spaces printed before every line
export const CONTINUE_PROMPT = "PRESS ANY KEY TO CONTINUE"; // LOCATE 23,25
export const REREAD_PROMPT = "PRESS 'R' TO REREAD THIS INFORMATION";
export const RETURN_PROMPT = "PRESS ANY OTHER KEY TO RETURN";

export type HistoryView =
  | { phase: "page"; index: number; count: number; lines: string[] }
  | { phase: "end" }
  | { phase: "done" };

/**
 * History viewer (History.exe 1000:001a-0160): the text file is shown a page at a time; a '*' line in the file ends a page and
 * shows "PRESS ANY KEY TO CONTINUE"; after the last page the reread/return prompt waits for a key. Only the exact key "R"
 * rereads, any other key chains back to GATO (here: returns to the launcher).
 */
export class HistoryViewer {
  private index = 0;
  private ended = false;
  private finished = false;

  constructor(private readonly doc: HistoryPagesDocument) {}

  get view(): HistoryView {
    if (this.finished) return { phase: "done" };
    if (this.ended) return { phase: "end" };
    return { phase: "page", index: this.index, count: this.doc.pages.length, lines: (this.doc.pages[this.index]?.lines ?? []).map((l) => HISTORY_MARGIN + l) };
  }

  /** Feed one key press; returns the new view. */
  press(key: string): HistoryView {
    if (this.finished) return this.view;
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
}
