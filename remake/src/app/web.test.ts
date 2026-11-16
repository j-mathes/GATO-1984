import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { App, type AppData } from "./app.js";
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
import { drawTitle } from "../render/textScreens.js";
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
    expect(sim.tick).toBe(5);
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
});
