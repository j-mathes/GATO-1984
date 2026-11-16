/**
 * Display modes (hotkey V):
 *   authentic - the 320x200 picture at the largest whole-number scale that fits the window (crisp pixels, black borders)
 *   fit       - scaled to fill the window as far as the 8:5 aspect ratio allows (non-integer scale, still no smoothing)
 *   crt       - "fit" plus a subtle scanline overlay
 */
export type DisplayMode = "authentic" | "fit" | "crt";

export const DISPLAY_MODES: readonly DisplayMode[] = ["authentic", "fit", "crt"];

export const NATIVE_WIDTH = 320;
export const NATIVE_HEIGHT = 200;

export function nextDisplayMode(mode: DisplayMode): DisplayMode {
  return DISPLAY_MODES[(DISPLAY_MODES.indexOf(mode) + 1) % DISPLAY_MODES.length] ?? "authentic";
}

export function isDisplayMode(value: unknown): value is DisplayMode {
  return typeof value === "string" && (DISPLAY_MODES as readonly string[]).includes(value);
}

/** CSS size of the picture for a window of `viewportW` x `viewportH` pixels. */
export function computeDisplaySize(mode: DisplayMode, viewportW: number, viewportH: number): { width: number; height: number } {
  const fit = Math.min(viewportW / NATIVE_WIDTH, viewportH / NATIVE_HEIGHT);
  const scale = mode === "authentic" ? Math.max(1, Math.floor(fit)) : Math.max(fit, 0.1);
  return { width: Math.round(NATIVE_WIDTH * scale), height: Math.round(NATIVE_HEIGHT * scale) };
}

const STORAGE_KEY = "gato.display";

export interface DisplayHandle {
  readonly mode: DisplayMode;
  cycle(): DisplayMode;
  set(mode: DisplayMode): void;
}

/** Wire the canvas and the scanline overlay element to the window size; the choice is remembered in localStorage. */
export function setupDisplay(canvas: HTMLCanvasElement, overlay: HTMLElement | null, storage: Pick<Storage, "getItem" | "setItem"> | null): DisplayHandle {
  let stored: unknown = null;
  try {
    stored = storage?.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  let mode: DisplayMode = isDisplayMode(stored) ? stored : "authentic";

  const apply = (): void => {
    const { width, height } = computeDisplaySize(mode, window.innerWidth, window.innerHeight);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.imageRendering = "pixelated";
    if (overlay) {
      overlay.style.width = `${width}px`;
      overlay.style.height = `${height}px`;
      overlay.style.display = mode === "crt" ? "block" : "none";
    }
    document.body.dataset.display = mode;
    try {
      storage?.setItem(STORAGE_KEY, mode);
    } catch {
      /* not persisted */
    }
  };
  window.addEventListener("resize", apply);
  apply();
  return {
    get mode() {
      return mode;
    },
    cycle() {
      mode = nextDisplayMode(mode);
      apply();
      return mode;
    },
    set(m: DisplayMode) {
      mode = m;
      apply();
    },
  };
}
