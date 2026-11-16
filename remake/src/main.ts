import audioTables from "./data/audio_tables.json";
import demoScript from "./data/demo_script.json";
import historyPages from "./data/history_pages.json";
import mxp from "./data/scenarios/map/MXP.json";
import shipLog from "./data/ship_log.json";
import { App, type AppData } from "./app/app.js";
import type { MorseTables } from "./audio/morse.js";
import { SoundEngine } from "./audio/soundEngine.js";
import type { CourseJson, DemoScriptDocument, HistoryPagesDocument, MxpJson, OrdersJson, ShipLogDocument } from "./core/index.js";
import { attachKeyboard } from "./input/keyboard.js";
import { Gfx } from "./render/gfx.js";
import { setupDisplay } from "./render/display.js";
import { SpriteLibrary } from "./render/sprites.js";
import { TitleArt } from "./render/titleArt.js";
import { CockpitLayouts } from "./render/cockpitLayouts.js";

/** Scenario number from a file name such as ".../COURXX7.json" or ".../ORDXX12.json". */
function byNumber<T>(modules: Record<string, T>): Record<number, T> {
  const out: Record<number, T> = {};
  for (const [path, value] of Object.entries(modules)) {
    const n = /(\d+)\.json$/.exec(path)?.[1];
    if (n) out[Number(n)] = value;
  }
  return out;
}

async function boot(): Promise<void> {
  const canvas = document.getElementById("screen") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("canvas #screen not found");
  const gfx = new Gfx(canvas);

  const data: AppData = {
    courses: byNumber(import.meta.glob<CourseJson>("./data/scenarios/courses/COURXX*.json", { eager: true, import: "default" })),
    orders: byNumber(import.meta.glob<OrdersJson>("./data/scenarios/orders/ORDXX*.json", { eager: true, import: "default" })),
    mxp: mxp as unknown as MxpJson,
    shipLog: shipLog as unknown as ShipLogDocument,
    demo: demoScript as unknown as DemoScriptDocument,
    history: historyPages as unknown as HistoryPagesDocument,
    morse: audioTables.morse as unknown as MorseTables,
  };

  let sprites: SpriteLibrary | null = null;
  try {
    sprites = await SpriteLibrary.load();
  } catch (err) {
    console.warn("sprites unavailable, drawing placeholders", err);
  }

  let titleArt: TitleArt | null = null;
  try {
    titleArt = await TitleArt.load();
  } catch (err) {
    console.warn("title artwork unavailable, using the sprite layout", err);
  }
  let cockpit: CockpitLayouts | null = null;
  try {
    cockpit = await CockpitLayouts.load();
  } catch (err) {
    console.warn("cockpit layouts unavailable, using the approximated screens", err);
  }

  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }

  const app = new App(gfx, data, sprites, new SoundEngine(), storage, Math.random, titleArt, cockpit);
  const display = setupDisplay(canvas, document.getElementById("crt"), storage);
  attachKeyboard(window, (e) => {
    // V cycles authentic -> fit window -> fit window + CRT scanlines (not while typing into a prompt)
    if ((e.key === "v" || e.key === "V") && !e.ctrlKey && !e.altKey && !e.metaKey && !app.textEntryActive) {
      display.cycle();
      return;
    }
    app.keydown(e);
  });
  canvas.focus();

  const loop = (t: number): void => {
    app.frame(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Debugging hook: lets a browser test drive the app without synthesising keys.
  (window as unknown as { __gato?: App }).__gato = app;
}

void boot();
