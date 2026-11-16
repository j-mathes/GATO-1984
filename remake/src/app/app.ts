import type { MorseHandle } from "../audio/soundEngine.js";
import type { MorseTables } from "../audio/morse.js";
import { SoundEngine, type EffectName } from "../audio/soundEngine.js";
import {
  DEFAULT_SETTINGS,
  DemoPlayer,
  GameControl,
  Launcher,
  Simulation,
  WORLD,
  buildScenario,
  createRng,
  pickScenarioId,
  RadioInbox,
  type CourseJson,
  type DemoScriptDocument,
  type GameSettings,
  type HistoryPagesDocument,
  type MxpJson,
  type OrdersJson,
  type Scenario,
  type ShipLogDocument,
  type SimEvent,
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
import { Gfx } from "../render/gfx.js";
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
  type PlayView,
} from "../render/playScreens.js";
import type { SpriteLibrary } from "../render/sprites.js";
import type { TitleArt } from "../render/titleArt.js";
import { drawDemoNarration, drawHistory, drawLauncherMenu, drawOrders, drawTitle } from "../render/textScreens.js";
import { HistoryViewer } from "./historyViewer.js";
import { LogStore, type StorageLike } from "./logStore.js";
import { buildOrdersTimeline, revealedLines, type OrdersTimeline } from "./orders.js";
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

export type AppMode = "title" | "menu" | "orders" | "play" | "demo" | "history";

export const TICKS_PER_SECOND = 10;

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
  screen: PlayScreen = "control";
  settings: GameSettings = { ...DEFAULT_SETTINGS };
  readonly launcher = new Launcher();
  readonly log: LogStore;

  private sim: Simulation | null = null;
  private runner: FixedTimestepRunner | null = null;
  private snapshot: Snapshot | null = null;
  private menuEntry = "";
  private orders: { lines: string[]; header: string[]; timeline: OrdersTimeline; start: number; handle: MorseHandle | null; done: boolean } | null = null;
  private gameControl = new GameControl(this.settings);
  private difficultyEditor: LineEditor | null = null;
  private prompt: { kind: "password" | "coords"; editor: LineEditor } | null = null;
  private history: HistoryViewer | null = null;
  private demo: { player: DemoPlayer; sim: Simulation; runner: FixedTimestepRunner; page: number; screen: string } | null = null;
  private demoLog: LogStore | null = null;
  private lastFrame = 0;
  private lastPlayMs: number | null = null;
  private currentOrders: OrdersJson | null = null;
  /** Radio/status messages of the original (core/radio.ts), shown over the control room while the mission runs. */
  readonly radio = new RadioInbox();

  constructor(
    private readonly g: Gfx,
    private readonly data: AppData,
    private readonly sprites: SpriteLibrary | null,
    readonly sound: SoundEngine,
    storage: StorageLike | null = null,
    private readonly random: () => number = Math.random,
    private readonly titleArt: TitleArt | null = null,
  ) {
    this.log = new LogStore(data.shipLog, storage);
    this.gameControl = new GameControl(this.settings, () => this.log.reset());
    this.sound.enabled = this.settings.sound;
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
    if (e.key === "F2") this.sound.enabled = false;
    if (events.some((ev) => ev.type === "finished")) this.endDemo();
  }

  private playKey(e: KeyLike): void {
    const sim = this.sim;
    if (!sim) return;
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
        return;
      }
      case "screen":
        this.setScreen(action.screen);
        return;
      case "radioRoom":
        this.radioRoom();
        return;
      case "debugPrompt":
        // Hidden command (0x0b4d4): only on the chart and only while no enemy is alerted (ds:0x21aa = 0).
        if (this.screen === "chart" && sim.sub.alertTimer === 0) this.prompt = { kind: "password", editor: new LineEditor(12) };
        return;
      case "quit":
        this.returnToMenu("simulation");
        return;
    }
  }

  private setScreen(screen: PlayScreen): void {
    this.screen = screen;
    this.sim?.setInControlRoom(screen === "control");
    if (screen === "gameControl") this.difficultyEditor = null;
    this.runner?.resetClock();
  }

  private gameControlKey(e: KeyLike): void {
    if (this.difficultyEditor) {
      const done = this.difficultyEditor.handle(e);
      if (done === "enter") {
        const n = Number.parseFloat(this.difficultyEditor.value);
        if (Number.isFinite(n)) this.gameControl.apply(1, n);
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
    if (action.item === 1) this.difficultyEditor = new LineEditor(3);
    else {
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
  startMission(scenarioId: number = pickScenarioId(this.random()), seed: number = Math.floor(this.random() * 2 ** 31)): void {
    const course = this.data.courses[scenarioId];
    const orders = this.data.orders[scenarioId];
    if (!course || !orders) throw new Error(`scenario ${scenarioId} is missing`);
    const scenario: Scenario = buildScenario(scenarioId, course, orders, this.data.mxp);
    const sim = new Simulation({
      scenario,
      rng: createRng(seed),
      options: { ...this.settings, inControlRoom: true },
      shipLog: this.log.document(),
      ticksPerSecond: TICKS_PER_SECOND,
      date: todayStamp(),
    });
    this.sim = sim;
    this.runner = new FixedTimestepRunner(sim, TICKS_PER_SECOND);
    this.snapshot = takeSnapshot(sim);
    this.screen = "control";
    this.prompt = null;
    this.radio.clear();
    this.lastPlayMs = null;
    this.startOrders(orders);
    this.mode = "orders";
  }

  private startOrders(orders: OrdersJson, instant = false): void {
    this.currentOrders = orders;
    const body = orders.raw_lines.slice(1);
    const header = [(orders.classification ?? "SECRET").toUpperCase(), dtgLine()];
    const timeline = buildOrdersTimeline(body, this.data.morse, { difficulty: this.settings.difficulty, soundOn: this.settings.sound });
    const handle = !instant && this.sound.enabled ? this.sound.playMorse(body, this.data.morse, { soundOn: this.settings.sound }) : null;
    const start = instant ? this.lastFrame - (timeline.duration + 1) * 1000 : this.lastFrame;
    this.orders = { lines: body, header, timeline, start, handle, done: false };
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

  /** Any key: stop the Morse and go to the control room (the original abandons the rest of the orders, 0x0bd86). */
  private finishOrders(): void {
    if (!this.orders) return;
    this.orders.handle?.cancel();
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
    this.demo = { player, sim, runner, page: 0, screen: "title" };
    for (const ev of events) if (ev.type === "page") this.demo.screen = ev.screen;
    this.demoLog = new LogStore(this.data.shipLog, null);
    this.demoLog.apply(
      this.data.shipLog.records.slice(0, 3).map((r) => ({ type: "shipSunk" as const, slot: 3, typeCode: 4, record: { slot: 3, typeCode: 4, record: r.record, name: r.name, tonnage: r.tonnage } })),
      "01-01-1984",
    );
    this.mode = "demo";
  }

  private endDemo(): void {
    this.demo = null;
    this.demoLog = null;
    this.returnToMenu("demo");
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------------------------------------------------------

  /** Draw one animation frame. `timeMs` is the requestAnimationFrame timestamp. */
  frame(timeMs: number): void {
    this.lastFrame = timeMs;
    const g = this.g;
    switch (this.mode) {
      case "title":
        drawTitle(g, this.titleArt, this.sprites, timeMs);
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
    const elapsed = (timeMs - o.start) / 1000;
    const finished = elapsed >= o.timeline.duration;
    drawOrders(this.g, {
      header: o.header,
      body: revealedLines(o.lines, o.timeline, elapsed),
      hidden: this.settings.difficulty >= 8,
      finished,
    });
  }

  private framePlay(timeMs: number): void {
    const sim = this.sim;
    const runner = this.runner;
    if (!sim || !runner) return;
    const dt = this.lastPlayMs === null ? 0 : Math.min((timeMs - this.lastPlayMs) / 1000, 0.25);
    this.lastPlayMs = timeMs;
    const paused = this.screen === "log" || this.screen === "damage" || this.screen === "gameControl" || this.prompt !== null;
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
    switch (this.screen) {
      case "control":
        drawControlRoom(g, view);
        break;
      case "radar":
        drawRadar(g, view);
        break;
      case "chart":
        drawChart(g, view);
        break;
      case "quadrant":
        drawQuadrantMap(g, view);
        break;
      case "log":
        drawCaptainsLog(g, view);
        break;
      case "damage":
        drawDamageReport(g, view);
        break;
      case "gameControl":
        drawGameControl(g, this.settings, this.difficultyEditor ? "NEW DIFFICULTY LEVEL" : null, this.difficultyEditor?.value ?? "");
        break;
    }
    if (this.prompt) {
      drawPrompt(g, [this.prompt.kind === "password" ? "PASSWORD?" : "ENTER NEW SUB COORDINATES (X,Y):"], this.prompt.editor.value);
    }
    if (sim.status !== "running") drawEnd(g, sim.status, sim.completedBy);
    else {
      const message = this.radio.current;
      if (message) drawRadioMessage(g, message);
    }
  }

  private frameDemo(timeMs: number): void {
    const d = this.demo;
    if (!d) return;
    const dt = this.lastDemoTime === null ? 0 : (timeMs - this.lastDemoTime) / 1000;
    this.lastDemoTime = timeMs;
    const result = d.runner.frame(timeMs);
    const events = d.player.advance(Math.min(dt, 0.25));
    for (const ev of events) {
      if (ev.type === "page") d.screen = ev.screen;
      if (ev.type === "finished") {
        this.lastDemoTime = null;
        this.endDemo();
        return;
      }
    }
    const g = this.g;
    const sim = d.sim;
    const view: PlayView = { sim, snap: result.render, settings: DEFAULT_SETTINGS, sprites: this.sprites, log: this.demoLog ?? this.log, timeMs };
    switch (d.screen) {
      case "chart":
        drawChart(g, view);
        break;
      case "radar":
        drawRadar(g, view);
        break;
      case "quadrantMap":
        drawQuadrantMap(g, view);
        break;
      case "damageReport":
        sim.sub.damage[2] = 1;
        sim.sub.damage[5] = 1;
        drawDamageReport(g, view);
        break;
      case "captainsLog":
        drawCaptainsLog(g, view);
        break;
      case "gameControl":
        drawGameControl(g, DEFAULT_SETTINGS, null, "");
        break;
      case "title":
        drawTitle(g, this.titleArt, this.sprites, timeMs);
        break;
      case "playAgain":
      case "radioRoom":
        g.clear();
        break;
      default:
        drawControlRoom(g, view);
        break;
    }
    const page = d.player.currentPage;
    if (page) drawDemoNarration(g, page, d.player.soundOn);
  }

  private lastDemoTime: number | null = null;
}

function dtgLine(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `DTG ${p(d.getUTCDate())}/${p(d.getUTCHours())}${p(d.getUTCMinutes())} ZULU`;
}
