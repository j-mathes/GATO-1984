import type { MorseHandle } from "../audio/soundEngine.js";
import type { MorseTables } from "../audio/morse.js";
import { SoundEngine, type EffectName } from "../audio/soundEngine.js";
import {
  DEFAULT_SETTINGS,
  DemoPlayer,
  type DemoEvent,
  type DemoMorseExample,
  GameControl,
  Launcher,
  Simulation,
  WORLD,
  buildScenario,
  createRng,
  pickScenarioId,
  RadioInbox,
  TIME_COMPRESSION,
  isTimeScale,
  simHz as stepsPerSecond,
  type CourseJson,
  type DemoScriptDocument,
  type GameSettings,
  type HistoryPagesDocument,
  type MxpJson,
  type OrdersJson,
  type Scenario,
  type ShipLogDocument,
  type SimEvent,
  type TimeScale,
} from "../core/index.js";
import {
  DEBUG_PASSWORD,
  LineEditor,
  parseCoordinates,
  translateGameControlKey,
  translatePlayKey,
  type InputAction,
  type KeyLike,
  type PlayScreen,
} from "../input/keyboard.js";
import { COLORS, Gfx } from "../render/gfx.js";
import {
  drawCaptainsLog,
  drawChart,
  drawControlRoom,
  drawDamageReport,
  drawEnd,
  drawGameControl,
  drawPrompt,
  drawQuadrantMap,
  drawRadar,
  drawRadioMessage,
  liveContacts,
  type PlayView,
} from "../render/playScreens.js";
import type { SpriteLibrary } from "../render/sprites.js";
import type { TitleArt } from "../render/titleArt.js";
import type { CockpitLayouts, ScreenName } from "../render/cockpitLayouts.js";
import { createTrails } from "../render/trails.js";
import {
  drawChartLayout,
  drawControlRoomLayout,
  drawDamageLayout,
  drawGameControlLayout,
  drawLogLayout,
  drawQuadrantLayout,
  drawRadarLayout,
} from "../render/cockpitScreens.js";
import { cursorBlink, drawDemoIntro, drawDemoNarration, drawHelpOverlay, drawHistory, drawTeletype, drawToast, helmStatus, drawLauncherMenu, drawOrders, drawSplash, drawTitle, hasSplash } from "../render/textScreens.js";
import { HistoryViewer } from "./historyViewer.js";
import { LogStore, type StorageLike } from "./logStore.js";
import { buildOrdersTimeline, revealedLines, type OrdersTimeline } from "./orders.js";
import { ordersScreen } from "./teletype.js";
import { FixedTimestepRunner, takeSnapshot, type Snapshot } from "./runner.js";

export interface AppData {
  courses: Record<number, CourseJson>;
  orders: Record<number, OrdersJson>;
  mxp: MxpJson;
  shipLog: ShipLogDocument;
  demo: DemoScriptDocument;
  history: HistoryPagesDocument;
  morse: MorseTables;
}

export type AppMode = "splash" | "title" | "menu" | "orders" | "play" | "demo" | "history";

/** Simulation steps per second at 1x time compression: the pace of the 1984 PC (see TIME_COMPRESSION). Rendering is independent of it. */
export const TICKS_PER_SECOND = TIME_COMPRESSION.baseHz;
const TRAILS_KEY = "gato.trails";
const TIME_SCALE_KEY = "gato.timeScale";
const CONTROL_HUD_KEY = "gato.controlHud";
const TOAST_MS = 1800;
/** Commands that change the helm: with `showControlHud` on, a status line confirms them on the very next frame (the boat itself answers at the step rate). */
const HELM_COMMANDS: ReadonlySet<string> = new Set(["speed", "rudder", "planes", "neutral", "engine", "doors"]);
/**
 * How long the Spectrum HoloByte logo stays up. GATO.EXE holds it with an empty FOR loop of 2000 passes (limit at ds:0x0bcc), whose real
 * duration depended on the CPU, so the time is a remake choice in the 2.5-3 s range.
 */
export const SPLASH_MS = 2500;

const todayStamp = (): string => {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())}-${d.getFullYear()}`;
};

/**
 * Application shell: routes between the launcher states (title, menu), a mission (orders, play with its screens and GAME CONTROL),
 * the demo and the history viewer. It owns the simulation, the fixed-timestep runner, sound and the captain's log, and turns
 * key presses into core commands. Everything drawable goes through the injected {@link Gfx}.
 */
export class App {
  mode: AppMode = "title";
  private splashStart: number | null = null;
  private titleSince: number | null = null;
  screen: PlayScreen = "control";
  settings: GameSettings = { ...DEFAULT_SETTINGS };
  readonly launcher = new Launcher();
  readonly log: LogStore;

  private sim: Simulation | null = null;
  private runner: FixedTimestepRunner | null = null;
  private snapshot: Snapshot | null = null;
  private menuEntry = "";
  private orders: { lines: string[]; timeline: OrdersTimeline; start: number; handle: MorseHandle | null; done: boolean } | null = null;
  private gameControl = new GameControl(this.settings);
  private difficultyEditor: LineEditor | null = null;
  /** Which GAME CONTROL item `difficultyEditor` is editing: 1 DIFFICULTY LEVEL, 5 NEXT MISSION (remake addition). */
  private editorItem: 1 | 5 = 1;
  private helpOpen = false;
  private prompt: { kind: "password" | "coords"; editor: LineEditor } | null = null;
  private history: HistoryViewer | null = null;
  private demo: { player: DemoPlayer; sim: Simulation; runner: FixedTimestepRunner; page: number; screen: string } | null = null;
  /** The orders example of the demo while it is typed out: its text, Morse timeline and sound. */
  private demoMorse: { start: number; lines: string[]; timeline: OrdersTimeline; handle: MorseHandle | null } | null = null;
  private demoLog: LogStore | null = null;
  private lastFrame = 0;
  private lastPlayMs: number | null = null;
  private currentOrders: OrdersJson | null = null;
  /** Radio/status messages of the original (core/radio.ts), shown over the control room while the mission runs. */
  readonly radio = new RadioInbox();
  private trailsOn = true;
  /**
   * Remake-only status line over the top of the screen after a helm command (`ORDER 8.0  RUDDER MID  PLANES LEVEL`). Off by default: the
   * original keeps the scope picture clean and only lights the indicators of the dashboard. Set it to true (or store "1" under
   * `gato.controlHud`, or `__gato.showControlHud = true` in the console) to bring the line back.
   */
  showControlHud = false;
  private readonly storage: StorageLike | null;
  private readonly trailBuffers = createTrails();
  private lastTrailTick = -1;
  /** Short status line over the top of the screen (helm orders, time compression); drawn every frame until it expires. */
  private toast: { text: string; until: number } | null = null;

  constructor(
    private readonly g: Gfx,
    private readonly data: AppData,
    private readonly sprites: SpriteLibrary | null,
    readonly sound: SoundEngine,
    storage: StorageLike | null = null,
    private readonly random: () => number = Math.random,
    private readonly titleArt: TitleArt | null = null,
    private readonly cockpit: CockpitLayouts | null = null,
  ) {
    this.storage = storage;
    if (hasSplash(titleArt)) this.mode = "splash";
    this.trailsOn = storage?.getItem(TRAILS_KEY) !== "0";
    this.showControlHud = storage?.getItem(CONTROL_HUD_KEY) === "1";
    const savedScale = Number(storage?.getItem(TIME_SCALE_KEY));
    if (isTimeScale(savedScale)) this.settings.timeScale = savedScale;
    this.log = new LogStore(data.shipLog, storage);
    this.gameControl = new GameControl(this.settings, () => this.log.reset());
    this.sound.enabled = this.settings.sound;
  }

  /** Time compression: 1x is the 1984 pace (2.5 simulation steps a second), 2x and 4x fast-forward. Keys [ and ], GAME CONTROL item 6; remembered in storage. */
  get timeScale(): TimeScale {
    return this.settings.timeScale ?? 1;
  }

  /** Simulation steps per second at the current time compression. */
  get stepRate(): number {
    return stepsPerSecond(this.timeScale);
  }

  setTimeScale(scale: TimeScale): void {
    this.settings.timeScale = scale;
    this.applyTimeScale();
    this.showToast(`TIME x${scale}  (${stepsPerSecond(scale)} STEPS/S)`);
  }

  /** Push the current time compression into the running mission and remember it. */
  private applyTimeScale(): void {
    this.runner?.setHz(this.stepRate);
    this.sim?.setTicksPerSecond(this.stepRate);
    try {
      this.storage?.setItem(TIME_SCALE_KEY, String(this.timeScale));
    } catch {
      // storage may be unavailable (private mode)
    }
  }

  private showToast(text: string): void {
    this.toast = { text, until: this.lastFrame + TOAST_MS };
  }

  /** Persistent track dots on the radar, chart and quadrant map (authentic) or clean redraws; key W, remembered in storage. */
  get trails(): boolean {
    return this.trailsOn;
  }

  setTrails(on: boolean): void {
    this.trailsOn = on;
    for (const b of Object.values(this.trailBuffers)) b.clear();
    try {
      this.storage?.setItem(TRAILS_KEY, on ? "1" : "0");
    } catch {
      // storage may be unavailable (private mode)
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------------------------------------------

  /** True while a typed prompt (password, coordinates, difficulty) is open, so global hotkeys must not steal the keys. */
  get textEntryActive(): boolean {
    return this.prompt !== null || this.difficultyEditor !== null;
  }

  keydown(e: KeyLike): void {
    void this.sound.unlock();
    switch (this.mode) {
      case "splash":
        this.mode = "title";
        return;
      case "title":
        this.mode = "menu";
        this.launcher.pressAnyKey();
        return;
      case "menu":
        this.menuKey(e);
        return;
      case "orders":
        this.finishOrders();
        return;
      case "play":
        this.playKey(e);
        return;
      case "demo":
        this.demoKey(e);
        return;
      case "history":
        this.historyKey(e);
        return;
    }
  }

  /** A mouse click or touch: skips the splash and leaves the title page, like a key press; ignored everywhere else. */
  tap(): void {
    if (this.mode === "splash" || this.mode === "title") this.keydown({ key: "Enter" });
  }

  private menuKey(e: KeyLike): void {
    if (e.key === "Enter") {
      this.choose(this.menuEntry === "" ? "1" : this.menuEntry);
    } else if (e.key === "Backspace") this.menuEntry = this.menuEntry.slice(0, -1);
    else if (/^[1-4]$/.test(e.key)) this.choose(e.key);
    else if (e.key.length === 1 && this.menuEntry.length < 3) this.menuEntry += e.key;
  }

  private choose(input: string): void {
    this.menuEntry = "";
    const state = this.launcher.choose(input);
    if (state.screen !== "done") return;
    switch (state.target) {
      case "simulation":
        this.startMission();
        break;
      case "demo":
        this.startDemo();
        break;
      case "history":
        this.history = new HistoryViewer(this.data.history);
        this.mode = "history";
        break;
      case "exit":
        this.mode = "title";
        this.launcher.returnFrom("demo");
        break;
    }
  }

  private historyKey(e: KeyLike): void {
    if (!this.history) return;
    const view = this.history.press(e.key);
    if (view.phase === "done") {
      this.history = null;
      this.returnToMenu("history");
    }
  }

  private demoKey(e: KeyLike): void {
    if (!this.demo) return;
    const events = this.demo.player.pressKey(e.key);
    if (e.key === "F2") {
      this.sound.enabled = false;
      this.demoMorse?.handle?.cancel();
    }
    this.applyDemoEvents(events, this.lastFrame);
  }

  private playKey(e: KeyLike): void {
    const sim = this.sim;
    if (!sim) return;
    if (this.helpOpen) {
      this.closeHelp(); // any key closes the overlay and is not passed on
      return;
    }
    if (this.prompt) {
      this.promptKey(e);
      return;
    }
    if (sim.status !== "running") {
      if (e.key.toUpperCase() === "Y") this.startMission();
      else if (e.key.toUpperCase() === "N" || e.key === "Escape") this.returnToMenu("simulation");
      return;
    }
    if (this.screen === "gameControl") {
      this.gameControlKey(e);
      return;
    }
    const action = translatePlayKey(e);
    if (action) this.perform(action);
  }

  private perform(action: InputAction): void {
    const sim = this.sim;
    if (!sim) return;
    switch (action.type) {
      case "sim": {
        const before = { engine: sim.sub.engine, periscope: sim.sub.periscopeUp, facing: sim.sub.scopeFacing, doors: sim.sub.doorsOpen };
        sim.command(action.command);
        const s = sim.sub;
        if (s.engine !== before.engine) this.play("engineSwitch");
        else if (s.periscopeUp !== before.periscope) this.play("periscope");
        else if (s.scopeFacing !== before.facing) this.play("scopeSwitch");
        else if (s.doorsOpen !== before.doors) this.play("doors");
        if (this.showControlHud && HELM_COMMANDS.has(action.command.type)) this.showToast(helmStatus(s));
        return;
      }
      case "screen":
        this.setScreen(action.screen);
        return;
      case "radioRoom":
        this.radioRoom();
        return;
      case "toggleTrails":
        this.setTrails(!this.trails);
        return;
      case "help":
        this.helpOpen = true;
        return;
      case "timeScale": {
        const scales: readonly TimeScale[] = TIME_COMPRESSION.scales;
        const at = scales.indexOf(this.timeScale);
        const next = scales[Math.min(Math.max(at + (action.direction === "faster" ? 1 : -1), 0), scales.length - 1)] as TimeScale;
        this.setTimeScale(next); // also at the ends, so the indicator confirms the limit
        return;
      }
      case "debugPrompt":
        // Hidden command (0x0b4d4): only on the chart and only while no enemy is alerted (ds:0x21aa = 0).
        if (this.screen === "chart" && sim.sub.alertTimer === 0) this.prompt = { kind: "password", editor: new LineEditor(12) };
        return;
      case "quit":
        this.returnToMenu("simulation");
        return;
    }
  }

  /** Controls quick-reference overlay (key ? or H during a mission); the world is paused while it is shown. */
  get helpVisible(): boolean {
    return this.helpOpen;
  }

  private closeHelp(): void {
    this.helpOpen = false;
    this.runner?.resetClock();
  }

  private setScreen(screen: PlayScreen): void {
    this.screen = screen;
    if (screen === "radar" || screen === "chart" || screen === "quadrant") this.trailBuffers[screen].clear(); // a track screen starts empty
    this.sim?.setInControlRoom(screen === "control");
    if (screen === "gameControl") this.difficultyEditor = null;
    this.runner?.resetClock();
  }

  private gameControlKey(e: KeyLike): void {
    if (this.difficultyEditor) {
      const done = this.difficultyEditor.handle(e);
      if (done === "enter") {
        const text = this.difficultyEditor.value.trim();
        if (this.editorItem === 5) this.gameControl.apply(5, /^\d+$/.test(text) ? Number(text) : 0); // R, 0 or junk = random
        else {
          const n = Number.parseFloat(text);
          if (Number.isFinite(n)) this.gameControl.apply(1, n);
        }
        this.applySettings();
        this.difficultyEditor = null;
      } else if (done === "escape") this.difficultyEditor = null;
      return;
    }
    const action = translateGameControlKey(e);
    if (!action) return;
    if (action.type === "leave") {
      this.setScreen("control");
      return;
    }
    if (action.item === 1 || action.item === 5) {
      this.editorItem = action.item;
      this.difficultyEditor = new LineEditor(3);
    } else {
      this.gameControl.apply(action.item);
      this.applySettings();
    }
  }

  /** GAME CONTROL changes take effect immediately: sound flag, difficulty and time of day of the running mission. */
  private applySettings(): void {
    this.sound.enabled = this.settings.sound;
    if (!this.settings.sound) this.sound.stopAll();
    if (this.sim) {
      this.sim.options.difficulty = this.settings.difficulty;
      this.sim.options.timeOfDay = this.settings.timeOfDay;
      this.sim.options.sound = this.settings.sound;
    }
    this.applyTimeScale();
  }

  private promptKey(e: KeyLike): void {
    const p = this.prompt;
    const sim = this.sim;
    if (!p || !sim) return;
    const done = p.editor.handle(e);
    if (done === "escape") this.prompt = null;
    else if (done === "enter") {
      if (p.kind === "password") {
        this.prompt = p.editor.value.toUpperCase() === DEBUG_PASSWORD ? { kind: "coords", editor: new LineEditor(16) } : null;
      } else {
        const c = parseCoordinates(p.editor.value);
        if (c) sim.teleport(Math.min(Math.max(c.x, 1), WORLD.maxX), Math.min(Math.max(c.y, 1), WORLD.maxY));
        this.prompt = null;
      }
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Mission
  // ---------------------------------------------------------------------------------------------------------------

  /** Pick a random scenario (1..20 like 0x0bb10), build the simulation and show the orders. */
  startMission(scenarioId: number = this.settings.mission ?? pickScenarioId(this.random()), seed: number = Math.floor(this.random() * 2 ** 31)): void {
    const course = this.data.courses[scenarioId];
    const orders = this.data.orders[scenarioId];
    if (!course || !orders) throw new Error(`scenario ${scenarioId} is missing`);
    const scenario: Scenario = buildScenario(scenarioId, course, orders, this.data.mxp);
    const sim = new Simulation({
      scenario,
      rng: createRng(seed),
      options: { ...this.settings, inControlRoom: true },
      shipLog: this.log.document(),
      ticksPerSecond: this.stepRate,
      date: todayStamp(),
    });
    this.sim = sim;
    this.runner = new FixedTimestepRunner(sim, this.stepRate);
    this.snapshot = takeSnapshot(sim);
    this.screen = "control";
    this.prompt = null;
    this.helpOpen = false;
    this.toast = null;
    this.radio.clear();
    this.lastPlayMs = null;
    this.startOrders(orders);
    this.mode = "orders";
  }

  private startOrders(orders: OrdersJson, instant = false): void {
    this.currentOrders = orders;
    // the '@' line carries the classification: the program prints the rest of it, 12 spaces and "DTG dd/hhmm ZULU" as one line (0x0bc0d)
    const lines = orders.raw_lines.map((l, i) => (i === 0 && l.startsWith("@") ? `${l.slice(1)}${" ".repeat(12)}${dtgLine()}` : l));
    const timeline = buildOrdersTimeline(lines, this.data.morse, { difficulty: this.settings.difficulty, soundOn: this.settings.sound });
    const handle = !instant && this.sound.enabled ? this.sound.playMorse(lines, this.data.morse, { soundOn: this.settings.sound }) : null;
    const start = instant ? this.lastFrame - (timeline.duration + 1) * 1000 : this.lastFrame;
    this.orders = { lines, timeline, start, handle, done: false };
  }

  /**
   * Key M (0x0d13c -> radio room routine 0x0ba3d): with a damaged radio room the boat gets the "REPORTS HEAVY DAMAGE" message; otherwise the
   * original asks for a new mission, which the remake replaces by showing the current orders again (text at once; Morse from difficulty 8,
   * where the text is hidden). Either way the control room follows.
   */
  private radioRoom(): void {
    const sim = this.sim;
    if (!sim) return;
    this.setScreen("control");
    if (sim.requestRadioRoom()) return;
    if (this.currentOrders) {
      this.startOrders(this.currentOrders, this.settings.difficulty < 8);
      this.mode = "orders";
    }
  }

  /**
   * Any key while the order is still being typed and sent: stop the Morse and show the whole message (text stays hidden at difficulty 8 and
   * 9); a second key, or any key once the message is complete, goes to the control room. (The original abandons the orders at the first
   * key, 0x0bd86; the two steps are a remake choice so the message can be read.)
   */
  private finishOrders(): void {
    const o = this.orders;
    if (!o) return;
    if (!o.done && (this.lastFrame - o.start) / 1000 < o.timeline.duration) {
      o.handle?.cancel();
      o.handle = null;
      o.done = true;
      return;
    }
    o.handle?.cancel();
    this.orders = null;
    this.mode = "play";
    this.runner?.resetClock();
  }

  private play(effect: EffectName): void {
    this.sound.effect(effect);
  }

  private handleEvents(events: readonly SimEvent[]): void {
    if (events.length === 0) return;
    this.log.apply(events, todayStamp());
    for (const e of events) {
      switch (e.type) {
        case "torpedoLaunched":
          this.play("torpedoLaunch");
          break;
        case "shipSunk":
        case "collision":
        case "periscopeBroken":
          this.play("explosion");
          break;
        case "depthCharge":
          this.play("depthCharge");
          break;
        case "damageAlarm":
          this.play("damageAlarm");
          break;
        case "radio":
          this.radio.push(e.message);
          this.play("radioAlert");
          break;
        case "fuelLow":
          this.play("lowFuel");
          break;
        case "batteryLow":
          this.play("lowBattery");
          break;
        case "engineCutOut":
          this.play("engineCutOut");
          break;
        case "resupplyStarted":
          this.play("resupply");
          break;
        case "resupplyFinished":
          this.play("resupplyDone");
          break;
        case "missionComplete":
          this.play("missionComplete");
          break;
        case "subDestroyed":
          this.play("subDestroyed");
          break;
        default:
          break;
      }
    }
  }

  private returnToMenu(from: "simulation" | "demo" | "history"): void {
    this.sound.stopAll();
    this.sound.enabled = this.settings.sound;
    this.sim = null;
    this.runner = null;
    this.orders = null;
    this.helpOpen = false;
    this.radio.clear();
    this.launcher.returnFrom(from === "simulation" ? "demo" : from);
    this.mode = "menu";
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Demo
  // ---------------------------------------------------------------------------------------------------------------

  /** The demo runs a throw-away simulation behind its narration; DEMO.EXE itself uses canned screens. */
  private startDemo(): void {
    const id = 1;
    const course = this.data.courses[id];
    const orders = this.data.orders[id];
    if (!course || !orders) throw new Error("demo scenario missing");
    const sim = new Simulation({
      scenario: buildScenario(id, course, orders, this.data.mxp),
      rng: createRng(1984),
      options: { difficulty: 0, sound: false, timeOfDay: 1, inControlRoom: true },
      shipLog: this.data.shipLog,
      ticksPerSecond: TICKS_PER_SECOND,
    });
    sim.command({ type: "speed", level: "F5" });
    sim.command({ type: "periscope", direction: "raise" });
    const runner = new FixedTimestepRunner(sim, TICKS_PER_SECOND);
    const player = new DemoPlayer(this.data.demo);
    const events = player.start();
    this.demo = { player, sim, runner, page: 0, screen: "intro" };
    this.demoMorse = null;
    this.lastDemoTime = null;
    this.applyDemoEvents(events, this.lastFrame);
    this.demoLog = new LogStore(this.data.shipLog, null);
    this.demoLog.apply(
      this.data.shipLog.records.slice(0, 3).map((r) => ({ type: "shipSunk" as const, slot: 3, typeCode: 4, record: { slot: 3, typeCode: 4, record: r.record, name: r.name, tonnage: r.tonnage } })),
      "01-01-1984",
    );
    this.mode = "demo";
  }

  private endDemo(): void {
    this.stopDemoMorse();
    this.demo = null;
    this.demoLog = null;
    this.returnToMenu("demo");
  }

  /** Follow the demo player: which screen is up, and start or stop the Morse example. Returns true when the demo has ended. */
  private applyDemoEvents(events: DemoEvent[], timeMs: number): boolean {
    const d = this.demo;
    if (!d) return true;
    for (const ev of events) {
      switch (ev.type) {
        case "intro":
          d.screen = ev.screen;
          break;
        case "morse":
          d.screen = ev.screen;
          this.startDemoMorse(ev.example, timeMs);
          break;
        case "page":
          this.stopDemoMorse();
          d.screen = ev.screen;
          break;
        case "finished":
          this.lastDemoTime = null;
          this.endDemo();
          return true;
      }
    }
    return false;
  }

  /** The orders example (DEMORD): typed out character by character as its Morse is sent, like the orders of a mission. */
  private startDemoMorse(example: DemoMorseExample, timeMs: number): void {
    const d = this.demo;
    if (!d) return;
    this.stopDemoMorse();
    const soundOn = d.player.soundOn;
    const timeline = buildOrdersTimeline(example.lines, this.data.morse, { difficulty: 0, soundOn });
    const handle = this.sound.enabled && soundOn ? this.sound.playMorse(example.lines, this.data.morse, { soundOn }) : null;
    this.demoMorse = { start: timeMs, lines: example.lines, timeline, handle };
    d.player.setMorseSeconds(timeline.duration + (example.end_hold_seconds_estimate ?? 2));
  }

  private stopDemoMorse(): void {
    this.demoMorse?.handle?.cancel();
    this.demoMorse = null;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------------------------------------------------------

  /** Draw one animation frame. `timeMs` is the requestAnimationFrame timestamp. */
  frame(timeMs: number): void {
    this.lastFrame = timeMs;
    const g = this.g;
    if (this.mode === "splash") {
      this.splashStart ??= timeMs;
      if (timeMs - this.splashStart >= SPLASH_MS) this.mode = "title";
    }
    if (this.mode !== "title") this.titleSince = null;
    switch (this.mode) {
      case "splash":
        drawSplash(g, this.titleArt);
        return;
      case "title":
        this.titleSince ??= timeMs;
        drawTitle(g, this.titleArt, this.sprites, timeMs, timeMs - this.titleSince);
        return;
      case "menu":
        drawLauncherMenu(g, this.menuEntry, undefined, this.titleArt);
        return;
      case "orders":
        this.frameOrders(timeMs);
        return;
      case "play":
        this.framePlay(timeMs);
        return;
      case "demo":
        this.frameDemo(timeMs);
        return;
      case "history":
        if (this.history) drawHistory(g, this.history.view);
        return;
    }
  }

  private frameOrders(timeMs: number): void {
    const o = this.orders;
    if (!o) return;
    const elapsed = o.done ? Infinity : (timeMs - o.start) / 1000;
    const finished = o.done || elapsed >= o.timeline.duration;
    const hidden = this.settings.difficulty >= 8;
    drawOrders(this.g, { screen: ordersScreen(o.lines, revealedLines(o.lines, o.timeline, finished ? Infinity : elapsed), hidden), hidden, finished, cursorOn: cursorBlink(timeMs) });
  }

  private framePlay(timeMs: number): void {
    const sim = this.sim;
    const runner = this.runner;
    if (!sim || !runner) return;
    const dt = this.lastPlayMs === null ? 0 : Math.min((timeMs - this.lastPlayMs) / 1000, 0.25);
    this.lastPlayMs = timeMs;
    const paused = this.screen === "log" || this.screen === "damage" || this.screen === "gameControl" || this.prompt !== null || this.helpOpen;
    runner.paused = paused;
    const result = runner.frame(timeMs);
    this.handleEvents(result.events);
    sim.advanceExplosions(dt);
    this.radio.advance(dt);
    this.snapshot = result.render;
    this.draw(timeMs, sim, result.render);
  }

  private draw(timeMs: number, sim: Simulation, snap: Snapshot): void {
    const g = this.g;
    const view: PlayView = { sim, snap, settings: this.settings, sprites: this.sprites, log: this.log, timeMs };
    // tracks are only remembered once per simulation step (the original plots once per pass of its loop)
    const record = sim.tick !== this.lastTrailTick;
    this.lastTrailTick = sim.tick;
    for (const b of Object.values(this.trailBuffers)) b.recording = this.trailsOn && record;
    this.drawPlayScreen(this.screen, view, this.trailsOn, this.difficultyEditor, true);
    if (this.prompt) {
      drawPrompt(g, [this.prompt.kind === "password" ? "PASSWORD?" : "ENTER NEW SUB COORDINATES (X,Y):"], this.prompt.editor.value);
    }
    if (sim.status !== "running") drawEnd(g, sim.status);
    else {
      const message = this.radio.current;
      if (message) drawRadioMessage(g, message);
      if (this.helpOpen) drawHelpOverlay(g);
    }
    if (this.toast) {
      if (timeMs < this.toast.until) drawToast(g, this.toast.text);
      else this.toast = null;
    }
  }

  /** One mission screen, from the extracted GATO1 layouts when they are loaded, otherwise the approximated drawing. Shared with the demo. */
  private drawPlayScreen(screen: PlayScreen, view: PlayView, trails: boolean, editor: LineEditor | null, remakeExtras = true): void {
    const g = this.g;
    const L = this.cockpit;
    const trail = trails && (screen === "radar" || screen === "chart" || screen === "quadrant") ? this.trailBuffers[screen] : undefined;
    const prompt = editor ? (this.editorItem === 5 ? "MISSION 1-20, R = RANDOM" : "NEW DIFFICULTY LEVEL") : null;
    switch (screen) {
      case "control":
        if (L) drawControlRoomLayout(g, view, L);
        else drawControlRoom(g, view);
        break;
      case "radar":
        if (L) drawRadarLayout(g, view, L, liveContacts(view), trail);
        else drawRadar(g, view);
        break;
      case "chart":
        if (L) drawChartLayout(g, view, L, trail);
        else drawChart(g, view);
        break;
      case "quadrant":
        if (L) drawQuadrantLayout(g, view, L, trail);
        else drawQuadrantMap(g, view);
        break;
      case "log":
        if (L) drawLogLayout(g, view, L);
        else drawCaptainsLog(g, view);
        break;
      case "damage":
        if (L) drawDamageLayout(g, view, L);
        else drawDamageReport(g, view);
        break;
      case "gameControl":
        if (L) drawGameControlLayout(g, L, view.settings, prompt, editor?.value ?? "", remakeExtras);
        else drawGameControl(g, view.settings, prompt, editor?.value ?? "", remakeExtras);
        break;
    }
  }

  private frameDemo(timeMs: number): void {
    const d = this.demo;
    if (!d) return;
    const dt = this.lastDemoTime === null ? 0 : (timeMs - this.lastDemoTime) / 1000;
    this.lastDemoTime = timeMs;
    const result = d.runner.frame(timeMs);
    if (this.applyDemoEvents(d.player.advance(Math.min(dt, 0.25)), timeMs)) return;
    const g = this.g;
    if (d.screen === "intro") {
      const L = this.cockpit;
      const pal = L ? L.palette("control_room") : null; // COLOR 8,1: grey background, white text
      drawDemoIntro(g, this.data.demo.intro, pal?.[0] ?? "#555555", pal?.[3] ?? "#ffffff");
      return;
    }
    if (d.screen === "morseExample") {
      const m = this.demoMorse;
      const elapsed = m ? (timeMs - m.start) / 1000 : 0;
      drawTeletype(g, m ? ordersScreen(m.lines, revealedLines(m.lines, m.timeline, elapsed)) : ordersScreen([], []), cursorBlink(timeMs));
      return;
    }
    const sim = d.sim;
    const view: PlayView = { sim, snap: result.render, settings: DEFAULT_SETTINGS, sprites: this.sprites, log: this.demoLog ?? this.log, timeMs };
    let layer: ScreenName | null = "control_room";
    switch (d.screen) {
      case "chart":
        this.drawPlayScreen("chart", view, false, null);
        layer = "chart";
        break;
      case "radar":
        this.drawPlayScreen("radar", view, false, null);
        layer = "radar";
        break;
      case "quadrantMap":
        this.drawPlayScreen("quadrant", view, false, null);
        layer = "quadrant_map";
        break;
      case "damageReport":
        sim.sub.damage[2] = 1;
        sim.sub.damage[5] = 1;
        this.drawPlayScreen("damage", view, false, null);
        layer = "damage_report";
        break;
      case "captainsLog":
        this.drawPlayScreen("log", view, false, null);
        layer = "captains_log";
        break;
      case "gameControl":
        this.drawPlayScreen("gameControl", view, false, null, false);
        break;
      case "playAgain":
      case "radioRoom":
        g.clear();
        layer = null;
        break;
      default:
        this.drawPlayScreen("control", view, false, null);
        break;
    }
    const page = d.player.currentPage;
    if (page) {
      // the box is filled with the background colour of the screen behind it (LINE ...,0,BF) and the text is the screen's foreground
      const pal = this.cockpit && layer ? this.cockpit.palette(layer) : null;
      drawDemoNarration(g, page, d.screen, pal?.[0] ?? COLORS.black, pal?.[3] ?? COLORS.white);
    }
  }

  private lastDemoTime: number | null = null;
}

function dtgLine(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `DTG ${p(d.getUTCDate())}/${p(d.getUTCHours())}${p(d.getUTCMinutes())} ZULU`;
}
