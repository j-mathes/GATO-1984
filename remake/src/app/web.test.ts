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
import { Simulation, buildScenario, createRng, type CourseJson, type DemoScriptDocument, type HistoryPagesDocument, type MxpJson, type OrdersJson, type ShipLogDocument } from "../core/index.js";
import { LineEditor, parseCoordinates, shouldPreventDefault, translateGameControlKey, translatePlayKey } from "../input/keyboard.js";
import type { Gfx } from "../render/gfx.js";
import { computeDisplaySize, isDisplayMode, nextDisplayMode } from "../render/display.js";
import { CONTROLS_HELP, TITLE_HOLD_MS, TITLE_WIPE_MS, TITLE_WIPE_ROWS, drawLauncherMenu, drawTitle, titleWipeLines } from "../render/textScreens.js";
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

  it("starts a mission with Morse orders that any key cuts short, then plays", () => {
    const { app, oscs } = makeApp();
    press(app, "x", "1");
    expect(app.mode).toBe("orders");
    expect(oscs.length).toBeGreaterThan(5);
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
    press(app, "x", "1", "x", "Tab");
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
    press(app, "x", "1", "x");
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
    press(app, "x"); // skip the orders
    press(app, "Tab", "3", "Enter"); // TIME OF DAY -> night (0), as the orders ask
    expect(app.settings.timeOfDay).toBe(0);
    const sim = (app as unknown as { sim: Simulation }).sim;
    const island = sim.scenario.islands[14];
    if (!island) throw new Error("missing island");
    const coords = `${island.x},${island.y - island.innerRadius - 80}`.split("");
    press(app, "c", "z", ..."PAED".split(""), "Enter", ...coords, "Enter");
    expect(sim.currentQuadrant).toBe(14);
    app.frame(0);
    for (let t = 250; t <= 1500 && sim.status === "running"; t += 250) app.frame(t);
    expect(sim.status).toBe("missionComplete");
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
    app.keydown({ key: "x" }); // skip the orders
    app.frame(0);
    return { app, sim: (app as unknown as { sim: Simulation }).sim };
  }
  const frames = (app: App, from: number, count: number): void => {
    for (let i = 1; i <= count; i += 1) app.frame(from + i * 250);
  };

  it("M with a damaged radio room shows RADIO ROOM REPORTS HEAVY DAMAGE for its hold time, then returns to the control room", () => {
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
    frames(app, 500, 6); // 1.5 s > the 10000-pass hold (about 1.1 s)
    expect(app.radio.current).toBeNull();
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
    press(app, "x");
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
    press(app, "x");
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
    expect(CONTROLS_HELP.every((l) => l.length <= 38)).toBe(true); // 40 columns minus the margin
    for (const key of ["?", "h"]) {
      const { app, calls, sim } = makeApp();
      press(app, "x");
      app.startMission(1, 1);
      press(app, "x");
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
      expect(text).toEqual(expect.arrayContaining(["CONTROLS              (any key closes)", "TAB          GAME CONTROL"]));
      press(app, "t"); // closes the overlay and is not passed on
      expect(app.helpVisible).toBe(false);
      expect(sim().sub.doorsOpen).toBe(false);
      app.frame(2100);
      calls.length = 0;
      app.frame(2200);
      expect(calls.some(([n, a]) => n === "text" && a[2] === "CONTROLS              (any key closes)")).toBe(false);
      press(app, "t");
      expect(sim().sub.doorsOpen).toBe(true);
    }
  });

  it("the overlay is not opened while typing into a prompt or on GAME CONTROL, and is cleared with the mission", () => {
    const { app } = makeApp();
    press(app, "x");
    app.startMission(1, 1);
    press(app, "x", "c", "z");
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
    press(app, "x", "Tab");
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
    press(app, "x", "Tab", "5", "R", "Enter");
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
    press(h.app, "x");
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

  it("control inputs show on the very next frame, long before the boat answers at the next step", () => {
    const { app, calls, sim } = startPlay();
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

  it("any key ends the orders at once, stops the Morse and enters the control room; the row-25 hint follows the state", () => {
    for (const difficulty of [0, 8]) {
      const { app, calls, oscs } = makeApp(difficulty);
      app.frame(10);
      expect(texts(calls).some(([c, r, s]) => c === 1 && r === 25 && /SKIP|SKIPS/.test(s))).toBe(true);
      app.keydown({ key: "q" });
      expect(app.mode).toBe("play");
      expect(oscs.every((o) => o.stopped)).toBe(true);
      expect(app.screen).toBe("control");
    }
    const { app, calls } = makeApp();
    const p = app as unknown as Priv;
    p.orders.start = p.lastFrame - (p.orders.timeline.duration + 1) * 1000;
    calls.length = 0;
    app.frame(0);
    expect(texts(calls).some(([c, r, s]) => c === 1 && r === 25 && s === "PRESS ANY KEY")).toBe(true);
    expect(app.mode).toBe("orders"); // the remake waits for a key after the last character; the original starts the mission
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
