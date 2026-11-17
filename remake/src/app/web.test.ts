import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { App, SPLASH_MS, TICKS_PER_SECOND, type AppData } from "./app.js";
import { TELETYPE_ROWS, Teletype, ordersScreen } from "./teletype.js";
import { HistoryViewer } from "./historyViewer.js";
import { LogStore } from "./logStore.js";
import { buildOrdersTimeline, revealedLines } from "./orders.js";
import { FixedTimestepRunner, interpolate, lerpAngle, takeSnapshot } from "./runner.js";
import { buildMorseSchedule, type MorseTables } from "../audio/morse.js";
import { noteFrequency, parsePlay, totalSeconds } from "../audio/play.js";
import { BIOS_TICK_SECONDS, EFFECTS, SoundEngine, type AudioContextLike, type OscillatorLike } from "../audio/soundEngine.js";
import { ADVANCED_FEATURES, ADVANCED_INDENTED, HOTKEY_GROUP, RADIO_MESSAGES, Simulation, buildScenario, createRng, type CourseJson, type DemoScriptDocument, type HistoryPagesDocument, type MxpJson, type OrdersJson, type ShipLogDocument } from "../core/index.js";
import { LineEditor, parseCoordinates, shouldPreventDefault, translateGameControlKey, translatePlayKey } from "../input/keyboard.js";
import { CONTROL_DEFS, CONTROL_GROUPS, Keymap, isLocked, type ControlId } from "../input/controls.js";
import type { Gfx } from "../render/gfx.js";
import { computeDisplaySize, isDisplayMode, nextDisplayMode } from "../render/display.js";
import { HELP_ACTION_WIDTH, HELP_KEY_WIDTH, TITLE_HOLD_MS, TITLE_WIPE_MS, TITLE_WIPE_ROWS, controlsPages, drawLauncherMenu, drawTitle, titleWipeLines, wrapText, ADVANCED_PAGE_SIZE } from "../render/textScreens.js";
import { CockpitLayouts, SCREEN_NAMES, decodePacked, parseCockpitLayouts, type ScreenName } from "../render/cockpitLayouts.js";
import { drawControlRoomLayout, drawDamageLayout, drawLinePx, scopeHorizon } from "../render/cockpitScreens.js";
import type { PlayView } from "../render/playScreens.js";
import type { PlayScreen as PlayScreenName } from "../input/keyboard.js";
import { TrailBuffer } from "../render/trails.js";
import { TitleArt, frameToRgba, parseTitleArt } from "../render/titleArt.js";

const root = new URL("../../", import.meta.url);
const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, root), "utf8")) as T;
const audio = read<{ morse: MorseTables }>("src/data/audio_tables.json");
const shipLog = read<ShipLogDocument>("src/data/ship_log.json");
const mxp = read<MxpJson>("src/data/scenarios/map/MXP.json");

function scenarioSim(n = 1, seed = 5): Simulation {
  return new Simulation({
    scenario: buildScenario(n, read<CourseJson>(`src/data/scenarios/courses/COURXX${n}.json`), read<OrdersJson>(`src/data/scenarios/orders/ORDXX${n}.json`), mxp),
    rng: createRng(seed),
    options: { difficulty: 0, sound: true, timeOfDay: 1, inControlRoom: true },
    shipLog,
  });
}

class FakeOsc implements OscillatorLike {
  type = "sine";
  freq: number[] = [];
  stopped = false;
  starts: number[] = [];
  frequency = { setValueAtTime: (v: number) => this.freq.push(v) };
  connect(): void {}
  start(t = 0): void {
    this.starts.push(t);
  }
  stop(): void {
    this.stopped = true;
  }
}

function fakeAudio(): { ctx: AudioContextLike; oscs: FakeOsc[] } {
  const oscs: FakeOsc[] = [];
  const param = { setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined };
  const ctx: AudioContextLike = {
    currentTime: 0,
    destination: {},
    createOscillator: () => {
      const o = new FakeOsc();
      oscs.push(o);
      return o;
    },
    createGain: () => ({ gain: param, connect: () => undefined }),
  };
  return { ctx, oscs };
}

describe("PLAY and Morse", () => {
  it("parses the original dit and dah strings", () => {
    const dit = parsePlay("B32P62");
    expect(dit[0]?.seconds).toBeCloseTo(0.0625, 5);
    expect(dit[1]?.seconds).toBeCloseTo(0.03226, 4);
    expect(dit[0]?.frequency).toBeCloseTo(493.88, 1);
    expect(totalSeconds(parsePlay("B10P62"))).toBeCloseTo(0.2 + 0.03226, 4);
    expect(totalSeconds(parsePlay("MBT40O4L64B-"))).toBeCloseTo(0.09375, 5);
    expect(noteFrequency("A", 4)).toBeCloseTo(440, 6);
  });

  it("builds the Morse timeline from audio_tables.json: S = three dits, last character of a line is silent", () => {
    const s = buildMorseSchedule("SOS ", audio.morse, { soundOn: true });
    const dur = (c: string) => s.find((x) => x.char === c)?.duration ?? 0;
    expect(dur("S")).toBeCloseTo(3 * 0.09476, 4);
    expect(dur("O")).toBeCloseTo(3 * 0.23226, 4);
    expect(dur(" ")).toBe(0);
    const tail = buildMorseSchedule("SO", audio.morse, { soundOn: true });
    expect(tail[1]?.duration).toBe(0); // 'O' ends the line: printed, not sounded
    expect(buildMorseSchedule("SOS ", audio.morse, { soundOn: false }).every((c) => c.duration === 0)).toBe(true);
  });

  it("hides the order text from difficulty 8 and reveals it character by character", () => {
    const lines = ["A B"];
    const shown = buildOrdersTimeline(lines, audio.morse, { difficulty: 3, soundOn: true });
    const hidden = buildOrdersTimeline(lines, audio.morse, { difficulty: 8, soundOn: true });
    expect(revealedLines(lines, shown, shown.duration)[0]).toBe("A B");
    expect(revealedLines(lines, hidden, hidden.duration)[0]).toBe("   ");
    expect(revealedLines(lines, shown, 0)[0]).toBe("A");
  });
});

describe("sound engine", () => {
  it("plays square-wave tones, respects the sound flag, and cancels", () => {
    const { ctx, oscs } = fakeAudio();
    const engine = new SoundEngine(() => ctx);
    engine.sound(2500, 3);
    expect(oscs).toHaveLength(1);
    expect(oscs[0]?.type).toBe("square");
    expect(oscs[0]?.freq[0]).toBe(2500);
    engine.enabled = false;
    engine.effect("depthCharge");
    expect(oscs).toHaveLength(1);
    engine.enabled = true;
    const handle = engine.playMorse(["E "], audio.morse);
    expect(oscs).toHaveLength(2); // E = one dit at 493.88 Hz
    expect(oscs[1]?.freq[0]).toBeCloseTo(493.88, 1);
    handle.cancel();
    expect(oscs[1]?.stopped).toBe(true);
    expect(EFFECTS.torpedoLaunch.steps[0]).toEqual({ frequency: 600, ticks: 1 });
    expect(BIOS_TICK_SECONDS).toBeCloseTo(0.0549, 4);
  });

  it("treats SOUND below 37 Hz as stop", () => {
    const { ctx, oscs } = fakeAudio();
    new SoundEngine(() => ctx).sound(37 - 1, 5);
    expect(oscs).toHaveLength(0);
  });
});

describe("keyboard", () => {
  it("maps the original controls", () => {
    expect(translatePlayKey({ key: "F1" })).toEqual({ type: "sim", command: { type: "speed", level: "F1" } });
    expect(translatePlayKey({ key: "F8" })).toEqual({ type: "sim", command: { type: "fire" } });
    expect(translatePlayKey({ key: "F6" })).toEqual({ type: "screen", screen: "radar" });
    expect(translatePlayKey({ key: "ArrowLeft" })).toEqual({ type: "sim", command: { type: "rudder", direction: "left" } });
    expect(translatePlayKey({ key: "ArrowDown" })).toEqual({ type: "sim", command: { type: "planes", direction: "down" } });
    expect(translatePlayKey({ key: "t" })).toEqual({ type: "sim", command: { type: "doors" } });
    expect(translatePlayKey({ key: "5" })).toEqual({ type: "sim", command: { type: "neutral" } });
    expect(translatePlayKey({ key: "x", code: "Numpad5" })).toEqual({ type: "sim", command: { type: "neutral" } });
    expect(translatePlayKey({ key: "C" })).toEqual({ type: "screen", screen: "chart" });
    expect(translatePlayKey({ key: "q" })).toEqual({ type: "screen", screen: "quadrant" });
    expect(translatePlayKey({ key: "Tab" })).toEqual({ type: "screen", screen: "gameControl" });
    expect(translatePlayKey({ key: "z" })).toEqual({ type: "debugPrompt" });
    expect(translatePlayKey({ key: "Escape" })).toEqual({ type: "quit" });
    expect(translatePlayKey({ key: "d", ctrlKey: true })).toBeNull();
    expect(translateGameControlKey({ key: "3" })).toEqual({ type: "item", item: 3 });
    expect(translateGameControlKey({ key: "Enter" })).toEqual({ type: "leave" });
    expect(shouldPreventDefault({ key: "F5" })).toBe(true);
    expect(shouldPreventDefault({ key: "r" })).toBe(false);
  });

  it("edits a prompt line and parses coordinates", () => {
    const e = new LineEditor(5);
    for (const k of ["1", "2", ",", "3", "x", "y"]) e.handle({ key: k });
    expect(e.value).toBe("12,3x");
    e.handle({ key: "Backspace" });
    e.handle({ key: "4" });
    expect(e.handle({ key: "Enter" })).toBe("enter");
    expect(parseCoordinates("7500, 9000")).toEqual({ x: 7500, y: 9000 });
    expect(parseCoordinates("7500")).toBeNull();
  });
});

describe("fixed-timestep runner", () => {
  it("runs whole 10 Hz steps and exposes the remainder as interpolation alpha", () => {
    const sim = scenarioSim();
    sim.command({ type: "speed", level: "F5" });
    const runner = new FixedTimestepRunner(sim, 10);
    runner.frame(0);
    const r = runner.frame(250);
    expect(r.steps).toBe(2);
    expect(sim.tick).toBe(2);
    expect(r.alpha).toBeCloseTo(0.5, 6);
    const r2 = runner.frame(260);
    expect(r2.steps).toBe(0);
    expect(r2.alpha).toBeCloseTo(0.6, 6);
  });

  it("clamps very long frames and pauses", () => {
    const sim = scenarioSim();
    const runner = new FixedTimestepRunner(sim, 10, 250);
    runner.frame(0);
    expect(runner.frame(60_000).steps).toBe(2);
    runner.paused = true;
    expect(runner.frame(61_000).steps).toBe(0);
  });

  it("blends positions, takes the short way round for headings and does not blend jumps", () => {
    const a = takeSnapshot(scenarioSim());
    const b = structuredClone(a);
    a.sub.x = 100;
    b.sub.x = 110;
    a.sub.heading = 6.2;
    b.sub.heading = 0.1;
    const mid = interpolate(a, b, 0.5);
    expect(mid.sub.x).toBe(105);
    expect(mid.sub.heading).toBeCloseTo(lerpAngle(6.2, 0.1, 0.5), 9);
    expect(Math.abs(mid.sub.heading - 6.2)).toBeLessThan(0.2);
    b.sub.x = 5000;
    expect(interpolate(a, b, 0.5).sub.x).toBe(5000);
  });
});

describe("history viewer and captain's log", () => {
  it("pages through the text, then offers reread (R) or return", () => {
    const doc = read<HistoryPagesDocument>("src/data/history_pages.json");
    const v = new HistoryViewer(doc);
    expect(v.view).toMatchObject({ phase: "page", index: 0 });
    for (let i = 0; i < doc.pages.length - 1; i += 1) v.press("x");
    expect(v.view).toMatchObject({ phase: "page", index: doc.pages.length - 1 });
    expect(v.press("x")).toEqual({ phase: "end" });
    expect(v.press("R")).toMatchObject({ phase: "page", index: 0 });
    for (let i = 0; i < doc.pages.length; i += 1) v.press("x");
    expect(v.press("r")).toEqual({ phase: "done" }); // only an exact capital R rereads
  });

  it("persists sunk ships and mission count, and resets", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const log = new LogStore(shipLog, storage);
    const rec = shipLog.records[0];
    if (!rec) throw new Error("no records");
    log.apply([{ type: "shipSunk", slot: 3, typeCode: 4, record: { slot: 3, typeCode: 4, record: rec.record, name: rec.name, tonnage: rec.tonnage } }, { type: "missionComplete", reason: "convoySunk" }], "11-16-2026");
    const again = new LogStore(shipLog, storage);
    expect(again.shipsSunk).toBe(1);
    expect(again.totalTonnage).toBe(rec.tonnage);
    expect(again.missionsCompleted).toBe(1);
    expect(again.document().records[0]?.sunk_flag).toBe(1);
    again.reset();
    expect(new LogStore(shipLog, storage).shipsSunk).toBe(0);
  });
});

describe("application shell", () => {
  function makeApp(): { app: App; oscs: FakeOsc[] } {
    const { ctx, oscs } = fakeAudio();
    const g = new Proxy({}, { get: () => () => undefined }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = {
      courses,
      orders,
      mxp,
      shipLog,
      demo: read<DemoScriptDocument>("src/data/demo_script.json"),
      history: read<HistoryPagesDocument>("src/data/history_pages.json"),
      morse: audio.morse,
    };
    let seed = 0.3;
    const app = new App(g, data, null, new SoundEngine(() => ctx), null, () => (seed = (seed * 9301 + 0.49297) % 1));
    return { app, oscs };
  }
  const press = (app: App, ...keys: string[]) => keys.forEach((key) => app.keydown({ key }));

  it("routes title -> menu -> demo -> menu (F1) and history -> menu", () => {
    const { app } = makeApp();
    app.frame(0);
    press(app, "x");
    expect(app.mode).toBe("menu");
    press(app, "2");
    expect(app.mode).toBe("demo");
    app.frame(10);
    app.frame(1000);
    press(app, "F1");
    expect(app.mode).toBe("menu");
    press(app, "3");
    expect(app.mode).toBe("history");
    for (let i = 0; i < 20; i += 1) press(app, "x");
    expect(app.mode).toBe("menu");
  });

  it("starts a mission with Morse orders; the first key stops the Morse and shows the whole message, the second enters the control room", () => {
    const { app, oscs } = makeApp();
    press(app, "x", "1");
    expect(app.mode).toBe("orders");
    expect(oscs.length).toBeGreaterThan(5);
    press(app, "x");
    expect(app.mode).toBe("orders");
    expect(oscs.every((o) => o.stopped)).toBe(true);
    press(app, "x");
    expect(app.mode).toBe("play");
    const sim = (app as unknown as { sim: Simulation }).sim;
    expect(oscs.every((o) => o.stopped)).toBe(true);
    press(app, "F3", "t");
    expect(sim.sub.orderedSpeed).toBeGreaterThan(0);
    expect(sim.sub.doorsOpen).toBe(true);
    app.frame(0);
    app.frame(250);
    app.frame(500);
    expect(sim.tick).toBe(1); // 2.5 steps a second: one step in the first 500 ms
  });

  it("GAME CONTROL changes difficulty, sound and time of day; sound off silences effects", () => {
    const { app, oscs } = makeApp();
    press(app, "x", "1", "x", "x", "Tab");
    expect(app.screen).toBe("gameControl");
    press(app, "1", "7", "Enter");
    expect(app.settings.difficulty).toBe(7);
    press(app, "2");
    expect(app.settings.sound).toBe(false);
    press(app, "3");
    expect(app.settings.timeOfDay).toBe(0);
    press(app, "Enter");
    expect(app.screen).toBe("control");
    const before = oscs.length;
    press(app, "t");
    expect(oscs.length).toBe(before);
  });

  it("hidden Z -> PAED -> coordinates command moves the boat from the chart only", () => {
    const { app } = makeApp();
    press(app, "x", "1", "x", "x");
    const sim = (app as unknown as { sim: Simulation }).sim;
    press(app, "z");
    expect((app as unknown as { prompt: unknown }).prompt).toBeNull(); // not on the chart
    press(app, "c", "z", "P", "A", "E", "D", "Enter", "1", "2", "0", "0", "0", ",", "1", "0", "0", "0", "0", "Enter");
    expect(sim.sub.x).toBe(12000);
    expect(sim.sub.y).toBe(10000);
    press(app, "c", "z", "n", "o", "Enter");
    expect((app as unknown as { prompt: unknown }).prompt).toBeNull(); // wrong password
  });

  it("Z -> PAED teleport into the island of ORDXX7 at night completes the rescue through the whole app", () => {
    const { app } = makeApp();
    press(app, "x"); // title -> menu
    app.startMission(7, 1);
    press(app, "x", "x"); // skip the orders: the first key shows the whole message, the second continues
    press(app, "Tab", "3", "Enter"); // TIME OF DAY -> night (0), as the orders ask
    expect(app.settings.timeOfDay).toBe(0);
    const sim = (app as unknown as { sim: Simulation }).sim;
    const island = sim.scenario.islands[14];
    if (!island) throw new Error("missing island");
    const coords = `${island.x},${island.y - island.innerRadius - 80}`.split("");
    press(app, "c", "z", ..."PAED".split(""), "Enter", ...coords, "Enter");
    expect(sim.currentQuadrant).toBe(14);
    app.frame(0);
    for (let t = 250; t <= 3000 && !sim.missionComplete; t += 250) app.frame(t);
    expect(sim.missionComplete).toBe(true);
    expect(sim.status).toBe("running"); // the original goes on playing after MISSION COMPLETED
    expect(app.mode).toBe("play");
    expect(app.radio.history).toEqual(["contactMade", "missionCompleted"]);
    expect(app.log.missionsCompleted).toBe(1);
  });

  it("display modes cycle and size the picture", () => {
    expect(nextDisplayMode("authentic")).toBe("fit");
    expect(nextDisplayMode("fit")).toBe("crt");
    expect(nextDisplayMode("crt")).toBe("authentic");
    expect(computeDisplaySize("authentic", 1000, 700)).toEqual({ width: 960, height: 600 }); // 3x, whole pixels
    expect(computeDisplaySize("fit", 1000, 700)).toEqual({ width: 1000, height: 625 }); // fills the width, keeps 8:5
    expect(computeDisplaySize("crt", 1920, 1080)).toEqual({ width: 1728, height: 1080 });
    expect(computeDisplaySize("authentic", 200, 100)).toEqual({ width: 320, height: 200 }); // never below 1x
    expect(isDisplayMode("fit")).toBe(true);
    expect(isDisplayMode("sepia")).toBe(false);
  });
});

describe("title artwork", () => {
  const raw = (): Record<string, any> => read<Record<string, any>>("public/assets/title_screen.json");

  function fakeCanvas(puts: { data: Uint8ClampedArray }[]) {
    return () =>
      ({
        getContext: () => ({
          createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
          putImageData: (img: { data: Uint8ClampedArray }) => puts.push(img),
        }),
      }) as unknown as HTMLCanvasElement;
  }

  it("loads the exported GATO.EXE artwork cleanly", () => {
    const doc = parseTitleArt(raw());
    expect(Object.keys(doc.frames)).toEqual(["spectrum_logo", "title_letters", "title", "launcher_menu"]);
    const title = doc.frames[doc.primary]!;
    expect(doc.primary).toBe("title");
    expect(title.palette).toEqual(["#5555ff", "#55ffff", "#ff55ff", "#ffffff"]); // COLOR 9 background, bright palette 1
    // the striped GATO lettering: colour 2, 3442 pixels, inside x 40..276 and y 21..78
    const magenta: [number, number][] = [];
    title.rows.forEach((row, y) => [...row].forEach((v, x) => v === "2" && magenta.push([x, y])));
    expect(magenta).toHaveLength(3442);
    expect(Math.min(...magenta.map((p) => p[0]))).toBe(40);
    expect(Math.max(...magenta.map((p) => p[0]))).toBe(276);
    expect(Math.min(...magenta.map((p) => p[1]))).toBe(21);
    expect(Math.max(...magenta.map((p) => p[1]))).toBe(78);
    expect(title.text).toContainEqual({ row: 15, col: 12, text: "CLASS  SUBMARINE", colorIndex: 3 });
    expect(title.text).toContainEqual({ row: 23, col: 9, text: "Spectrum HoloByte, Inc.", colorIndex: 3 });
  });

  it("rejects a damaged asset instead of rendering it", () => {
    expect(() => parseTitleArt({ ...raw(), format: "other" })).toThrow(/format/);
    const shortRow = raw();
    shortRow.frames.title.rows[10] = "0".repeat(319);
    expect(() => parseTitleArt(shortRow)).toThrow(/row 10/);
    const badPixel = raw();
    badPixel.frames.title.rows[0] = "4".repeat(320);
    expect(() => parseTitleArt(badPixel)).toThrow(/two-bit/);
  });

  it("converts pixel values through the frame palette and draws the picture, text layer and prompt", () => {
    const puts: { data: Uint8ClampedArray }[] = [];
    const art = new TitleArt(parseTitleArt(raw()), fakeCanvas(puts));
    const rgba = frameToRgba(art.primary);
    expect([...rgba.slice(0, 4)]).toEqual([0x55, 0x55, 0xff, 255]); // (0,0) is background
    const calls: [string, unknown[]][] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    drawTitle(g, art, null, 0);
    expect(puts).toHaveLength(1); // the picture is built once
    expect(puts[0]?.data.slice(0, 4)).toEqual(rgba.slice(0, 4));
    expect(calls.find(([n]) => n === "image")?.[1].slice(1)).toEqual([0, 0, 320, 200, 0, 0, 320, 200]);
    expect(calls.filter(([n]) => n === "text").map(([, a]) => a[2])).toContain("CLASS  SUBMARINE");
    expect(calls.some(([n, a]) => n === "centered" && a[1] === "PRESS ANY KEY")).toBe(true);
    drawTitle(g, null, null, 0); // asset missing: the old layout still draws the credits
    expect(calls.some(([n, a]) => n === "centered" && a[1] === "by Paul Arlton and Ed Dawson")).toBe(true);
  });

  it("draws the launcher_menu frame (surfaced submarine, COLOR 1,1 palette) behind the menu and falls back without it", () => {
    const puts: { data: Uint8ClampedArray }[] = [];
    const art = new TitleArt(parseTitleArt(raw()), fakeCanvas(puts));
    const calls: [string, unknown[]][] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    drawLauncherMenu(g, "2", undefined, art);
    expect(art.frame("launcher_menu")?.palette).toEqual(["#0000aa", "#00aaaa", "#aa00aa", "#aaaaaa"]);
    expect([...(puts[0]?.data.slice(0, 4) ?? [])]).toEqual([0x00, 0xaa, 0xaa, 255]); // sky is colour 1 (cyan), above the sea
    expect(calls.find(([n]) => n === "image")?.[1].slice(1)).toEqual([0, 0, 320, 200, 0, 0, 320, 200]);
    const text = calls.filter(([n]) => n === "text").map(([, a]) => a.slice(0, 3));
    expect(text).toContainEqual([4, 15, "[1]   NORMAL PLAY  (DEFAULT)"]);
    expect(text).toContainEqual([4, 22, "FROM THE MENU ABOVE:"]);
    expect(text).toContainEqual([24, 22, "2_"]);

    const noMenu = raw();
    delete noMenu.frames.launcher_menu;
    calls.length = 0;
    drawLauncherMenu(g, "", undefined, new TitleArt(parseTitleArt(noMenu), fakeCanvas([])));
    expect(calls.some(([n]) => n === "image")).toBe(false);
    expect(calls.some(([n, a]) => n === "text" && String(a[2]).startsWith("[1]"))).toBe(true);
    calls.length = 0;
    drawLauncherMenu(g, "", undefined, null);
    expect(calls.some(([n]) => n === "image")).toBe(false);
  });
});

describe("radio room and message overlay in the app", () => {
  function startApp(): { app: App; sim: Simulation } {
    const { ctx } = fakeAudio();
    const g = new Proxy({}, { get: () => () => undefined }) as unknown as Gfx;
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[Number(/(\d+)\.json$/.exec(f)?.[1])] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[Number(/(\d+)\.json$/.exec(f)?.[1])] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const app = new App(g, data, null, new SoundEngine(() => ctx), null, () => 0.3);
    app.startMission(1, 5);
    app.keydown({ key: "x" }); // skip the orders (two keys)
    app.keydown({ key: "x" });
    app.frame(0);
    return { app, sim: (app as unknown as { sim: Simulation }).sim };
  }
  const frames = (app: App, from: number, count: number): void => {
    for (let i = 1; i <= count; i += 1) app.frame(from + i * 250);
  };

  it("M with a damaged radio room shows RADIO ROOM REPORTS HEAVY DAMAGE until a key closes it; that key does nothing else", () => {
    const { app, sim } = startApp();
    sim.sub.damage[1] = 1;
    app.keydown({ key: "c" });
    expect(app.screen).toBe("chart");
    app.keydown({ key: "m" });
    expect(app.screen).toBe("control");
    expect(app.mode).toBe("play");
    frames(app, 0, 3); // the queued report is emitted by the next simulation step, 400 ms away at 2.5 steps a second
    expect(app.radio.current?.message.id).toBe("radioDamaged");
    expect(app.radio.current?.lines.map((l) => l.text)).toEqual(["RADIO ROOM", "REPORTS HEAVY DAMAGE", "NO MESSAGES MAY BE RECEIVED"]);
    frames(app, 500, 40); // ten seconds: no timer removes it
    expect(app.radio.current?.message.id).toBe("radioDamaged");
    app.keydown({ key: "t" }); // closes the box and is not passed on
    expect(app.radio.current).toBeNull();
    expect(sim.sub.doorsOpen).toBe(false);
    app.keydown({ key: "t" });
    expect(sim.sub.doorsOpen).toBe(true);
  });

  it("M with a working radio re-reads the orders (remake) and any key returns to play", () => {
    const { app } = startApp();
    app.keydown({ key: "m" });
    expect(app.mode).toBe("orders");
    app.keydown({ key: "x" });
    expect(app.mode).toBe("play");
    expect(app.radio.current).toBeNull();
  });
});

describe("cockpit layouts extracted from GATO1.EXE", () => {
  const raw = (): Record<string, any> => read<Record<string, any>>("public/assets/cockpit_layouts.json"); // eslint-disable-line @typescript-eslint/no-explicit-any
  const canvasFactory = () => () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;
  const recorder = () => {
    const calls: [string, unknown[]][] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    return { g, calls };
  };
  const view = (sim: Simulation, settings = { difficulty: 0, sound: true, timeOfDay: 1 as const }): PlayView => ({
    sim, snap: takeSnapshot(sim), settings, sprites: null, log: new LogStore(shipLog, null), timeMs: 0,
  });

  it("loads cleanly: six screens with 2-bit bitmaps, ten digit sprites and the glyphs", () => {
    const doc = parseCockpitLayouts(raw());
    expect(Object.keys(doc.screens).sort()).toEqual([...SCREEN_NAMES].sort());
    for (const name of SCREEN_NAMES) expect(decodePacked(doc.screens[name].staticPacked)).toHaveLength(64000);
    expect(doc.screens.control_room.palette).toEqual(["#555555", "#55ffff", "#ff55ff", "#ffffff"]); // COLOR 8,1
    expect(doc.screens.chart.palette[0]).toBe("#00aa00"); // COLOR 18,1
    expect(doc.screens.captains_log.palette[0]).toBe("#5555ff"); // COLOR 9,1
    expect(doc.sprites.digits).toHaveLength(10);
    expect(() => parseCockpitLayouts({ ...raw(), format: "x" })).toThrow(/format/);
    const bad = raw();
    bad.screens.radar.staticPacked = "AAAA";
    expect(() => parseCockpitLayouts(bad)).toThrow(/packed bitmap/);
  });

  it("reproduces the original's pixels: frame lines, the runtime's integer CIRCLE and the hull DRAW", () => {
    const L = new CockpitLayouts(parseCockpitLayouts(raw()), canvasFactory());
    const px = (name: ScreenName, x: number, y: number): number => decodePacked(L.screen(name).staticPacked)[y * 320 + x] as number;
    // control room: BOX (0,100)-(319,196), dial rim CIRCLE (36,135) r32 aspect .9 -> ry = (32 * 230 + 128) >> 8 = 29
    expect([px("control_room", 0, 100), px("control_room", 319, 196), px("control_room", 160, 196), px("control_room", 160, 198)]).toEqual([3, 3, 3, 0]);
    expect([px("control_room", 36 + 32, 135), px("control_room", 36, 135 - 29), px("control_room", 36, 135 - 30)]).toEqual([3, 3, 0]);
    // damage report: CIRCLE (146,60) r115 aspect .07 -> ry 8, cyan; light rings are white
    expect([px("damage_report", 146, 52), px("damage_report", 146, 51), px("damage_report", 146 + 115, 60)]).toEqual([1, 0, 1]);
    expect(px("damage_report", 0, 100)).toBe(1);
    expect(px("damage_report", 26, 119)).toBe(3);
    // chart: BF colour 1 (cyan sea) with grid lines in colour 3
    expect([px("chart", 100, 20), px("chart", 3, 50), px("chart", 65, 100)]).toEqual([1, 3, 3]);
  });

  it("LINE is the runtime's DDA (no anti-aliasing)", () => {
    const { g, calls } = recorder();
    drawLinePx(g, 0, 0, 4, 2, "#fff");
    expect(calls.map(([, a]) => [a[0], a[1]])).toEqual([[0, 0], [1, 1], [2, 1], [3, 2], [4, 2]]);
  });

  it("control room: static layer, needles, values, lights, tubes and the scope colours follow the extracted layout", () => {
    const L = new CockpitLayouts(parseCockpitLayouts(raw()), canvasFactory());
    const sim = scenarioSim();
    sim.sub.depth = 251;
    sim.sub.speed = 0;
    sim.sub.fuel = 36000;
    sim.sub.battery = 1000;
    sim.sub.torpedoes = 24;
    sim.sub.engine = 0;
    sim.sub.doorsOpen = true;
    const { g, calls } = recorder();
    drawControlRoomLayout(g, view(sim), L);
    expect(calls.find(([n]) => n === "image")?.[1].slice(1, 5)).toEqual([0, 0, 320, 200]);
    const rects = calls.filter(([n]) => n === "rect").map(([, a]) => a);
    expect(rects[0]).toEqual([0, 0, 320, 98, "#ff55ff"]); // deep: horizon -1, all sea (colour 2) from row 0 to 97 over the scope
    expect(rects.some((a) => a[0] === 103 && a[1] === 113 && a[2] === 1 && a[3] === 1)).toBe(true); // speed needle tip (103, 135 - 22)
    const text = calls.filter(([n]) => n === "text").map(([, a]) => a.slice(0, 3));
    expect(text).toContainEqual([32, 14, " 400"]);
    expect(text).toContainEqual([32, 16, "1000"]);
    expect(text).toContainEqual([30, 22, "24"]);
    expect(text).toContainEqual([3, 24, "POWER"]);
    expect(rects.some((a) => a[0] === 63 && a[1] === 183 && a[2] === 49 && a[3] === 9 && a[4] === "#ffffff")).toBe(true); // OFF is inverted
    expect(scopeHorizon({ depth: 0, periscopeUp: false })).toBe(79);
    expect(scopeHorizon({ depth: 10, periscopeUp: true })).toBe(79);
    expect(scopeHorizon({ depth: 10, periscopeUp: false })).toBe(39);
    expect(scopeHorizon({ depth: 30, periscopeUp: false })).toBe(-1);
  });

  it("damage report: magenta overlays and the filled light only for damaged compartments", () => {
    const L = new CockpitLayouts(parseCockpitLayouts(raw()), canvasFactory());
    const sim = scenarioSim();
    const magenta = (): number => {
      const { g, calls } = recorder();
      drawDamageLayout(g, view(sim), L);
      return calls.filter(([n, a]) => n === "rect" && a[4] === "#ff55ff").length;
    };
    expect(magenta()).toBe(0);
    sim.sub.damage[1] = 1; // radio room
    expect(magenta()).toBeGreaterThan(40);
    const { g, calls } = recorder();
    drawDamageLayout(g, view(sim), L);
    expect(calls.filter(([n]) => n === "text").map(([, a]) => a[2])).toEqual(expect.arrayContaining(["CONTROL RM", "RADIO RM", "CONNING TOWER"]));
  });
});

describe("every screen draws from the extracted layouts", () => {
  const canvasFactory = () => () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;
  const layouts = (): CockpitLayouts => new CockpitLayouts(parseCockpitLayouts(read("public/assets/cockpit_layouts.json")), canvasFactory());
  type Call = [string, unknown[]];

  function makeApp(cockpit: CockpitLayouts | null, storage: { getItem(k: string): string | null; setItem(k: string, v: string): void } | null = null): { app: App; calls: Call[]; sim: () => Simulation } {
    const { ctx } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    let seed = 0.3;
    const app = new App(g, data, null, new SoundEngine(() => ctx), storage, () => (seed = (seed * 9301 + 0.49297) % 1), null, cockpit);
    return { app, calls, sim: () => (app as unknown as { sim: Simulation }).sim };
  }
  const press = (app: App, ...keys: string[]) => keys.forEach((key) => app.keydown({ key }));
  const startMission = (app: App): void => {
    press(app, "x");
    app.startMission(1, 1);
    press(app, "x", "x");
  };
  const images = (calls: Call[]): unknown[] => calls.filter(([n]) => n === "image").map(([, a]) => a[0]);

  const SCREENS: [PlayScreenName, ScreenName][] = [
    ["control", "control_room"],
    ["radar", "radar"],
    ["chart", "chart"],
    ["quadrant", "quadrant_map"],
    ["log", "captains_log"],
    ["damage", "damage_report"],
  ];

  it.each(SCREENS)("mission screen %s blits the %s layer and never the legacy drawing", (screen, name) => {
    const L = layouts();
    const { app, calls } = makeApp(L);
    startMission(app);
    app.screen = screen;
    calls.length = 0;
    app.frame(0);
    expect(images(calls)).toContain(L.image(name));
  });

  it("without the layouts the same screens fall back, so the checks above really discriminate", () => {
    const L = layouts();
    const { app, calls } = makeApp(null);
    startMission(app);
    for (const [screen] of SCREENS) {
      app.screen = screen;
      calls.length = 0;
      app.frame(0);
      expect(images(calls).some((i) => (SCREEN_NAMES as readonly string[]).some((n) => i === L.image(n as ScreenName)))).toBe(false);
    }
  });

  it("GAME CONTROL uses the grey layout background and the original title cell", () => {
    const { app, calls } = makeApp(layouts());
    startMission(app);
    press(app, "Tab");
    expect(app.screen).toBe("gameControl");
    calls.length = 0;
    app.frame(0);
    expect(calls).toContainEqual(["clear", ["#555555"]]);
    expect(calls.find(([n, a]) => n === "text" && a[2] === "GAME CONTROL")?.[1].slice(0, 2)).toEqual([15, 2]);
  });

  it("the demo draws chart, radar, quadrant map, damage report and captain's log from the layouts too", () => {
    const L = layouts();
    const { app, calls } = makeApp(L);
    press(app, "x", "2");
    expect(app.mode).toBe("demo");
    const demo = (app as unknown as { demo: { screen: string } }).demo;
    const expected: [string, ScreenName][] = [
      ["chart", "chart"],
      ["radar", "radar"],
      ["quadrantMap", "quadrant_map"],
      ["damageReport", "damage_report"],
      ["captainsLog", "captains_log"],
      ["periscope", "control_room"],
    ];
    let t = 0;
    for (const [screen, name] of expected) {
      demo.screen = screen;
      calls.length = 0;
      t += 100;
      app.frame(t);
      expect(images(calls), screen).toContain(L.image(name));
    }
    demo.screen = "gameControl";
    calls.length = 0;
    app.frame(t + 100);
    expect(calls).toContainEqual(["clear", ["#555555"]]);
  });

  it("Orders and History are text screens: the original has no bitmap layout for them, so they draw without cockpit_layouts.json", () => {
    const L = layouts();
    const { app, calls } = makeApp(L);
    press(app, "x", "1");
    expect(app.mode).toBe("orders");
    calls.length = 0;
    app.frame(0);
    expect(calls.some(([n]) => n === "text")).toBe(true);
    expect(images(calls).some((i) => (SCREEN_NAMES as readonly string[]).some((n) => i === L.image(n as ScreenName)))).toBe(false);
    press(app, "x", "x");
    expect(app.mode).toBe("play");
    const history = makeApp(L);
    press(history.app, "x", "3");
    expect(history.app.mode).toBe("history");
    history.calls.length = 0;
    history.app.frame(0);
    expect(history.calls.some(([n]) => n === "text80")).toBe(true);
    expect(images(history.calls).some((i) => (SCREEN_NAMES as readonly string[]).some((n) => i === L.image(n as ScreenName)))).toBe(false);
  });

  it("CockpitLayouts.load fetches and validates the asset, and rejects a failed request", async () => {
    const doc = read("public/assets/cockpit_layouts.json");
    const original = globalThis.fetch;
    try {
      globalThis.fetch = (async () => ({ ok: true, status: 200, json: async () => doc })) as unknown as typeof fetch;
      const L = await CockpitLayouts.load("x.json", canvasFactory());
      expect(L.palette("control_room")[0]).toBe("#555555");
      globalThis.fetch = (async () => ({ ok: false, status: 404, json: async () => ({}) })) as unknown as typeof fetch;
      await expect(CockpitLayouts.load("x.json", canvasFactory())).rejects.toThrow(/404/);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("persistent wake trails (key W)", () => {
  it("TrailBuffer remembers dots only while recording, dedupes, clips, caps and clears", () => {
    const t = new TrailBuffer(10);
    t.mark(5, 5, 2, 2, 3);
    expect(t.size).toBe(0);
    t.recording = true;
    t.mark(5, 5, 2, 2, 3);
    t.mark(5, 5, 2, 2, 3);
    expect(t.size).toBe(4);
    t.mark(-1, -1, 2, 2, 1); // only (0,0) is inside
    t.mark(319, 199, 3, 3, 1); // only (319,199)
    expect(t.size).toBe(6);
    t.mark(100, 100, 10, 10, 2);
    expect(t.size).toBe(10);
    const rects: unknown[][] = [];
    t.draw({ rect: (...a: unknown[]) => rects.push(a) } as unknown as Gfx, ["#000", "#111", "#222", "#333"]);
    expect(rects).toHaveLength(10);
    expect(rects).toContainEqual([5, 5, 1, 1, "#333"]);
    t.clear();
    expect(t.size).toBe(0);
  });

  function run(trails: boolean, screen: PlayScreenName): number {
    const { ctx } = fakeAudio();
    const calls: [string, unknown[]][] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const canvases = () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;
    const L = new CockpitLayouts(parseCockpitLayouts(read("public/assets/cockpit_layouts.json")), () => canvases());
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const app = new App(g, data, null, new SoundEngine(() => ctx), null, () => 0.5, null, L);
    app.keydown({ key: "x" });
    app.startMission(1, 1);
    app.keydown({ key: "x" });
    app.keydown({ key: "x" });
    const sim = (app as unknown as { sim: Simulation }).sim;
    app.setTrails(trails);
    app.screen = screen;
    (app as unknown as { setScreen(s: PlayScreenName): void }).setScreen(screen);
    let t = 0;
    for (let i = 0; i < 8; i += 1) {
      // sail next to a ship so the radar has a blip, and move so that every frame leaves a new dot
      const ship = sim.vessels.find((s) => s.slot < 9 && s.slot >= 2 && s.typeCode !== 0 && !s.sunk);
      sim.sub.x = (ship?.x ?? 0) - 300 - 100 * i;
      sim.sub.y = (ship?.y ?? 0) - 200;
      sim.sub.depth = 0;
      t += 100;
      app.frame(t);
    }
    calls.length = 0;
    app.frame(t + 1); // same tick: draws the remembered dots without adding any
    return calls.filter(([n]) => n === "rect").length;
  }

  it.each(["chart", "quadrant", "radar"] as const)("%s: tracks build up with W on and are clean with W off", (screen) => {
    expect(run(true, screen)).toBeGreaterThan(run(false, screen));
  });

  it("W toggles and remembers the choice; the default is the original's persistent tracks", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const first = makeAppWith(storage);
    expect(first.trails).toBe(true);
    first.keydown({ key: "x" });
    first.keydown({ key: "w" });
    expect(first.trails).toBe(false);
    expect(makeAppWith(storage).trails).toBe(false);
    first.keydown({ key: "W" });
    expect(first.trails).toBe(true);
    expect(translatePlayKey({ key: "w" })).toEqual({ type: "toggleTrails" });
  });

  function makeAppWith(storage: { getItem(k: string): string | null; setItem(k: string, v: string): void }): App {
    const { ctx } = fakeAudio();
    const g = new Proxy({}, { get: () => () => undefined }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const app = new App(g, data, null, new SoundEngine(() => ctx), storage);
    app.keydown({ key: "x" });
    app.startMission(1, 1);
    app.keydown({ key: "x" });
    app.keydown({ key: "x" });
    return app;
  }
});

describe("Spectrum HoloByte splash", () => {
  const raw = (): Record<string, any> => read<Record<string, any>>("public/assets/title_screen.json");
  const canvas = () => () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;
  type Call = [string, unknown[]];

  function bootApp(art: TitleArt | null): { app: App; calls: Call[]; art: TitleArt | null } {
    const { ctx } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const data: AppData = { courses: {}, orders: {}, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    return { app: new App(g, data, null, new SoundEngine(() => ctx), null, () => 0.5, art), calls, art };
  }
  const artwork = (): TitleArt => new TitleArt(parseTitleArt(raw()), canvas());

  it("boots on the spectrum_logo frame with its black background and bright cyan/magenta/white palette", () => {
    const { app, calls, art } = bootApp(artwork());
    expect(app.mode).toBe("splash");
    app.frame(100);
    const logo = art?.frame("spectrum_logo");
    expect(logo?.palette).toEqual(["#000000", "#55ffff", "#ff55ff", "#ffffff"]);
    expect(calls[0]).toEqual(["clear", ["#000000"]]);
    const image = calls.find(([n]) => n === "image");
    expect(image?.[1][0]).toBe(art?.image("spectrum_logo"));
    expect(image?.[1].slice(1)).toEqual([0, 0, 320, 200, 0, 0, 320, 200]); // the whole 320x200 picture; Authentic, Fit and CRT only scale the canvas
    const text = calls.filter(([n]) => n === "text").map(([, a]) => a.slice(0, 3));
    expect(text).toContainEqual([17, 23, "PRESENTS"]);
    expect(text).toContainEqual([36, 3, "TM"]);
    expect(calls.some(([n, a]) => n === "centered" && a[1] === "PRESS ANY KEY")).toBe(false);
    for (const mode of ["authentic", "fit", "crt"] as const) {
      const size = computeDisplaySize(mode, 1280, 800);
      expect(size.width / size.height).toBeCloseTo(1.6, 1);
    }
  });

  it("moves on to the title page by itself after 2.5 s", () => {
    const { app, calls, art } = bootApp(artwork());
    app.frame(1000);
    app.frame(1000 + SPLASH_MS - 1);
    expect(app.mode).toBe("splash");
    calls.length = 0;
    app.frame(1000 + SPLASH_MS);
    expect(app.mode).toBe("title");
    expect(calls.find(([n]) => n === "image")?.[1][0]).toBe(art?.image("title_letters")); // the wipe starts from the solid lettering
    expect(calls.some(([n, a]) => n === "centered" && a[1] === "PRESS ANY KEY")).toBe(false);
    calls.length = 0;
    app.frame(1000 + SPLASH_MS + TITLE_HOLD_MS + TITLE_WIPE_MS + 50);
    expect(calls.find(([n]) => n === "image")?.[1][0]).toBe(art?.image("title"));
    expect(calls.some(([n, a]) => n === "centered" && a[1] === "PRESS ANY KEY")).toBe(true);
  });

  it("any key or a click skips the splash straight to the title page, and the next key opens the menu", () => {
    for (const skip of [(a: App) => a.keydown({ key: "x" }), (a: App) => a.keydown({ key: "Escape" }), (a: App) => a.tap()]) {
      const { app } = bootApp(artwork());
      app.frame(0);
      skip(app);
      expect(app.mode).toBe("title");
      app.frame(10);
      expect(app.mode).toBe("title"); // the timer must not fire again
      app.keydown({ key: "x" });
      expect(app.mode).toBe("menu");
    }
    const { app } = bootApp(artwork());
    app.keydown({ key: "x" }); // before the first frame
    expect(app.mode).toBe("title");
    app.tap();
    expect(app.mode).toBe("menu"); // a click also leaves the title page
    app.tap();
    expect(app.mode).toBe("menu"); // but does nothing in the menu
  });

  it("starts on the title page when the artwork or its logo frame is missing", () => {
    expect(bootApp(null).app.mode).toBe("title");
    const noLogo = raw();
    delete noLogo.frames.spectrum_logo;
    expect(bootApp(new TitleArt(parseTitleArt(noLogo), canvas())).app.mode).toBe("title");
  });
});

describe("title wipe (title_letters -> title)", () => {
  const raw = (): Record<string, any> => read<Record<string, any>>("public/assets/title_screen.json");

  it("the original's 43 erase lines turn the solid lettering into the striped title frame exactly", () => {
    expect(TITLE_WIPE_ROWS).toHaveLength(43);
    expect(TITLE_WIPE_ROWS.slice(0, 3)).toEqual([103, 99, 95]);
    expect(TITLE_WIPE_ROWS[21]).toBe(19);
    expect(TITLE_WIPE_ROWS.slice(22, 25)).toEqual([20, 24, 28]);
    expect(TITLE_WIPE_ROWS[42]).toBe(100);
    const doc = raw();
    const letters: string[] = doc.frames.title_letters.rows.slice();
    for (const y of TITLE_WIPE_ROWS) letters[y] = "0".repeat(320);
    // the lines paint the background colour (0); below row 110 the title frame adds the credits and the (c) ring
    expect(letters.slice(0, 110)).toEqual(doc.frames.title.rows.slice(0, 110));
    expect(doc.frames.title_letters.palette[0]).toBe(doc.frames.title.palette[0]);
  });

  it("progress: nothing during the hold, everything after the wipe time", () => {
    expect(titleWipeLines(0)).toBe(0);
    expect(titleWipeLines(TITLE_HOLD_MS)).toBe(0);
    let last = 0;
    for (let t = TITLE_HOLD_MS; t <= TITLE_HOLD_MS + TITLE_WIPE_MS; t += 25) {
      const n = titleWipeLines(t);
      expect(n).toBeGreaterThanOrEqual(last);
      last = n;
    }
    expect(titleWipeLines(TITLE_HOLD_MS + TITLE_WIPE_MS)).toBe(43);
    expect(titleWipeLines(1e9)).toBe(43);
  });

  it("draws the letters with the erase lines in the background colour, then the finished page with the prompt", () => {
    const canvas = () => () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;
    const art = new TitleArt(parseTitleArt(raw()), canvas());
    const calls: [string, unknown[]][] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    drawTitle(g, art, null, 0, TITLE_HOLD_MS + TITLE_WIPE_MS / 2);
    const lines = titleWipeLines(TITLE_HOLD_MS + TITLE_WIPE_MS / 2);
    expect(lines).toBeGreaterThan(15);
    expect(lines).toBeLessThan(30);
    expect(calls.find(([n]) => n === "image")?.[1][0]).toBe(art.image("title_letters"));
    const erase = calls.filter(([n, a]) => n === "rect" && a[3] === 1 && a[2] === 320).map(([, a]) => [a[1], a[4]]);
    expect(erase).toEqual(TITLE_WIPE_ROWS.slice(0, lines).map((y) => [y, "#5555ff"]));
    expect(calls.some(([n, a]) => n === "text" && a[2] === "TM")).toBe(true);
    expect(calls.some(([n]) => n === "centered")).toBe(false);
    calls.length = 0;
    drawTitle(g, art, null, 0); // no timing: the finished page (demo)
    expect(calls.find(([n]) => n === "image")?.[1][0]).toBe(art.image("title"));
    expect(calls.some(([n, a]) => n === "centered" && a[1] === "PRESS ANY KEY")).toBe(true);
  });

  it("a key press during the wipe still leaves the title page", () => {
    const { ctx } = fakeAudio();
    const g = new Proxy({}, { get: () => () => undefined }) as unknown as Gfx;
    const canvas = () => () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;
    const data: AppData = { courses: {}, orders: {}, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const app = new App(g, data, null, new SoundEngine(() => ctx), null, () => 0.5, new TitleArt(parseTitleArt(raw()), canvas()));
    app.keydown({ key: "x" }); // splash
    app.frame(0);
    app.frame(100);
    expect(app.mode).toBe("title");
    app.keydown({ key: "x" });
    expect(app.mode).toBe("menu");
  });
});

describe("controls overlay and mission select", () => {
  type Call = [string, unknown[]];
  function makeApp(): { app: App; calls: Call[]; sim: () => Simulation } {
    const { ctx } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const app = new App(g, data, null, new SoundEngine(() => ctx), null, () => 0.5);
    return { app, calls, sim: () => (app as unknown as { sim: Simulation }).sim };
  }
  const press = (app: App, ...keys: string[]) => keys.forEach((key) => app.keydown({ key }));

  it("? and H open a quick reference that pauses the world; any key closes it without acting", () => {
    expect(translatePlayKey({ key: "?" })).toEqual({ type: "help" });
    expect(translatePlayKey({ key: "h" })).toEqual({ type: "help" });
    expect(translatePlayKey({ key: "H" })).toEqual({ type: "help" });
    for (const p of controlsPages()) {
      expect(p.title.length).toBeLessThanOrEqual(22);
      expect(p.rows.length).toBeLessThanOrEqual(10);
      for (const [key, action] of p.rows) {
        expect(key.length, key).toBeLessThanOrEqual(HELP_KEY_WIDTH);
        expect(action.length, action).toBeLessThanOrEqual(HELP_ACTION_WIDTH); // key column + action fit the 40 columns
      }
    }
    for (const key of ["?", "h"]) {
      const { app, calls, sim } = makeApp();
      press(app, "x");
      app.startMission(1, 1);
      press(app, "x", "x");
      app.frame(0);
      expect(app.helpVisible).toBe(false);
      press(app, key);
      expect(app.helpVisible).toBe(true);
      const tick = sim().tick;
      calls.length = 0;
      app.frame(1000);
      app.frame(2000);
      expect(sim().tick).toBe(tick); // paused
      const text = calls.filter(([n]) => n === "text").map(([, a]) => a[2]);
      expect(text).toEqual(expect.arrayContaining(["CONTROLS - SPEED AND ENGINES", "1/5", "F1", "Ahead flank (10)", "LEFT/RIGHT=PAGE  OTHER KEY=CLOSE"]));
      press(app, "t"); // closes the overlay and is not passed on
      expect(app.helpVisible).toBe(false);
      expect(sim().sub.doorsOpen).toBe(false);
      app.frame(2100);
      calls.length = 0;
      app.frame(2200);
      expect(calls.some(([n, a]) => n === "text" && String(a[2]).startsWith("CONTROLS - "))).toBe(false);
      press(app, "t");
      expect(sim().sub.doorsOpen).toBe(true);
    }
  });

  it("the quick reference has pages: Right/Down/Space/PageDown next, Left/Up/PageUp back (wrapping); the page list follows the switches", () => {
    const { app, calls, sim } = makeApp();
    press(app, "x");
    app.startMission(1, 1);
    press(app, "x", "x");
    app.frame(0);
    const shown = (): string[] => {
      calls.length = 0;
      app.frame(app.helpPageIndex * 100 + 10);
      return calls.filter(([n]) => n === "text").map(([, a]) => String(a[2]));
    };
    press(app, "?");
    expect(shown()).toContain("CONTROLS - SPEED AND ENGINES");
    press(app, "ArrowRight");
    expect(app.helpPageIndex).toBe(1);
    expect(shown()).toEqual(expect.arrayContaining(["CONTROLS - STEERING", "2/5", "LEFT", "Rudder left", "RIGHT", "Rudder right"]));
    press(app, " ");
    expect(shown()).toEqual(expect.arrayContaining(["CONTROLS - SCOPE AND WEAPONS", "3/5", "Fire torpedo"]));
    press(app, "PageDown", "PageDown");
    expect(shown()).toEqual(expect.arrayContaining(["CONTROLS - REMAKE EXTRAS", "5/5", "Wake trails on / off", "[", "Time speed down", "]", "Time speed up", "Display mode", "Back to the menu"]));
    press(app, "ArrowDown");
    expect(app.helpPageIndex).toBe(0); // wraps round
    press(app, "ArrowLeft");
    expect(app.helpPageIndex).toBe(4);
    press(app, "PageUp", "ArrowUp");
    expect(app.helpPageIndex).toBe(2);
    expect(app.helpVisible).toBe(true);
    const tick = sim().tick;
    app.frame(5000);
    expect(sim().tick).toBe(tick); // still paused while paging
    press(app, "Escape");
    expect(app.helpVisible).toBe(false);
    expect(app.mode).toBe("play"); // the closing key is not passed on
    press(app, "?");
    expect(app.helpPageIndex).toBe(0); // always opens on the first page
    press(app, "x");
    app.advanced.set("trailToggle", false);
    app.advanced.set("displayModes", false);
    app.advanced.set("timeKeys", false);
    press(app, "?", "ArrowLeft");
    const extras = shown();
    expect(extras).toContain("? or H");
    expect(extras).toContain("Back to the menu");
    expect(extras).not.toContain("Wake trails on / off");
    expect(extras).not.toContain("Display mode");
    expect(extras).not.toContain("Time speed down");
    expect(extras).not.toContain("Time speed up");
  });

  it("the overlay is not opened while typing into a prompt or on GAME CONTROL, and is cleared with the mission", () => {
    const { app } = makeApp();
    press(app, "x");
    app.startMission(1, 1);
    press(app, "x", "x", "c", "z");
    press(app, "h");
    expect(app.helpVisible).toBe(false); // H went into the PASSWORD prompt
    press(app, "Escape", "Tab", "?");
    expect(app.helpVisible).toBe(false);
    press(app, "Enter", "?");
    expect(app.helpVisible).toBe(true);
    press(app, "x", "Escape"); // leave the overlay, then quit to the menu
    expect(app.mode).toBe("menu");
    expect(app.helpVisible).toBe(false);
  });

  it("GAME CONTROL [5] picks the next mission (1-20) or goes back to the original's random pick", () => {
    const { app, calls, sim } = makeApp();
    press(app, "x");
    app.startMission(1, 1);
    press(app, "x", "x", "Tab");
    expect(app.settings.mission ?? null).toBeNull();
    app.frame(0);
    expect(calls.some(([n, a]) => n === "text" && a[2] === "RANDOM")).toBe(true);
    expect(calls.some(([n, a]) => n === "text" && a[2] === "[5] NEXT MISSION")).toBe(true);
    press(app, "5", "1", "2", "Enter");
    expect(app.settings.mission).toBe(12);
    calls.length = 0;
    app.frame(10);
    expect(calls.some(([n, a]) => n === "text" && a[2] === "12")).toBe(true);
    expect(sim().scenario.id).toBe(1); // the running mission is not changed
    press(app, "Enter", "Escape"); // leave GAME CONTROL, quit to the menu
    expect(app.mode).toBe("menu");
    press(app, "1");
    expect(sim().scenario.id).toBe(12);
    press(app, "x", "x", "Tab", "5", "R", "Enter");
    expect(app.settings.mission).toBeNull();
    press(app, "5", "2", "1", "Enter");
    expect(app.settings.mission).toBeNull(); // 21 is out of range
    press(app, "5", "0", "Enter");
    expect(app.settings.mission).toBeNull();
    press(app, "Enter", "Escape", "1");
    expect(sim().scenario.id).toBe(11); // random with a fixed generator: 1 + FIX(0.5 * 20)
  });

  it("the demo's GAME CONTROL screen stays as in the original, without the remake's mission row", () => {
    const { app, calls } = makeApp();
    press(app, "x", "2");
    (app as unknown as { demo: { screen: string } }).demo.screen = "gameControl";
    calls.length = 0;
    app.frame(100);
    expect(calls.some(([n, a]) => n === "text" && a[2] === "[4] RESET CAPTAIN'S LOG")).toBe(true);
    expect(calls.some(([n, a]) => n === "text" && a[2] === "[5] NEXT MISSION")).toBe(false);
  });
});

describe("1984 pacing: 2.5 Hz simulation under 60 FPS rendering", () => {
  const FRAME_MS = 1000 / 60;
  type Call = [string, unknown[]];
  type Storage = { getItem(k: string): string | null; setItem(k: string, v: string): void };
  const memoryStorage = (): Storage & { map: Map<string, string> } => {
    const map = new Map<string, string>();
    return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
  };

  function makeApp(storage: Storage | null = null): { app: App; calls: Call[]; sim: () => Simulation; runner: () => FixedTimestepRunner } {
    const { ctx } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const app = new App(g, data, null, new SoundEngine(() => ctx), storage, () => 0.5);
    const priv = app as unknown as { sim: Simulation; runner: FixedTimestepRunner };
    return { app, calls, sim: () => priv.sim, runner: () => priv.runner };
  }
  const press = (app: App, ...keys: string[]) => keys.forEach((key) => app.keydown({ key }));
  function startPlay(storage: Storage | null = null) {
    const h = makeApp(storage);
    press(h.app, "x");
    h.app.startMission(1, 1);
    press(h.app, "x", "x");
    h.app.frame(0);
    return h;
  }
  /** Run 60 FPS frames from `from` for `ms`; returns the time of the last frame. */
  function run(app: App, from: number, ms: number): number {
    let t = from;
    for (let i = 0; i < Math.round(ms / FRAME_MS); i += 1) {
      t += FRAME_MS;
      app.frame(t);
    }
    return t;
  }

  it("the runner and the app default to 2.5 steps a second, a step every 400 ms", () => {
    const sim = scenarioSim();
    const runner = new FixedTimestepRunner(sim);
    expect(runner.hz).toBe(2.5);
    expect(runner.stepMs).toBe(400);
    runner.frame(0);
    expect(runner.frame(200).steps).toBe(0);
    const r = runner.frame(400);
    expect(r.steps).toBe(1);
    expect(r.alpha).toBeCloseTo(0, 6);
    expect(TICKS_PER_SECOND).toBe(2.5);
    const { app, sim: appSim, runner: appRunner } = startPlay();
    expect(app.timeScale).toBe(1);
    expect(app.stepRate).toBe(2.5);
    expect(appRunner().stepMs).toBe(400);
    expect(appSim().tick).toBe(0);
  });

  it("60 FPS frames glide between 400 ms steps: position and heading change on every frame, with no jumps", () => {
    const sim = scenarioSim();
    sim.sub.speed = 8;
    sim.sub.orderedSpeed = 8;
    sim.sub.rudder = 0.005; // the boat is turning
    const runner = new FixedTimestepRunner(sim);
    let t = 0;
    runner.frame(t);
    const xs: number[] = [];
    const headings: number[] = [];
    let alphaDrops = 0;
    let lastAlpha = 0;
    let steps = 0;
    for (let i = 0; i < 120; i += 1) {
      t += FRAME_MS;
      const r = runner.frame(t);
      steps += r.steps;
      if (r.alpha < lastAlpha) alphaDrops += 1; // only at a step boundary
      lastAlpha = r.alpha;
      xs.push(r.render.sub.x);
      headings.push(r.render.sub.heading);
    }
    expect(steps).toBe(5); // two seconds at 2.5 Hz
    expect(alphaDrops).toBe(steps); // alpha restarts once per step and rises in between
    const dx = xs.slice(1).map((x, i) => Math.abs(x - (xs[i] as number)));
    const dh = headings.slice(1).map((h, i) => Math.abs(h - (headings[i] as number)));
    // 24 frames per step: after the first steps every frame moves the boat and turns it, by about the same small amount
    expect(dx.slice(30).every((d) => d > 0)).toBe(true);
    expect(dh.slice(60).every((d) => d > 0)).toBe(true); // the turn rate is computed at the end of a step, so the heading starts changing at step 2
    const typical = (dx.slice(30).reduce((a, b) => a + b, 0) / dx.slice(30).length) || 1;
    expect(Math.max(...dx.slice(30))).toBeLessThan(typical * 2.5);
    expect(new Set(xs.map((x) => x.toFixed(6))).size).toBeGreaterThan(90); // not 5 jumps in 120 frames (only the first step's frames repeat)
  });

  it("changing the step rate keeps the interpolation phase", () => {
    const runner = new FixedTimestepRunner(scenarioSim());
    runner.frame(0);
    expect(runner.frame(200).alpha).toBeCloseTo(0.5, 6);
    runner.setHz(10);
    expect(runner.stepMs).toBe(100);
    expect(runner.frame(200).alpha).toBeCloseTo(0.5, 6);
    expect(runner.frame(250).steps).toBe(1);
  });

  it("control inputs show on the very next frame, long before the boat answers at the next step (with the helm status line switched on)", () => {
    const { app, calls, sim } = startPlay();
    app.showControlHud = true;
    let t = run(app, 0, 40);
    const tick = sim().tick;
    const frameOf = (): string => {
      calls.length = 0;
      t += FRAME_MS;
      app.frame(t);
      return JSON.stringify(calls);
    };
    const before = frameOf();
    press(app, "F3");
    expect(sim().sub.orderedSpeed).toBeGreaterThan(0); // the order is in the simulation at once
    const after = frameOf();
    expect(sim().tick).toBe(tick); // no simulation step in between
    expect(after).not.toBe(before);
    expect(calls.some(([n, a]) => n === "text" && /^ORDER \d/.test(String(a[2])))).toBe(true); // helm status line
    expect(sim().sub.speed).toBeLessThan(sim().sub.orderedSpeed); // the boat itself still has to accelerate, one step at a time
    press(app, "ArrowLeft", "ArrowDown");
    frameOf();
    expect(calls.some(([n, a]) => n === "text" && String(a[2]).includes("RUDDER LEFT") && String(a[2]).includes("PLANES DOWN"))).toBe(true);
    const scope = frameOf();
    press(app, "p");
    expect(sim().sub.scopeFacing).toBe("P");
    expect(frameOf()).not.toBe(scope);
    const doors = frameOf();
    press(app, "t");
    expect(sim().sub.doorsOpen).toBe(true);
    expect(frameOf()).not.toBe(doors);
    const screen = frameOf();
    press(app, "c");
    expect(app.screen).toBe("chart");
    expect(frameOf()).not.toBe(screen);
    expect(sim().tick).toBe(tick);
    t = run(app, t, 2000); // the toast fades
    calls.length = 0;
    run(app, t, 20);
    expect(calls.some(([n, a]) => n === "text" && /^ORDER /.test(String(a[2])))).toBe(false);
  });

  it("[ and ] change the time compression 1x / 2x / 4x = 2.5 / 5 / 10 steps a second, with a brief indicator", () => {
    expect(translatePlayKey({ key: "[" })).toEqual({ type: "timeScale", direction: "slower" });
    expect(translatePlayKey({ key: "]" })).toEqual({ type: "timeScale", direction: "faster" });
    const { app, calls, sim, runner } = startPlay();
    const stepsIn = (ms: number, from: number): { steps: number; end: number } => {
      const before = sim().tick;
      const end = run(app, from, ms + 10); // a little over, so rounding of the frame times cannot lose a step
      return { steps: sim().tick - before, end };
    };
    let t = 0;
    let r = stepsIn(4000, t);
    expect(r.steps).toBe(10);
    t = r.end;
    press(app, "]");
    expect([app.timeScale, app.stepRate, runner().hz]).toEqual([2, 5, 5]);
    calls.length = 0;
    t = run(app, t, 20);
    expect(calls.some(([n, a]) => n === "text" && a[2] === "TIME x2  (5 STEPS/S)")).toBe(true);
    r = stepsIn(4000, t);
    expect(r.steps).toBe(20);
    t = r.end;
    press(app, "]");
    expect([app.timeScale, app.stepRate, runner().hz]).toEqual([4, 10, 10]);
    r = stepsIn(4000, t);
    expect(r.steps).toBe(40);
    t = r.end;
    press(app, "]");
    expect(app.timeScale).toBe(4); // already the fastest
    press(app, "[", "[", "[");
    expect([app.timeScale, runner().hz]).toEqual([1, 2.5]);
    t = run(app, t, 2500); // the indicator expires
    calls.length = 0;
    run(app, t, 20);
    expect(calls.some(([n, a]) => n === "text" && String(a[2]).startsWith("TIME x"))).toBe(false);
  });

  it("time compression is remembered, validated, and shown on GAME CONTROL item 6", () => {
    const storage = memoryStorage();
    const first = startPlay(storage);
    press(first.app, "Tab", "6");
    expect(first.app.timeScale).toBe(2);
    expect(first.runner().hz).toBe(5);
    first.calls.length = 0;
    first.app.frame(5000);
    expect(first.calls.some(([n, a]) => n === "text" && a[2] === "[6] TIME COMPRESSION")).toBe(true);
    expect(first.calls.some(([n, a]) => n === "text" && a[2] === "2X")).toBe(true);
    press(first.app, "6");
    expect(first.app.timeScale).toBe(4);
    expect(storage.map.get("gato.timeScale")).toBe("4");
    const second = makeApp(storage);
    expect(second.app.timeScale).toBe(4); // restored
    press(second.app, "x");
    second.app.startMission(1, 1);
    expect(second.runner().hz).toBe(10);
    storage.map.set("gato.timeScale", "3");
    expect(makeApp(storage).app.timeScale).toBe(1); // junk falls back to 1x
    press(first.app, "6");
    expect(first.app.timeScale).toBe(1);
    const demo = makeApp();
    press(demo.app, "x", "2");
    (demo.app as unknown as { demo: { screen: string } }).demo.screen = "gameControl";
    demo.calls.length = 0;
    demo.app.frame(100);
    expect(demo.calls.some(([n, a]) => n === "text" && a[2] === "[6] TIME COMPRESSION")).toBe(false);
  });
});

describe("demo: intro page, Morse example, narration at the top", () => {
  type Call = [string, unknown[]];
  const canvasFactory = () => () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;

  function makeApp(withLayouts = false): { app: App; calls: Call[]; oscs: FakeOsc[]; sound: SoundEngine } {
    const { ctx, oscs } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const layouts = withLayouts ? new CockpitLayouts(parseCockpitLayouts(read("public/assets/cockpit_layouts.json")), canvasFactory()) : null;
    const sound = new SoundEngine(() => ctx);
    const app = new App(g, data, null, sound, null, () => 0.5, null, layouts);
    return { app, calls, oscs, sound };
  }
  const press = (app: App, ...keys: string[]) => keys.forEach((key) => app.keydown({ key }));
  const texts = (calls: Call[]): [number, number, string][] => calls.filter(([n]) => n === "text").map(([, a]) => [a[0] as number, a[1] as number, a[2] as string]);
  function startDemo(withLayouts = false) {
    const h = makeApp(withLayouts);
    press(h.app, "x", "2");
    h.app.frame(0);
    return h;
  }
  /** Frames at 60 FPS up to `to` ms. */
  function runTo(app: App, from: number, to: number): number {
    let t = from;
    while (t < to) {
      t += 1000 / 60;
      app.frame(t);
    }
    return t;
  }

  it("starts on the grey GATO DEMONSTRATION page with the F1/F2 instructions on their LOCATE cells", () => {
    const { app, calls } = makeApp();
    press(app, "x", "2");
    expect(app.mode).toBe("demo");
    calls.length = 0;
    app.frame(0);
    expect(calls[0]).toEqual(["clear", ["#555555"]]); // COLOR 8,1
    expect(texts(calls)).toEqual([
      [12, 7, "GATO DEMONSTRATION"],
      [5, 10, "PRESS FUNCTION KEY 1 (F1) TO EXIT"],
      [2, 12, " FUNCTION KEY 2 (F2) TO TURN OFF SOUND"],
    ]);
    expect(calls.some(([n]) => n === "image")).toBe(false); // not the cockpit
    expect(calls.every(([n, a]) => n !== "text" || a[3] === "#ffffff")).toBe(true);
  });

  it("with the extracted layouts the intro uses the control-room palette (grey #555555, white)", () => {
    const { app, calls } = makeApp(true);
    press(app, "x", "2");
    calls.length = 0;
    app.frame(0);
    expect(calls[0]).toEqual(["clear", ["#555555"]]);
    expect(texts(calls)).toHaveLength(3);
  });

  it("F1 exits to the launcher from the intro; F2 turns the sound off and stays on the intro", () => {
    const f1 = startDemo();
    press(f1.app, "F1");
    expect(f1.app.mode).toBe("menu");
    const f2 = startDemo();
    expect(f2.sound.enabled).toBe(true);
    press(f2.app, "F2");
    expect(f2.sound.enabled).toBe(false);
    expect(f2.app.mode).toBe("demo");
    f2.calls.length = 0;
    f2.app.frame(100);
    expect(texts(f2.calls)[0]).toEqual([12, 7, "GATO DEMONSTRATION"]); // still the intro
  });

  it("the intro gives way to the Morse example after its hold time or at any other key", () => {
    const timed = startDemo();
    const hold = read<DemoScriptDocument>("src/data/demo_script.json").intro?.seconds_estimate ?? 0;
    expect(hold).toBeGreaterThan(0);
    let t = runTo(timed.app, 0, hold * 1000 - 100);
    timed.calls.length = 0;
    timed.app.frame(t + 10);
    expect(texts(timed.calls)[0]).toEqual([12, 7, "GATO DEMONSTRATION"]);
    runTo(timed.app, t, hold * 1000 + 200);
    timed.calls.length = 0;
    timed.app.frame(hold * 1000 + 300);
    expect(texts(timed.calls).some(([, , s]) => s.includes("GATO DEMONSTRATION"))).toBe(false);
    expect(timed.calls.some(([n, a]) => n === "rect" && a[4] === "#000000")).toBe(false); // no longer the grey screen
    const keyed = startDemo();
    press(keyed.app, "x");
    keyed.calls.length = 0;
    keyed.app.frame(50);
    expect(keyed.calls[0]).toEqual(["clear", ["#000000"]]); // the black text screen of the Morse example
  });

  it("the Morse example types DEMORD into a light-grey band on the black screen while its Morse sounds, and any key skips it", () => {
    const { app, calls, oscs } = startDemo();
    press(app, "x");
    expect(oscs.length).toBeGreaterThan(5); // the Morse of the whole text is scheduled
    // start state: nothing typed yet, the band is the spaces line scrolled up to rows 22
    calls.length = 0;
    app.frame(10);
    expect(calls[0]).toEqual(["clear", ["#000000"]]);
    expect(texts(calls).filter(([, , s]) => s !== "_").every(([, , s]) => s.trim() === "")).toBe(true);
    // part way: the first line is partly typed
    calls.length = 0;
    app.frame(10 + 4000);
    const partial = texts(calls).find(([, , s]) => s.includes("THIS"));
    expect(partial?.[2].trim().length).toBeGreaterThan(0);
    expect(partial?.[2]).not.toContain("EXAMPLE OF HOW YOU");
    // done: both lines, the grey band over rows 20-24 (y 152-191) and nothing grey above
    calls.length = 0;
    app.frame(10 + 120_000 * 0 + 59_000);
    const rows = Object.fromEntries(texts(calls).filter(([, , s]) => s !== "_").map(([, row, s]) => [row, s]));
    expect(rows[22]).toBe("   THIS IS AN EXAMPLE OF HOW YOU".padEnd(40, " "));
    expect(rows[23]?.trim()).toBe("");
    expect(rows[24]).toBe("   RECEIVE YOUR ORDERS.".padEnd(40, " "));
    const grey = calls.filter(([n, a]) => n === "rect" && a[4] === "#aaaaaa").map(([, a]) => [a[0], a[1], a[2], a[3]]);
    expect(grey).toEqual([20, 21, 22, 23, 24].map((r) => [0, (r - 1) * 8, 320, 8]));
    expect(calls.filter(([n, a]) => n === "text" && a[3] !== "#000000")).toHaveLength(0); // black on grey
    // any key ends it at once and stops the sound
    press(app, "x");
    expect(oscs.every((o) => o.stopped)).toBe(true);
    calls.length = 0;
    app.frame(10 + 59_100);
    expect(calls.some(([n, a]) => n === "text" && String(a[2]).includes("THIS IS YOUR MAIN SCREEN"))).toBe(true);
  });

  it("the Morse example ends by itself after the typing and the closing hold; without sound it makes none", () => {
    const quiet = startDemo();
    press(quiet.app, "F2", "x");
    expect(quiet.oscs).toHaveLength(0);
    let t = 0;
    const demo = quiet.app as unknown as { demo: { player: { stage: string } }; demoMorse: { timeline: { duration: number } } };
    const seconds = demo.demoMorse.timeline.duration;
    expect(seconds).toBeGreaterThan(1);
    t = runTo(quiet.app, t, (seconds + 1.5) * 1000);
    expect(demo.demo.player.stage).toBe("morse");
    runTo(quiet.app, t, (seconds + 2.6) * 1000); // typing + the 2 s hold
    expect(demo.demo.player.stage).toBe("pages");
  });

  it("narration is a box at the TOP of the screen in the background colour of the screen behind it, with no F1/F2 banner", () => {
    const { app, calls } = startDemo(true);
    press(app, "x", "x");
    calls.length = 0;
    app.frame(100);
    const box = calls.find(([n, a]) => n === "rect" && a[0] === 5 && a[1] === 5);
    expect(box?.[1]).toEqual([5, 5, 310, 46, "#555555"]); // LINE (5,5)-(314,50),0,BF on the control room's grey
    expect(texts(calls).filter(([c, r]) => r <= 6 && c >= 1).map(([c, r, s]) => [c, r, s])).toEqual([
      [9, 2, "THIS IS YOUR MAIN SCREEN"],
      [3, 4, "YOU ARE NOW IN THE THE CONTROL ROOM"],
      [5, 5, "YOU MAY CONTROL ALL OPERATIONS"],
      [7, 6, "OF THE SUBMARINE FROM HERE"],
    ]);
    expect(texts(calls).some(([, , s]) => /F1|F2|EXIT|SOUND/.test(s) && !s.includes("CONTROL"))).toBe(false);
    expect(calls.some(([n, a]) => n === "rect" && Number(a[1]) > 100 && a[4] === "#000000")).toBe(false); // nothing is boxed near the bottom gauges
    // the chart page paints the box with the chart's green and the first quadrant text rows
    const chart = (app as unknown as { demo: { player: { index: number; elapsed: number; pageHoldSeconds(p: unknown): number } } }).demo.player;
    const pages = read<DemoScriptDocument>("src/data/demo_script.json").pages;
    const idx = pages.findIndex((p) => p.lines[0]?.startsWith("THIS IS THE CHART"));
    chart.index = idx - 1;
    chart.elapsed = chart.pageHoldSeconds(pages[idx - 1]) + 0.01;
    calls.length = 0;
    app.frame(200);
    expect(calls.find(([n, a]) => n === "rect" && a[0] === 5 && a[1] === 5)?.[1]).toEqual([5, 5, 310, 46, "#00aa00"]);
    expect(texts(calls).slice(0, 4)).toEqual([
      [2, 2, "THIS IS THE CHART OF YOUR PATROL AREA"],
      [3, 4, "YOU ARE THE GREEN DOT IN QUADRANT 5"],
      [5, 5, "YOUR SUB-TENDER IS IN QUADRANT 7"],
      [7, 6, "ENEMY SHIPS ARE RED DOTS "],
    ]);
  });

  it("F1 still exits from the narrated pages and F2 mutes", () => {
    const { app, sound } = startDemo();
    press(app, "x", "x");
    app.frame(50);
    press(app, "F2");
    expect(sound.enabled).toBe(false);
    expect(app.mode).toBe("demo");
    press(app, "F1");
    expect(app.mode).toBe("menu");
  });
});

describe("text screen of the orders (SCREEN 0, COLOR 0,7)", () => {
  it("scrolls with the current colours: the spaces line, then DEMORD, ends as rows 20-24 on a black screen", () => {
    const lines = ["   THIS IS AN EXAMPLE OF HOW YOU", "", "   RECEIVE YOUR ORDERS."];
    const screen = ordersScreen(lines, lines);
    const rowText = (r: number): string => screen.cells[r - 1]?.map((c) => c.ch).join("") ?? "";
    expect(rowText(22).trimEnd()).toBe("   THIS IS AN EXAMPLE OF HOW YOU");
    expect(rowText(24).trimEnd()).toBe("   RECEIVE YOUR ORDERS.");
    expect(screen.cells.slice(0, 19).every((cells) => cells.every((c) => !c.grey))).toBe(true);
    expect(screen.cells[19]?.every((c) => c.grey)).toBe(true); // row 20
    expect(screen.cells[20]?.every((c) => c.grey)).toBe(true);
    expect(TELETYPE_ROWS).toBe(24); // row 25 is never written
  });

  it("types a line partly, waits for a blank line's predecessor, and wraps at column 40", () => {
    const part = ordersScreen(["HELLO", "", "WORLD"], ["HEL", "", ""]);
    expect(part.cells[23]?.map((c) => c.ch).join("").trimEnd()).toBe("HEL");
    expect(part.row).toBe(23); // no newline yet: the blank line is only reached when HELLO is complete
    const wrap = new Teletype();
    wrap.print("x".repeat(45));
    expect(wrap.cells[22]?.every((c) => c.ch === "x")).toBe(true); // the 40 characters scrolled up one row
    expect(wrap.cells[23]?.slice(0, 5).map((c) => c.ch).join("")).toBe("xxxxx");
    expect(wrap.col).toBe(5);
  });
});

describe("mission orders on the text screen (reference screenshot 2660312)", () => {
  type Call = [string, unknown[]];
  type Priv = { orders: { lines: string[]; start: number; timeline: { duration: number; chars: { line: number; printAt: number; tones: unknown[] }[] } }; lastFrame: number };

  function makeApp(difficulty = 0): { app: App; calls: Call[]; oscs: FakeOsc[] } {
    const { ctx, oscs } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const app = new App(g, data, null, new SoundEngine(() => ctx), null, () => 0.5);
    app.settings.difficulty = difficulty;
    app.keydown({ key: "x" });
    app.startMission(4, 1); // ORDXX4 is the order of the screenshot: "LARGE NUMBER PATROL CRAFT EAST ..."
    return { app, calls, oscs };
  }
  const texts = (calls: Call[]): [number, number, string][] => calls.filter(([n]) => n === "text").map(([, a]) => [a[0] as number, a[1] as number, a[2] as string]);
  const occupancy = (s: string): string => [...s.padEnd(40)].map((c) => (c === " " ? "." : "#")).join("");
  /** Make the typing look as if it had reached the end of `fragment` (the first time it is printed). */
  function typedThrough(app: App, fragment: string): void {
    const p = app as unknown as Priv;
    const line = p.orders.lines.findIndex((l) => l.includes(fragment));
    const column = (p.orders.lines[line] as string).indexOf(fragment) + fragment.length - 1;
    const at = p.orders.timeline.chars.filter((c) => c.line === line)[column];
    p.orders.start = p.lastFrame - ((at?.printAt ?? 0) + 0.001) * 1000;
  }

  // cells of the screenshot with dark pixels (text) per row, from 2660312 (row 25 is black, rows 6-24 grey)
  const REFERENCE: Record<number, string> = {
    8: ".######..............###.#######.####...",
    12: ".###.#######............................",
    14: ".#####.#########........................",
    16: "..#####.######.######.#####.####........",
    18: "..####.######.########.###.########.....",
    20: "..########.###########.####.######......",
    22: "..####.######.##.#######................",
    24: "..####.###.###..........................",
  };

  it("types the order on the grey band exactly where the original does (rows, columns, band rows 6-24, black elsewhere)", () => {
    const { app, calls } = makeApp();
    expect(app.mode).toBe("orders");
    typedThrough(app, "MAKE MAX EF");
    calls.length = 0;
    app.frame(0); // cursor blink phase: on
    expect(calls[0]).toEqual(["clear", ["#000000"]]);
    const rows = Object.fromEntries(texts(calls).filter(([c, r]) => c === 1 && r <= 24).map(([, r, s]) => [r, s]));
    const underscore = texts(calls).find(([, , s]) => s === "_");
    expect(underscore).toEqual([14, 24, "_"]); // the cursor, where the screenshot has its underscore
    for (const [row, expected] of Object.entries(REFERENCE)) {
      const typed = (rows[Number(row)] ?? "").trimEnd();
      const withCursor = Number(row) === 24 ? typed + "_".padStart(14 - typed.length, " ") : typed;
      expect(occupancy(withCursor), `row ${row}`).toBe(expected);
    }
    const grey = calls.filter(([n, a]) => n === "rect" && a[4] === "#aaaaaa").map(([, a]) => [a[0], a[1], a[2], a[3]]);
    expect(grey).toEqual(Array.from({ length: 19 }, (_, i) => [0, (5 + i) * 8, 320, 8])); // rows 6..24
    expect(calls.filter(([n, a]) => n === "text" && a[3] !== "#000000" && a[1] !== 25)).toHaveLength(0); // black on grey
  });

  it("types the header (classification and DTG) as part of the order and sends it in Morse too", () => {
    const { app, oscs } = makeApp();
    const p = app as unknown as Priv;
    const header = p.orders.lines[0] as string;
    expect(header).toMatch(/^ SECRET {14}DTG \d\d\/\d{4} ZULU$/); // rest of the '@' line + 12 spaces + the date-time group, DTG on column 22
    expect(header.indexOf("DTG")).toBe(21);
    expect(p.orders.timeline.chars.filter((c) => c.line === 0 && c.tones.length > 0).length).toBeGreaterThan(8);
    expect(oscs.length).toBeGreaterThan(20);
    expect(p.orders.lines.slice(0, 3).map((l) => l.trim())).toEqual([header.trim(), "", ""]);
  });

  it("difficulty 8 and 9 print nothing (the Morse still sounds) but the blank lines still scroll the band", () => {
    for (const difficulty of [8, 9]) {
      const { app, calls, oscs } = makeApp(difficulty);
      expect(oscs.length).toBeGreaterThan(20);
      app.frame(10);
      expect(texts(calls).some(([c, r, s]) => c === 1 && r === 25 && s.includes("MORSE ONLY"))).toBe(true);
      const p = app as unknown as Priv;
      p.orders.start = p.lastFrame - (p.orders.timeline.duration + 1) * 1000;
      calls.length = 0;
      app.frame(0);
      const printed = texts(calls).filter(([c, r, s]) => r < 25 && s !== "_" && c === 1).map(([, , s]) => s.trim());
      expect(printed.every((s) => s === "")).toBe(true);
      const grey = calls.filter(([n, a]) => n === "rect" && a[4] === "#aaaaaa").length;
      expect(grey).toBe(19); // 3 rows from the start line + 2 for each of the 8 blank lines of ORDXX4, as with the text shown
    }
    const shown = makeApp(7);
    const p = shown.app as unknown as Priv;
    p.orders.start = p.lastFrame - (p.orders.timeline.duration + 1) * 1000;
    shown.calls.length = 0;
    shown.app.frame(0);
    expect(texts(shown.calls).some(([, , s]) => s.includes("LARGE NUMBER PATROL CRAFT EAST"))).toBe(true);
  });

  it("two-stage skip: the first key stops the Morse and completes the message (still hidden at difficulty 8+), the second enters the control room", () => {
    for (const difficulty of [0, 8]) {
      const { app, calls, oscs } = makeApp(difficulty);
      app.frame(10);
      expect(texts(calls).some(([c, r, s]) => c === 1 && r === 25 && /SKIP|SKIPS/.test(s))).toBe(true);
      expect(texts(calls).some(([, , s]) => s.includes("MAKE MAX EFFORT."))).toBe(false); // only the start of the message so far
      app.keydown({ key: "q" });
      expect(app.mode).toBe("orders"); // not the control room yet
      expect(oscs.every((o) => o.stopped)).toBe(true);
      calls.length = 0;
      app.frame(20);
      const rows = texts(calls).filter(([c]) => c === 1);
      expect(rows.some(([, r, s]) => r === 25 && s === "PRESS ANY KEY TO CONTINUE")).toBe(true);
      expect(rows.some(([, , s]) => s.includes("MAKE MAX EFFORT."))).toBe(difficulty < 8);
      expect(rows.some(([, , s]) => s.includes("LARGE NUMBER PATROL CRAFT EAST"))).toBe(difficulty < 8);
      const grey = calls.filter(([n, a]) => n === "rect" && a[4] === "#aaaaaa").length;
      expect(grey).toBe(19); // the whole band, as at the end of the typing
      app.keydown({ key: "q" });
      expect(app.mode).toBe("play");
      expect(app.screen).toBe("control");
    }
  });

  it("a message that finishes by itself waits for one key with the same prompt", () => {
    const { app, calls } = makeApp();
    const p = app as unknown as Priv;
    p.orders.start = p.lastFrame - (p.orders.timeline.duration + 1) * 1000;
    calls.length = 0;
    app.frame(0);
    expect(texts(calls).some(([c, r, s]) => c === 1 && r === 25 && s === "PRESS ANY KEY TO CONTINUE")).toBe(true);
    expect(app.mode).toBe("orders"); // the remake waits for a key after the last character; the original starts the mission
    app.keydown({ key: "q" });
    expect(app.mode).toBe("play"); // one key is enough now
  });

  it("M re-reads the orders with the whole message already on screen: one key continues", () => {
    const { app, calls } = makeApp();
    app.keydown({ key: "q" });
    app.keydown({ key: "q" });
    expect(app.mode).toBe("play");
    app.keydown({ key: "m" });
    expect(app.mode).toBe("orders");
    calls.length = 0;
    app.frame(0);
    expect(texts(calls).some(([, , s]) => s.includes("MAKE MAX EFFORT."))).toBe(true);
    app.keydown({ key: "q" });
    expect(app.mode).toBe("play");
  });

  it("hidden orders keep the cursor at column 1 and scroll only on blank lines", () => {
    const lines = ["   SECRET", "", "", "  TO: X", "", "  TEXT"];
    const shown = ordersScreen(lines, lines);
    const hidden = ordersScreen(lines, lines.map((l) => " ".repeat(l.length)), true);
    expect(hidden.col).toBe(0);
    expect(hidden.cells.every((cells) => cells.every((c) => c.ch === " "))).toBe(true);
    const greyRows = (t: Teletype): number => t.cells.filter((cells) => cells.some((c) => c.grey)).length;
    expect(greyRows(hidden)).toBe(3 + 2 * 3); // start line + two newlines for each of the three blank lines
    expect(greyRows(shown)).toBe(greyRows(hidden));
  });
});

describe("control HUD flag (the helm status line is remake-only)", () => {
  type Call = [string, unknown[]];
  type Storage = { getItem(k: string): string | null; setItem(k: string, v: string): void };
  const canvasFactory = () => () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;

  function startPlay(storage: Storage | null = null): { app: App; calls: Call[]; sim: () => Simulation; layouts: CockpitLayouts } {
    const { ctx } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const layouts = new CockpitLayouts(parseCockpitLayouts(read("public/assets/cockpit_layouts.json")), canvasFactory());
    const app = new App(g, data, null, new SoundEngine(() => ctx), storage, () => 0.5, null, layouts);
    app.keydown({ key: "x" });
    app.startMission(1, 1);
    app.keydown({ key: "x" });
    app.keydown({ key: "x" });
    app.frame(0);
    return { app, calls, sim: () => (app as unknown as { sim: Simulation }).sim, layouts };
  }

  /** The text drawn in the scope viewport (text rows 1-12 = y 0-96): the original draws none there. */
  const viewportText = (calls: Call[]): string[] => calls.filter(([n, a]) => n === "text" && Number(a[1]) <= 12).map(([, a]) => String(a[2]));
  const textsOf = (calls: Call[]): string[] => calls.filter(([n]) => n === "text").map(([, a]) => String(a[2]));

  it("is off by default: pressing T, the throttle, rudder and planes draws no text over the scope", () => {
    const { app, calls } = startPlay();
    expect(app.showControlHud).toBe(false);
    let t = 100;
    for (const key of ["t", "F3", "ArrowLeft", "ArrowDown", "5", "t"]) {
      app.keydown({ key });
      calls.length = 0;
      t += 17;
      app.frame(t);
      expect(viewportText(calls), key).toEqual([]);
      expect(textsOf(calls).some((s) => /^ORDER |RUDDER|PLANES/.test(s)), key).toBe(false);
    }
  });

  it("T lights the torpedo-door circle on the dashboard on the very next frame and the second T clears it", () => {
    const { app, calls, sim, layouts } = startPlay();
    const light = layouts.doc.sprites.lightOn;
    const lit = (): number =>
      calls.filter(([n, a]) => n === "rect" && Number(a[0]) >= 213 && Number(a[0]) < 213 + (light[0]?.length ?? 0) && Number(a[1]) >= 165 && Number(a[1]) < 165 + light.length).length;
    calls.length = 0;
    app.frame(200);
    expect(sim().sub.doorsOpen).toBe(false);
    expect(lit()).toBe(0);
    const tick = sim().tick;
    app.keydown({ key: "t" });
    calls.length = 0;
    app.frame(217); // the next frame: no simulation step in between
    expect(sim().tick).toBe(tick);
    expect(sim().sub.doorsOpen).toBe(true);
    expect(lit()).toBeGreaterThan(5);
    expect(viewportText(calls)).toEqual([]);
    app.keydown({ key: "t" });
    calls.length = 0;
    app.frame(234);
    expect(sim().sub.doorsOpen).toBe(false);
    expect(lit()).toBe(0);
    expect(viewportText(calls)).toEqual([]);
  });

  it("with showControlHud on, the same keys bring the status line back (code kept behind the flag)", () => {
    const { app, calls } = startPlay();
    app.showControlHud = true;
    app.keydown({ key: "F3" });
    app.keydown({ key: "ArrowLeft" });
    calls.length = 0;
    app.frame(300);
    expect(textsOf(calls).some((s) => /^ORDER \d+\.\d {2}RUDDER LEFT {2}PLANES LEVEL$/.test(s))).toBe(true);
    expect(calls.some(([n, a]) => n === "rect" && a[0] === 0 && a[1] === 0 && a[2] === 320 && a[3] === 11)).toBe(true); // the black bar of the toast
    app.showControlHud = false;
    app.keydown({ key: "ArrowRight" });
    calls.length = 0;
    app.frame(320);
    expect(textsOf(calls).some((s) => /^ORDER /.test(s))).toBe(true); // an earlier line is still fading; no new one is made
    app.frame(300 + 2000);
    calls.length = 0;
    app.keydown({ key: "ArrowLeft" });
    app.frame(2400);
    expect(textsOf(calls).some((s) => /^ORDER /.test(s))).toBe(false);
  });

  it("the flag can be switched on from storage (gato.controlHud = 1) and defaults to off otherwise", () => {
    const store = new Map<string, string>([["gato.controlHud", "1"]]);
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    expect(startPlay(storage).app.showControlHud).toBe(true);
    store.set("gato.controlHud", "0");
    expect(startPlay(storage).app.showControlHud).toBe(false);
    expect(startPlay(null).app.showControlHud).toBe(false);
  });

  it("the time-compression indicator is a different overlay and still shows (see analysis/remake_additions.md)", () => {
    const { app, calls } = startPlay();
    app.keydown({ key: "]" });
    calls.length = 0;
    app.frame(100);
    expect(textsOf(calls)).toContain("TIME x2  (5 STEPS/S)");
  });
});

describe("mission completion keeps the game running (as in GATO1.EXE)", () => {
  type Call = [string, unknown[]];

  function playNight7(): { app: App; calls: Call[]; sim: Simulation } {
    const { ctx } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const app = new App(g, data, null, new SoundEngine(() => ctx), null, () => 0.5);
    app.settings.timeOfDay = 0;
    app.keydown({ key: "x" });
    app.startMission(7, 1);
    app.keydown({ key: "x" });
    app.keydown({ key: "x" });
    const sim = (app as unknown as { sim: Simulation }).sim;
    const island = sim.scenario.islands[14];
    if (!island) throw new Error("missing island");
    sim.teleport(island.x, island.y - island.innerRadius - 80);
    sim.sub.speed = 0;
    sim.sub.orderedSpeed = 0;
    app.frame(0);
    return { app, calls, sim };
  }
  const texts = (calls: Call[]): [number, number, string][] => calls.filter(([n]) => n === "text").map(([, a]) => [a[0] as number, a[1] as number, a[2] as string]);
  /** 60 FPS frames until `done` (at most `limitMs`); returns the time of the last frame. */
  function runUntil(app: App, from: number, limitMs: number, done: () => boolean): number {
    let t = from;
    while (!done() && t < from + limitMs) {
      t += 1000 / 60;
      app.frame(t);
    }
    return t;
  }

  it("shows the boxed CONTACT MADE, then MISSION COMPLETED, over the control room and goes on simulating", () => {
    const { app, calls, sim } = playNight7();
    let t = runUntil(app, 0, 5000, () => sim.missionComplete);
    expect(sim.missionComplete).toBe(true);
    expect(sim.completedBy).toBe("island");
    expect(sim.status).toBe("running");
    t = runUntil(app, t, 100, () => false); // the frame after the event
    const box = calls.filter(([n, a]) => n === "rect" && a[0] === 10 && a[1] === 10);
    expect(box.at(-1)?.[1]).toEqual([10, 10, 300, 51, "#000000"]); // the original's black BF box (10,10)-(309,60)
    expect(texts(calls)).toContainEqual([14, 3, "CONTACT MADE"]);
    expect(texts(calls).some(([, , s]) => s === "MISSION COMPLETED")).toBe(false);
    // the second line is printed into the same box once the first has been held
    t = runUntil(app, t, 20_000, () => app.radio.current?.message.id === "missionCompleted");
    calls.length = 0;
    app.frame(t + 17);
    expect(texts(calls)).toEqual(expect.arrayContaining([[14, 3, "CONTACT MADE"], [12, 4, "MISSION COMPLETED"]]));
    expect(app.radio.history).toEqual(["contactMade", "missionCompleted"]);
    // no game-over box and no play-again prompt; the box waits for a key and says so on its last text row (row 7 of the box ending at y = 60)
    expect(texts(calls).some(([, , s]) => /PLAY AGAIN|HAS BEEN LOST/.test(s))).toBe(false);
    expect(calls.some(([n, a]) => n === "centered" && a[0] === 7 && a[1] === "PRESS ANY KEY")).toBe(true);
    // the world keeps stepping while the box is up; no timer removes it, the objective is not announced again, the log counts it once
    const tick = sim.tick;
    t = runUntil(app, t, 8000, () => false);
    expect(sim.tick).toBeGreaterThan(tick + 15);
    expect(app.radio.current?.message.id).toBe("missionCompleted");
    expect(app.radio.history).toEqual(["contactMade", "missionCompleted"]);
    expect(app.log.missionsCompleted).toBe(1);
    expect(sim.status).toBe("running");
    // a key closes the box and does nothing else
    app.keydown({ key: "t" });
    expect(app.radio.current).toBeNull();
    expect(sim.sub.doorsOpen).toBe(false);
    calls.length = 0;
    app.frame(t + 50);
    expect(calls.some(([n, a]) => n === "rect" && a[0] === 10 && a[1] === 10)).toBe(false);
    expect(texts(calls).some(([, , s]) => s === "CONTACT MADE")).toBe(false);
    app.keydown({ key: "t" });
    expect(sim.sub.doorsOpen).toBe(true);
  });

  it("the boat still takes orders after the message is closed (the island shoals keep it where it is), and Escape leaves for the launcher", () => {
    const { app, sim } = playNight7();
    let t = runUntil(app, 0, 5000, () => sim.missionComplete);
    t = runUntil(app, t, 20_000, () => app.radio.current?.message.id === "missionCompleted");
    app.keydown({ key: "q" }); // closes the message box
    expect(app.radio.current).toBeNull();
    const tick = sim.tick;
    app.keydown({ key: "F3" });
    app.keydown({ key: "ArrowLeft" });
    expect(sim.sub.orderedSpeed).toBeGreaterThan(0);
    expect(sim.sub.rudder).toBeGreaterThan(0);
    runUntil(app, t, 4000, () => false);
    expect(sim.tick).toBeGreaterThan(tick + 8);
    expect(sim.status).toBe("running");
    app.keydown({ key: "Escape" });
    expect(app.mode).toBe("menu");
    expect(app.log.missionsCompleted).toBe(1);
  });
});

describe("advanced options (remake additions that can go back to the 1984 behaviour)", () => {
  type Call = [string, unknown[]];
  type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void };
  const memory = (): { storage: Store; map: Map<string, string> } => {
    const map = new Map<string, string>();
    return { map, storage: { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) } };
  };
  const canvasFactory = () => () => ({ getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined }) }) as unknown as HTMLCanvasElement;
  const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);
  const press = (app: App, ...keys: string[]) => keys.forEach((key) => app.keydown({ key }));
  const textsOf = (calls: Call[]): string[] => calls.filter(([n]) => n === "text" || n === "centered").map(([n, a]) => String(a[n === "text" ? 2 : 1]));

  interface Harness {
    app: App;
    calls: Call[];
    data: AppData;
    effects: string[];
    storage: Store;
    map: Map<string, string>;
    sim: () => Simulation;
  }

  function boot(opts: { map?: Map<string, string>; art?: TitleArt | null } = {}): Harness {
    const { ctx } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const layouts = new CockpitLayouts(parseCockpitLayouts(read("public/assets/cockpit_layouts.json")), canvasFactory());
    const { storage, map } = memory();
    for (const [k, v] of opts.map ?? []) map.set(k, v);
    const app = new App(g, data, null, new SoundEngine(() => ctx), storage, () => 0.5, opts.art ?? null, layouts);
    const effects: string[] = [];
    app.sound.effect = ((name: string) => void effects.push(name)) as unknown as typeof app.sound.effect;
    return { app, calls, data, effects, storage, map, sim: () => (app as unknown as { sim: Simulation }).sim };
  }

  /** In the control room of mission 1 (two keys get past the Morse orders). */
  function play(opts: { map?: Map<string, string> } = {}): Harness {
    const h = boot(opts);
    press(h.app, "x");
    h.app.startMission(1, 1);
    press(h.app, "x", "x");
    h.app.frame(0);
    return h;
  }

  const frameAfter = (h: Harness, t: number): Call[] => {
    h.calls.length = 0;
    h.app.frame(t);
    return h.calls.slice();
  };

  it("offers the 18 requested rows plus CUSTOM CONTROLS, grouped by topic with the hotkeys switch right before the three it covers; everything is on by default except the helm line and the custom controls", () => {
    expect(ADVANCED_FEATURES.map((f) => f.row)).toEqual([1, 16, 3, 9, 10, 6, 8, 30, 11, 12, 15, 2, 17, 20, 28, 32, 24, 25, 38]);
    const keys = ADVANCED_FEATURES.map((f) => f.key);
    const at = keys.indexOf("hotkeys");
    expect(keys.slice(at + 1, at + 1 + HOTKEY_GROUP.length)).toEqual([...HOTKEY_GROUP]);
    expect(ADVANCED_FEATURES.every((f) => f.label.length <= 30)).toBe(true);
    const { app } = boot();
    for (const f of ADVANCED_FEATURES) expect(app.advanced.on(f.key), f.key).toBe(f.key !== "helmHud" && f.key !== "customControls");
  });

  it("indented switches: the hotkey members, the next-mission pick and the time pop-up sit under the switch they depend on", () => {
    const keys = ADVANCED_FEATURES.map((f) => f.key);
    for (const [child, parent] of [["missionSelect", "gameControlExtras"], ["timeToast", "timeKeys"]] as const) {
      expect(keys.indexOf(child), child).toBe(keys.indexOf(parent) + 1);
      expect(ADVANCED_INDENTED.has(child)).toBe(true);
    }
    expect([...ADVANCED_INDENTED].sort()).toEqual([...HOTKEY_GROUP, "missionSelect", "timeToast"].sort());
    const h = boot();
    press(h.app, "x", "5");
    const placed = (label: string): number => {
      const call = frameAfter(h, 10).find(([n, a]) => n === "text" && a[2] === label);
      return Number(call?.[1][0]);
    };
    expect(placed("HELM STATUS LINE")).toBe(3);
    expect(placed("CHOOSE THE NEXT MISSION")).toBe(5);
    expect(placed("CONTROLS HELP OVERLAY")).toBe(5);
    expect(placed("GAME CONTROL ITEMS 5 AND 6")).toBe(3);
    // independent: the child keeps its own value when the parent changes
    h.app.advanced.set("gameControlExtras", false);
    expect(h.app.advanced.on("missionSelect")).toBe(true);
    h.app.advanced.set("timeKeys", false);
    expect(h.app.advanced.on("timeToast")).toBe(true);
  });

  it("the hint under the list names the state a switch is not in: OFF text while on, ON text while off, always within three lines", () => {
    const h = boot();
    press(h.app, "x", "5");
    for (const f of ADVANCED_FEATURES) {
      for (const on of [true, false]) {
        h.app.advanced.set(f.key, on);
        const hint = (h.app as unknown as { advancedHint(): string }).advancedHint();
        expect(hint, f.key).toBe(on ? `OFF: ${f.original}` : `ON: ${f.remake}`);
        expect(wrapText(hint.toUpperCase()).length, f.key).toBeLessThanOrEqual(3);
      }
      h.app.advanced.set(f.key, f.default);
      press(h.app, "ArrowDown");
    }
  });

  it("menu item 5 opens the screen; Up/Down/Enter switch a row, which is remembered; Esc returns to the menu", () => {
    const h = boot();
    press(h.app, "x");
    expect(textsOf(frameAfter(h, 10))).toContain("[5]   ADVANCED OPTIONS");
    press(h.app, "5");
    expect(h.app.mode).toBe("settings");
    const drawn = textsOf(frameAfter(h, 20));
    expect(drawn).toContain("HELM STATUS LINE");
    expect(drawn).toContain("ADVANCED OPTIONS");
    press(h.app, "ArrowDown", "Enter"); // the hotkeys group switch, next to the three switches it covers
    expect(h.app.advanced.on("hotkeys")).toBe(false);
    expect(h.app.advanced.on("helpOverlay")).toBe(false);
    expect(JSON.parse(h.map.get("gato.advanced") ?? "{}").hotkeys).toBe(false);
    press(h.app, "ArrowUp", "ArrowUp", "ArrowUp", " "); // wraps past CUSTOM CONTROLS to the radio alert tone
    expect(h.app.advanced.on("radioAlert")).toBe(false);
    expect(boot({ map: h.map }).app.advanced.on("hotkeys")).toBe(false); // a new page load reads it back
    press(h.app, "r");
    expect(h.app.advanced.snapshot()).toEqual(boot().app.advanced.snapshot());
    press(h.app, "Escape");
    expect(h.app.mode).toBe("menu");
    press(h.app, "5");
    expect(h.app.mode).toBe("settings"); // the launcher is usable again after coming back
    press(h.app, "Escape", "1");
    expect(h.app.mode).toBe("orders");
  });

  it("the switches are on two pages: the page follows the selected row, Left/Right/PageUp/PageDown change page", () => {
    const h = boot();
    press(h.app, "x", "5");
    const cursor = (): number => (h.app as unknown as { advancedCursor: number }).advancedCursor;
    let shown = textsOf(frameAfter(h, 10));
    expect(shown).toContain("PAGE 1 OF 2");
    expect(shown).toContain("HELM STATUS LINE");
    expect(shown).not.toContain("CUSTOM CONTROLS");
    expect(shown).toContain("LEFT/RIGHT=PAGE  R=RESET  ESC=BACK");
    press(h.app, "ArrowRight");
    expect(cursor()).toBe(ADVANCED_PAGE_SIZE);
    shown = textsOf(frameAfter(h, 20));
    expect(shown).toContain("PAGE 2 OF 2");
    expect(shown).toContain("CUSTOM CONTROLS");
    expect(shown).not.toContain("HELM STATUS LINE");
    press(h.app, "PageDown"); // wraps round to page 1
    expect(cursor()).toBe(0);
    press(h.app, "ArrowLeft");
    expect(cursor()).toBe(ADVANCED_PAGE_SIZE);
    press(h.app, "PageUp");
    expect(cursor()).toBe(0);
    for (let i = 0; i < ADVANCED_PAGE_SIZE; i += 1) press(h.app, "ArrowDown"); // Up/Down run on from page 1 to page 2
    expect(textsOf(frameAfter(h, 30))).toContain("PAGE 2 OF 2");
    press(h.app, "ArrowRight", "Enter"); // the first switch of page 1 again
    expect(h.app.advanced.on("helmHud")).toBe(true);
    expect(ADVANCED_FEATURES.length).toBeGreaterThan(ADVANCED_PAGE_SIZE);
    expect(ADVANCED_FEATURES.length).toBeLessThanOrEqual(2 * ADVANCED_PAGE_SIZE);
  });

  it("a damaged or unknown stored value falls back to the defaults", () => {
    expect(boot({ map: new Map([["gato.advanced", "{oops"]]) }).app.advanced.on("helpOverlay")).toBe(true);
    expect(boot({ map: new Map([["gato.advanced", '{"helpOverlay":"no","nothing":false}']]) }).app.advanced.on("helpOverlay")).toBe(true);
  });

  it("calls the page hook when a switch changes (display modes follow it)", () => {
    const h = boot();
    let calls = 0;
    h.app.onAdvancedChange = () => (calls += 1);
    h.app.advanced.toggle("displayModes");
    h.app.advanced.set("displayModes", false); // no change, no call
    expect(calls).toBe(1);
  });

  it("helm line (1) and time pop-up (2): the line follows its switch, the pop-up goes away when off", () => {
    const h = play();
    press(h.app, "F3");
    expect(textsOf(frameAfter(h, 20)).some((s) => /^ORDER /.test(s))).toBe(false);
    h.app.advanced.set("helmHud", true);
    press(h.app, "F5");
    expect(textsOf(frameAfter(h, 40)).some((s) => /^ORDER /.test(s))).toBe(true);
    h.app.advanced.set("timeToast", false);
    press(h.app, "]");
    expect(h.app.timeScale).toBe(2);
    expect(textsOf(frameAfter(h, 60)).some((s) => /^TIME x/.test(s))).toBe(false);
  });

  it("help overlay (3), wake-trail toggle (10) and the hotkey group (16)", () => {
    const h = play();
    h.app.advanced.set("helpOverlay", false);
    press(h.app, "?");
    expect(h.app.helpVisible).toBe(false);
    h.app.advanced.set("helpOverlay", true);
    press(h.app, "h");
    expect(h.app.helpVisible).toBe(true);
    press(h.app, "x");
    h.app.advanced.set("trailToggle", false);
    press(h.app, "w");
    expect(h.app.trails).toBe(true); // always persistent
    h.app.advanced.set("trailToggle", true);
    press(h.app, "w");
    expect(h.app.trails).toBe(false);
    press(h.app, "w");
    h.app.advanced.set("hotkeys", false);
    press(h.app, "w", "?");
    expect(h.app.trails).toBe(true);
    expect(h.app.helpVisible).toBe(false);
  });

  it("row 16 is a group switch: it sets rows 3, 9 and 10, and follows them", () => {
    const h = boot();
    const a = h.app.advanced;
    let changes = 0;
    h.app.onAdvancedChange = () => (changes += 1);
    a.set("hotkeys", false);
    expect([a.on("helpOverlay"), a.on("displayModes"), a.on("trailToggle"), a.on("hotkeys")]).toEqual([false, false, false, false]);
    expect(changes).toBe(1);
    a.set("hotkeys", true);
    expect([a.on("helpOverlay"), a.on("displayModes"), a.on("trailToggle"), a.on("hotkeys")]).toEqual([true, true, true, true]);
    a.set("helpOverlay", false); // one of three off: the group stays on
    expect(a.on("hotkeys")).toBe(true);
    a.set("displayModes", false);
    expect(a.on("hotkeys")).toBe(true);
    a.set("trailToggle", false); // all three off: the group turns off
    expect(a.on("hotkeys")).toBe(false);
    a.set("displayModes", true); // any one back on: the group is on again
    expect(a.on("hotkeys")).toBe(true);
    expect(a.toggle("hotkeys")).toBe(false);
    expect(a.on("displayModes")).toBe(false);
    // stored values are brought in line when read
    const stored = JSON.stringify({ ...a.snapshot(), hotkeys: true });
    expect(boot({ map: new Map([["gato.advanced", stored]]) }).app.advanced.on("hotkeys")).toBe(false);
  });

  it("time keys (15) and Esc (17)", () => {
    const h = play();
    h.app.advanced.set("timeKeys", false);
    press(h.app, "]", "[");
    expect(h.app.timeScale).toBe(1);
    h.app.advanced.set("escQuit", false);
    press(h.app, "Escape");
    expect(h.app.mode).toBe("play");
    h.app.advanced.set("escQuit", true);
    press(h.app, "Escape");
    expect(h.app.mode).toBe("menu");
  });

  it("1984 PC pace (28): off means 10 steps a second at 1x, and it applies to the running mission", () => {
    const h = play();
    const runner = (h.app as unknown as { runner: FixedTimestepRunner }).runner;
    expect(runner.hz).toBe(2.5);
    h.app.advanced.set("pcPace", false);
    expect(h.app.stepRate).toBe(10);
    expect(runner.hz).toBe(10);
    press(h.app, "]");
    expect(h.app.stepRate).toBe(20);
    h.app.advanced.set("pcPace", true);
    expect(runner.hz).toBe(5);
  });

  it("mission select (30) and GAME CONTROL items 5 and 6 (8)", () => {
    const h = play();
    press(h.app, "Tab");
    const shown = textsOf(frameAfter(h, 30));
    expect(shown).toContain("[5] NEXT MISSION");
    expect(shown).toContain("[6] TIME COMPRESSION");
    press(h.app, "6");
    expect(h.app.timeScale).toBe(2);
    h.app.settings.mission = 5;
    h.app.advanced.set("missionSelect", false);
    expect(textsOf(frameAfter(h, 50))).not.toContain("[5] NEXT MISSION");
    press(h.app, "5", "9", "Enter"); // item 5 does nothing, so "9" and Enter are ordinary keys here
    h.app.startMission(); // random pick: with the 0.5 test generator scenario 11
    expect((h.app as unknown as { currentOrders: unknown }).currentOrders).toBe(h.data.orders[11]);
    h.app.advanced.set("missionSelect", true);
    h.app.startMission();
    expect((h.app as unknown as { currentOrders: unknown }).currentOrders).toBe(h.data.orders[5]);
    h.app.advanced.set("gameControlExtras", false);
    press(h.app, "x", "x", "Tab");
    const scale = h.app.timeScale;
    expect(textsOf(frameAfter(h, 80))).not.toContain("[6] TIME COMPRESSION");
    press(h.app, "6");
    expect(h.app.timeScale).toBe(scale);
  });

  it("lost-boat box (11): off gives the cleared screen with the play-again question alone", () => {
    const h = play();
    (h.sim() as unknown as { status: string }).status = "destroyed";
    const framed = frameAfter(h, 20);
    expect(textsOf(framed)).toContain("YOUR SUBMARINE HAS BEEN LOST");
    h.app.advanced.set("endBox", false);
    const plain = frameAfter(h, 40);
    expect(textsOf(plain)).not.toContain("YOUR SUBMARINE HAS BEEN LOST");
    expect(plain.filter(([n]) => n === "clear").length).toBeGreaterThan(0);
    expect(plain.some(([n, a]) => n === "text" && a[0] === 2 && a[1] === 4 && a[2] === "DO YOU WANT DO PLAY AGAIN? (Y/N)")).toBe(true);
  });

  it("M (20): off asks for a new mission instead of re-reading the orders", () => {
    const h = play();
    const before = h.sim();
    press(h.app, "m");
    expect(h.sim()).toBe(before); // re-read: same world
    press(h.app, "x", "x");
    h.app.advanced.set("radioReread", false);
    press(h.app, "m");
    expect(h.sim()).not.toBe(before);
    expect(h.app.mode).toBe("orders");
  });

  it("explosion boom (24) and radio alert tone (25) are silent when off", () => {
    const h = play();
    const events = (): never[] => [{ type: "collision" }, { type: "radio", message: RADIO_MESSAGES.contactMade }] as never[];
    const handle = (app: App): void => (app as unknown as { handleEvents(e: never[]): void }).handleEvents(events());
    handle(h.app);
    expect(h.effects).toEqual(expect.arrayContaining(["explosion", "radioAlert"]));
    h.effects.length = 0;
    h.app.advanced.set("boomSound", false);
    h.app.advanced.set("radioAlert", false);
    handle(h.app);
    expect(h.effects).not.toContain("explosion");
    expect(h.effects).not.toContain("radioAlert");
  });

  it("world during explosions (32): off holds the world while a blast plays", () => {
    const blast = { advance: () => undefined, finished: true };
    const advanceBy = (h: Harness): number => {
      const sim = h.sim();
      const tick = sim.tick;
      (sim.explosions as unknown[]).push(blast);
      h.app.frame(5000);
      h.app.frame(6000);
      return sim.tick - tick;
    };
    expect(advanceBy(play())).toBeGreaterThan(0);
    const off = play();
    off.app.advanced.set("explosionsRun", false);
    expect(advanceBy(off)).toBe(0);
  });

  it("logo skip (6): off keeps the logo for its time and ignores keys and clicks", () => {
    const raw = read<Record<string, any>>("public/assets/title_screen.json");
    const art = new TitleArt(parseTitleArt(raw), canvasFactory());
    const h = boot({ art });
    h.app.advanced.set("splashSkip", false);
    h.app.frame(0);
    press(h.app, "x");
    h.app.tap();
    expect(h.app.mode).toBe("splash");
    h.app.frame(SPLASH_MS);
    expect(h.app.mode).toBe("title");
    const on = boot({ art });
    on.app.frame(0);
    on.app.tap();
    expect(on.app.mode).toBe("title");
  });

  it("demo intro skip (12): off leaves only F1 and F2 at the intro; the Morse example still ends on any key", () => {
    const stage = (h: Harness): string => (h.app as unknown as { demo: { player: { stage: string } } }).demo.player.stage;
    const h = boot();
    h.app.advanced.set("demoSkip", false);
    press(h.app, "x", "2");
    h.app.frame(10);
    press(h.app, "x");
    expect(stage(h)).toBe("intro");
    press(h.app, "F2");
    expect(stage(h)).toBe("intro");
    const on = boot();
    press(on.app, "x", "2", "x");
    expect(stage(on)).toBe("morse");
    press(on.app, "x");
    expect(stage(on)).toBe("pages");
    press(h.app, "F1");
    expect(h.app.mode).toBe("menu");
  });
});

describe("custom controls (key assignments)", () => {
  type Call = [string, unknown[]];
  const press = (app: App, ...keys: string[]) => keys.forEach((key) => app.keydown({ key }));
  const num = (f: string) => Number(/(\d+)\.json$/.exec(f)?.[1]);

  function boot(map: Map<string, string> = new Map()): { app: App; calls: Call[]; map: Map<string, string>; sim: () => Simulation } {
    const { ctx } = fakeAudio();
    const calls: Call[] = [];
    const g = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => calls.push([name, args]) }) as unknown as Gfx;
    const courses: AppData["courses"] = {};
    const orders: AppData["orders"] = {};
    for (const f of readdirSync(new URL("src/data/scenarios/courses/", root))) courses[num(f)] = read(`src/data/scenarios/courses/${f}`);
    for (const f of readdirSync(new URL("src/data/scenarios/orders/", root))) if (f.startsWith("ORDXX")) orders[num(f)] = read(`src/data/scenarios/orders/${f}`);
    const data: AppData = { courses, orders, mxp, shipLog, demo: read<DemoScriptDocument>("src/data/demo_script.json"), history: read<HistoryPagesDocument>("src/data/history_pages.json"), morse: audio.morse };
    const storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
    const app = new App(g, data, null, new SoundEngine(() => ctx), storage, () => 0.5);
    return { app, calls, map, sim: () => (app as unknown as { sim: Simulation }).sim };
  }
  const startPlay = (h: ReturnType<typeof boot>): void => {
    press(h.app, "x");
    h.app.startMission(1, 1);
    press(h.app, "x", "x");
    h.app.frame(0);
  };
  const openEditor = (app: App): void => {
    press(app, "x", "5");
    app.advanced.set("customControls", true);
    press(app, "c");
  };
  const select = (app: App, id: ControlId): void => {
    (app as unknown as { controlsCursor: number }).controlsCursor = CONTROL_DEFS.findIndex((d) => d.id === id);
  };
  const texts = (h: ReturnType<typeof boot>): string[] => {
    h.calls.length = 0;
    h.app.frame(10);
    return h.calls.filter(([n]) => n === "text" || n === "centered").map(([n, a]) => String(a[n === "text" ? 2 : 1]));
  };

  it("the default assignments are the original's keys, in either letter case, and the keypad 5", () => {
    for (const d of CONTROL_DEFS) {
      if (!d.input) continue;
      expect(translatePlayKey({ key: d.key }), d.id).toEqual(d.input);
      if (d.key.length === 1) expect(translatePlayKey({ key: d.key.toLowerCase() }), d.id).toEqual(d.input);
    }
    expect(translatePlayKey({ key: "Unidentified", code: "Numpad5" })).toEqual({ type: "sim", command: { type: "neutral" } });
    expect(translatePlayKey({ key: "t", ctrlKey: true })).toBeNull();
    expect(new Keymap().isDefault).toBe(true);
  });

  it("assigning checks for conflicts: refused until overridden, and the override blanks the other action", () => {
    let changes = 0;
    const map = new Keymap(() => (changes += 1));
    expect(map.conflict("doors", "c")).toBe("chart");
    expect(map.assign("doors", "c")).toEqual({ ok: false, conflict: "chart" });
    expect(map.get("doors")).toBe("T");
    expect(changes).toBe(0);
    expect(map.assign("doors", "g")).toEqual({ ok: true });
    expect(map.get("doors")).toBe("G");
    expect(map.idFor("t")).toBeUndefined();
    expect(map.assign("fire", "g", true)).toEqual({ ok: true });
    expect(map.get("fire")).toBe("G");
    expect(map.get("doors")).toBe(""); // the other assignment is left blank
    expect(translatePlayKey({ key: "g" }, map)).toEqual({ type: "sim", command: { type: "fire" } });
    expect(translatePlayKey({ key: "F8" }, map)).toBeNull();
    map.clear("fire");
    expect(map.get("fire")).toBe("");
    map.reset();
    expect(map.isDefault).toBe(true);
  });

  it("Tab and Escape are fixed: their actions cannot change and no other action can take them", () => {
    const map = new Keymap();
    expect(map.assign("gameControl", "G")).toEqual({ ok: false, locked: true });
    expect(map.assign("quit", "G")).toEqual({ ok: false, locked: true });
    expect(map.assign("doors", "Tab", true)).toEqual({ ok: false, locked: true });
    expect(map.assign("doors", "Escape", true)).toEqual({ ok: false, locked: true });
    map.clear("quit");
    expect([map.get("gameControl"), map.get("quit"), map.get("doors")]).toEqual(["Tab", "Escape", "T"]);
    expect(isLocked("quit") && isLocked("gameControl") && !isLocked("doors")).toBe(true);
    const stored = JSON.stringify({ ...map.snapshot(), gameControl: "G", quit: "", doors: "Escape" });
    const loaded = new Keymap(undefined, stored);
    expect([loaded.get("gameControl"), loaded.get("quit"), loaded.get("doors")]).toEqual(["Tab", "Escape", "T"]);
  });

  it("stored assignments are cleaned up when read: unknown or damaged values are ignored and   a key used twice stays with the first action in the list", () => {
    expect(new Keymap(undefined, "{oops").isDefault).toBe(true);
    const map = new Keymap(undefined, JSON.stringify({ doors: "G", fire: "g", chart: 5, bogus: "X", radar: "" }));
      expect([map.get("doors"), map.get("fire"), map.get("chart"), map.get("radar")]).toEqual(["G", "", "C", ""]);
    expect(new Keymap(undefined, map.serialize()).snapshot()).toEqual(map.snapshot());
  });

  it("the assignment list is in sections like the help pages, each with a title line as it scrolls", () => {
    expect(CONTROL_GROUPS.map((g) => g.title)).toEqual(["SPEED AND ENGINES", "STEERING", "SCOPE AND WEAPONS", "SCREENS", "REMAKE EXTRAS"]);
    expect(CONTROL_GROUPS.flatMap((g) => g.ids).sort()).toEqual(CONTROL_DEFS.map((d) => d.id).sort());
    expect(new Set(CONTROL_DEFS.map((d) => d.id)).size).toBe(CONTROL_DEFS.length);
    const h = boot();
    openEditor(h.app);
    select(h.app, "speedFlank");
    let shown = texts(h);
    expect(shown).toContain("-- SPEED AND ENGINES --");
    expect(shown).not.toContain("-- SCREENS --");
    const rowOf = (s: string): number => Number(h.calls.find(([n, a]) => n === "text" && a[2] === s)?.[1][1]);
    expect(rowOf("ELECTRIC MOTOR") - rowOf("DIESEL ENGINE")).toBe(1);
    expect(rowOf("-- STEERING --") - rowOf("ELECTRIC MOTOR")).toBe(2); // a blank line between sections
    expect(rowOf("RUDDER LEFT") - rowOf("-- STEERING --")).toBe(1);
    select(h.app, "rudderLeft");
    shown = texts(h);
    expect(shown).toEqual(expect.arrayContaining(["-- STEERING --", "-- SCOPE AND WEAPONS --"]));
    expect(shown).not.toContain("-- SPEED AND ENGINES --"); // scrolled off
    select(h.app, "quit");
    shown = texts(h);
    expect(shown).toEqual(expect.arrayContaining(["-- REMAKE EXTRAS --", "BACK TO THE MENU", "(FIXED)"]));
    expect(shown).not.toContain("-- SPEED AND ENGINES --");
    expect(shown).toContain(`${CONTROL_DEFS.length}/${CONTROL_DEFS.length}`); // the counter counts actions, not title lines
  });

  it("custom controls are off by default; the C key opens the assignment screen only while they are on, Esc goes back", () => {
    const h = boot();
    expect(h.app.advanced.on("customControls")).toBe(false);
    press(h.app, "x", "5", "c");
    expect(h.app.mode).toBe("settings");
    h.app.advanced.set("customControls", true);
    expect(texts(h)).toContain("UP/DOWN=SELECT ENTER=CHANGE C=CONTROLS");
    press(h.app, "c");
    expect(h.app.mode).toBe("controls");
    const shown = texts(h);
    expect(shown).toContain("CONTROL ASSIGNMENTS");
    expect(shown).toContain("AHEAD FLANK (10)");
    expect(shown).toContain("F1");
    press(h.app, "Escape");
    expect(h.app.mode).toBe("settings");
  });

  it("the game uses the original keys until custom controls are switched on, then the player's own", () => {
    const h = boot();
    h.app.controls.assign("doors", "G"); // set up but not in force
    startPlay(h);
    press(h.app, "g");
    expect(h.sim().sub.doorsOpen).toBe(false);
    press(h.app, "t");
    expect(h.sim().sub.doorsOpen).toBe(true);
    press(h.app, "t");
    h.app.advanced.set("customControls", true);
    press(h.app, "t");
    expect(h.sim().sub.doorsOpen).toBe(false);
    press(h.app, "g");
    expect(h.sim().sub.doorsOpen).toBe(true);
  });

  it("the editor: Enter then a key assigns it; a taken key warns, Esc cancels, Enter overrides and blanks the other", () => {
    const h = boot();
    openEditor(h.app);
    select(h.app, "doors");
    press(h.app, "Enter");
    expect(texts(h)).toEqual(expect.arrayContaining(["PRESS THE NEW KEY FOR", "TORPEDO DOORS"]));
    press(h.app, "c"); // the chart's key
    let shown = texts(h);
    expect(shown.join(" ")).toContain("C IS ALREADY USED FOR");
    expect(shown).toContain("ENTER=OVERRIDE (CLEARS IT) ESC=CANCEL");
    expect(h.app.controls.get("doors")).toBe("T");
    press(h.app, "Escape");
    expect(h.app.controls.get("doors")).toBe("T");
    expect(h.app.controls.get("chart")).toBe("C");
    expect(texts(h)).toContain("NOT CHANGED");
    press(h.app, "Enter", "c", "Enter");
    expect(h.app.controls.get("doors")).toBe("C");
    expect(h.app.controls.get("chart")).toBe("");
    shown = texts(h);
    expect(shown).toContain("(NONE)");
    expect(JSON.parse(h.map.get("gato.controls") ?? "{}")).toMatchObject({ doors: "C", chart: "" });
    press(h.app, "ArrowDown", "Delete"); // the action under the cursor loses its key
    expect(h.app.controls.get(CONTROL_DEFS[(CONTROL_DEFS.findIndex((d) => d.id === "doors") + 1) % CONTROL_DEFS.length]?.id as ControlId)).toBe("");
    press(h.app, "r");
    expect(h.app.controls.isDefault).toBe(true);
    expect(boot(h.map).app.controls.isDefault).toBe(true);
  });

  it("the editor lists Tab and Escape as fixed and refuses to change them or to assign them", () => {
    const h = boot();
    openEditor(h.app);
    select(h.app, "gameControl");
    expect(texts(h)).toContain("FIXED: CANNOT BE CHANGED OR TAKEN OVER");
    expect(texts(h)).toContain("(FIXED)");
    press(h.app, "Enter");
    expect(texts(h).join(" ")).toContain("CANNOT BE CHANGED");
    press(h.app, "Delete");
    expect(h.app.controls.get("gameControl")).toBe("Tab");
    select(h.app, "quit");
    press(h.app, "Enter", " ");
    expect(h.app.controls.get("quit")).toBe("Escape");
    select(h.app, "doors");
    press(h.app, "Enter", "Tab");
    expect(texts(h).join(" ")).toContain("TAB IS FIXED AND CANNOT BE ASSIGNED");
    expect(h.app.controls.get("doors")).toBe("T");
    press(h.app, "Enter", "Escape"); // Esc cancels the capture instead of assigning
    expect(h.app.controls.get("doors")).toBe("T");
    expect(h.app.mode).toBe("controls");
  });

  it("modifier keys alone are ignored while waiting for a key, and the display key can be assigned like any other", () => {
    const h = boot();
    openEditor(h.app);
    select(h.app, "doors");
    press(h.app, "Enter", "Shift", "Control");
    expect(texts(h)).toContain("PRESS THE NEW KEY FOR");
    expect(h.app.isDisplayKey({ key: "v" })).toBe(false); // not on this screen: the key is for assigning
    press(h.app, "v"); // the display mode key is taken: warns like any other conflict
    expect(texts(h).join(" ")).toContain("V IS ALREADY USED FOR DISPLAY MODE");
    press(h.app, "Enter");
    expect(h.app.controls.get("doors")).toBe("V");
    expect(h.app.controls.get("display")).toBe("");
    press(h.app, "Escape", "Escape");
    expect(h.app.isDisplayKey({ key: "v" })).toBe(false); // V now belongs to the doors, so it no longer changes the display mode
  });

  it("the help overlay and the display key follow the assignments in force", () => {
    const h = boot();
    h.app.advanced.set("customControls", true);
    h.app.controls.assign("doors", "G");
    h.app.controls.assign("display", "K");
    startPlay(h);
    expect(h.app.isDisplayKey({ key: "k" })).toBe(true);
    expect(h.app.isDisplayKey({ key: "v" })).toBe(false);
    press(h.app, "?", "ArrowRight", "ArrowRight");
    const page = texts(h);
    expect(page).toEqual(expect.arrayContaining(["CONTROLS - SCOPE AND WEAPONS", "G", "Torpedo doors"]));
    expect(page).not.toContain("T");
    h.app.advanced.set("customControls", false);
    expect(h.app.isDisplayKey({ key: "v" })).toBe(true);
    expect(texts(h)).toContain("T");
  });
});

// __APPEND_MARK__
