/**
 * Display modes (hotkey V):
 *   authentic - the 320x200 picture at the largest whole-number scale that fits the window (crisp pixels, black borders)
 *   fit       - scaled to fill the window as far as the 8:5 aspect ratio allows (non-integer scale, still no smoothing)
 *   crt       - "fit" plus a subtle scanline overlay
 *
 * Graphics (the ENHANCED GRAPHICS switch): "original" is the 320x200 picture on a 640x400 canvas. "enhanced" draws in a larger logical
 * space (ENHANCED_HEIGHT units high, between 8:5 and 16:9 wide, following the window) on a canvas as sharp as the screen; there is no
 * whole-number scaling then, so authentic is the same as fit, and crt adds the scanlines.
 */
export type DisplayMode = "authentic" | "fit" | "crt";

export type Graphics = "original" | "enhanced";

export const DISPLAY_MODES: readonly DisplayMode[] = ["authentic", "fit", "crt"];

export const NATIVE_WIDTH = 320;
export const NATIVE_HEIGHT = 200;

/** Enhanced logical space: 800 units high (4 x the original's 200), 1280 wide at 8:5 and 1422 wide at 16:9. */
export const ENHANCED_HEIGHT = 800;
export const ENHANCED_MIN_ASPECT = 8 / 5;
export const ENHANCED_MAX_ASPECT = 16 / 9;
/** The enhanced canvas is never wider than this many pixels (a 2560 x 1440 screen is covered). */
export const MAX_BACKING_WIDTH = 2560;

export function nextDisplayMode(mode: DisplayMode): DisplayMode {
  return DISPLAY_MODES[(DISPLAY_MODES.indexOf(mode) + 1) % DISPLAY_MODES.length] ?? "authentic";
}

export function isDisplayMode(value: unknown): value is DisplayMode {
  return typeof value === "string" && (DISPLAY_MODES as readonly string[]).includes(value);
}

/** The enhanced logical space for a window: always ENHANCED_HEIGHT high, as wide as the window's shape allows between 8:5 and 16:9. */
export function enhancedViewSize(viewportW: number, viewportH: number): { width: number; height: number } {
  const aspect = viewportH > 0 ? viewportW / viewportH : ENHANCED_MIN_ASPECT;
  const clamped = Math.min(Math.max(aspect, ENHANCED_MIN_ASPECT), ENHANCED_MAX_ASPECT);
  return { width: Math.round(ENHANCED_HEIGHT * clamped), height: ENHANCED_HEIGHT };
}

/** CSS size of the picture for a window of `viewportW` x `viewportH` pixels. */
export function computeDisplaySize(mode: DisplayMode, viewportW: number, viewportH: number, graphics: Graphics = "original"): { width: number; height: number } {
  if (graphics === "enhanced") {
    const view = enhancedViewSize(viewportW, viewportH);
    const scale = Math.max(Math.min(viewportW / view.width, viewportH / view.height), 0.1);
    return { width: Math.round(view.width * scale), height: Math.round(view.height * scale) };
  }
  const fit = Math.min(viewportW / NATIVE_WIDTH, viewportH / NATIVE_HEIGHT);
  const scale = mode === "authentic" ? Math.max(1, Math.floor(fit)) : Math.max(fit, 0.1);
  return { width: Math.round(NATIVE_WIDTH * scale), height: Math.round(NATIVE_HEIGHT * scale) };
}

/** Pixels of the canvas for a picture of `cssWidth` x `cssHeight` on a screen with `pixelRatio` device pixels per CSS pixel, within `maxWidth`. */
export function backingSize(cssWidth: number, cssHeight: number, pixelRatio: number, maxWidth: number = MAX_BACKING_WIDTH): { width: number; height: number } {
  const wanted = Math.max(cssWidth * Math.max(pixelRatio, 1), 1);
  const factor = Math.min(wanted, maxWidth) / Math.max(cssWidth, 1);
  return { width: Math.max(Math.round(cssWidth * factor), 1), height: Math.max(Math.round(cssHeight * factor), 1) };
}

/** What the canvas looks like for the window: its shown size, its pixel size and the logical space drawn into it. */
export interface DisplayLayout {
  graphics: Graphics;
  cssWidth: number;
  cssHeight: number;
  backingWidth: number;
  backingHeight: number;
  viewWidth: number;
  viewHeight: number;
}

export function computeLayout(mode: DisplayMode, graphics: Graphics, viewportW: number, viewportH: number, pixelRatio: number): DisplayLayout {
  const css = computeDisplaySize(mode, viewportW, viewportH, graphics);
  if (graphics === "original") {
    return { graphics, cssWidth: css.width, cssHeight: css.height, backingWidth: NATIVE_WIDTH * 2, backingHeight: NATIVE_HEIGHT * 2, viewWidth: NATIVE_WIDTH, viewHeight: NATIVE_HEIGHT };
  }
  const backing = backingSize(css.width, css.height, pixelRatio);
  const view = enhancedViewSize(viewportW, viewportH);
  return { graphics, cssWidth: css.width, cssHeight: css.height, backingWidth: backing.width, backingHeight: backing.height, viewWidth: view.width, viewHeight: view.height };
}

const STORAGE_KEY = "gato.display";

export interface DisplayHandle {
  readonly mode: DisplayMode;
  cycle(): DisplayMode;
  set(mode: DisplayMode): void;
  /** Without the remake's display modes the picture is always the authentic whole-number scale; the chosen mode is kept for later. */
  setModesEnabled(on: boolean): void;
  readonly modesEnabled: boolean;
  readonly graphics: Graphics;
  setGraphics(graphics: Graphics): void;
  /** The current layout (also passed to {@link DisplayHandle.onLayout} whenever it changes). */
  readonly layout: DisplayLayout;
  onLayout: ((layout: DisplayLayout) => void) | null;
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
  let enabled = true;
  let graphics: Graphics = "original";
  let layout = computeLayout("authentic", graphics, window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  let listener: ((layout: DisplayLayout) => void) | null = null;

  const apply = (): void => {
    const shown: DisplayMode = enabled ? mode : "authentic";
    layout = computeLayout(shown, graphics, window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    canvas.style.width = `${layout.cssWidth}px`;
    canvas.style.height = `${layout.cssHeight}px`;
    canvas.style.imageRendering = graphics === "original" ? "pixelated" : "auto";
    if (overlay) {
      overlay.style.width = `${layout.cssWidth}px`;
      overlay.style.height = `${layout.cssHeight}px`;
      overlay.style.display = shown === "crt" ? "block" : "none";
    }
    document.body.dataset.display = shown;
    document.body.dataset.graphics = graphics;
    try {
      storage?.setItem(STORAGE_KEY, mode);
    } catch {
      /* not persisted */
    }
    listener?.(layout);
  };
  window.addEventListener("resize", apply);
  apply();
  return {
    get mode() {
      return mode;
    },
    get modesEnabled() {
      return enabled;
    },
    get graphics() {
      return graphics;
    },
    get layout() {
      return layout;
    },
    get onLayout() {
      return listener;
    },
    set onLayout(fn: ((layout: DisplayLayout) => void) | null) {
      listener = fn;
      fn?.(layout);
    },
    cycle() {
      if (!enabled) return "authentic";
      mode = nextDisplayMode(mode);
      apply();
      return mode;
    },
    set(m: DisplayMode) {
      mode = m;
      apply();
    },
    setModesEnabled(on: boolean) {
      enabled = on;
      apply();
    },
    setGraphics(g: Graphics) {
      graphics = g;
      apply();
    },
  };
}
