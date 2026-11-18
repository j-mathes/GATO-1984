import type { MorseHandle } from "../audio/soundEngine.js";
import type { MorseTables } from "../audio/morse.js";
import { SoundEngine, type EffectName } from "../audio/soundEngine.js";
import {
  ADVANCED_FEATURES,
  type AdvancedFeature,
  ADVANCED_INDENTED,
  AdvancedOptions,
  type AdvancedKey,
  DEFAULT_SETTINGS,
  DEFAULT_TICKS_PER_SECOND,
  DemoPlayer,
  type DemoEvent,
  type DemoMorseExample,
  GameControl,
  galleryShip,
  LAUNCHER_MENU,
  Launcher,
  Simulation,
  SinkingAnimation,
  WORLD,
  buildScenario,
  createRng,
  pickScenarioId,
  RadioInbox,
  TIME_COMPRESSION,
  isTimeScale,
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
  isPlainKey,
  type InputAction,
  type KeyLike,
  type PlayScreen,
} from "../input/keyboard.js";
import { CONTROL_DEFS, DEFAULT_KEYMAP, Keymap, controlGroup, controlLabel, isAssignable, isLocked, keyName, normalizeKey, type ControlDef, type ControlId } from "../input/controls.js";
import { COLORS, Gfx, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../render/gfx.js";
import { ENHANCED_HEIGHT, type Graphics } from "../render/display.js";
import { EnhancedRenderer } from "../render/enhanced/scene.js";
import { registerEnhancedScenes } from "../render/enhanced/scenes.js";
import { DEFAULT_VECTOR_INTERVAL, ShipTracker, VECTOR_INTERVALS, navDetail, navShips, nextSelection, vectorLegend, type NavScreen } from "../render/enhanced/nav.js";
import { drawEnhancedMenu, drawEnhancedOrders, drawEnhancedSplash, drawEnhancedTitle } from "../render/enhanced/frontend.js";
import { OXYGEN_FADE_SECONDS, drawEnhancedSinking, drawOxygenFade } from "../render/enhanced/sinking.js";
import { TYPEWRITER_SKIN } from "../render/enhanced/skin.js";
import { ShipArt } from "../render/enhanced/shipArt.js";
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
  drawSinking,
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
import { cursorBlink, controlsPages, drawAdvancedOptions, drawControlsEditor, drawDemoIntro, drawDemoNarration, drawHelpOverlay, drawHistory, drawTeletype, drawToast, ordersNote, type OrdersView, helmStatus, drawLauncherMenu, drawOrders, drawSplash, drawTitle, hasSplash, wrapText, ADVANCED_PAGE_SIZE, type ControlsEditorLine, type HelpPage } from "../render/textScreens.js";
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

export type AppMode = "splash" | "title" | "menu" | "settings" | "controls" | "orders" | "play" | "demo" | "history";

/** Simulation steps per second at 1x time compression: the pace of the 1984 PC (see TIME_COMPRESSION). Rendering is independent of it. */
export const TICKS_PER_SECOND = TIME_COMPRESSION.baseHz;
const TRAILS_KEY = "gato.trails";
const TIME_SCALE_KEY = "gato.timeScale";
const CONTROL_HUD_KEY = "gato.controlHud";
const ADVANCED_KEY = "gato.advanced";
const CONTROLS_KEY = "gato.controls";
const TOAST_MS = 1800;
/** Commands that change the helm: with `showControlHud` on, a status line confirms them on the very next frame (the boat itself answers at the step rate). */
const HELM_COMMANDS: ReadonlySet<string> = new Set(["speed", "rudder", "planes", "neutral", "engine", "doors"]);
/**
 * How long the Spectrum HoloByte logo stays up. GATO.EXE holds it with an empty FOR loop of 2000 passes (limit at ds:0x0bcc), whose real
 * duration depended on the CPU, so the time is a remake choice in the 2.5-3 s range.
 */
export const SPLASH_MS = 2500;
/** The ships of the demo's gallery are shown this big (the scope's apparent size) and broadside (sprite frame 4 of 16). */
const GALLERY_SHIP_SIZE = 5;
const GALLERY_SHIP_FRAME = 4;
/** Where the demo's boat starts: quadrant 5 (x 20000-24999, y 0-4999), heading west (mathematical angle pi), 1600 units from the island of that quadrant (22500, 2500). */
export const DEMO_START = { x: 24300, y: 900, heading: Math.PI } as const;

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
  private helpPage = 0;
  /** The periscope's last move, for the enhanced scope's shutter (see PlayView.periscopeMotion). */
  private periscopeSim: Simulation | null = null;
  private periscopeWas = false;
  private periscopeMotion: { up: boolean; since: number } | null = null;
  private prompt: { kind: "password" | "coords"; editor: LineEditor } | null = null;
  private history: HistoryViewer | null = null;
  /** The history page Esc left from (the history opens there again). */
  private historyResume = 0;
  private demo: { player: DemoPlayer; sim: Simulation; runner: FixedTimestepRunner; page: number; screen: string } | null = null;
  /** The orders example of the demo while it is typed out: its text, Morse timeline and sound. */
  private demoMorse: { start: number; lines: string[]; timeline: OrdersTimeline; handle: MorseHandle | null } | null = null;
  private demoLog: LogStore | null = null;
  private lastFrame = 0;
  private lastPlayMs: number | null = null;
  /** The lost-boat sequence (core/sinking.ts) from the moment the boat is lost; it stays (finished) as the flooded screen until the next mission. */
  private sinking: SinkingAnimation | null = null;
  /** Enhanced graphics only: when the screen began to go dark because the air ran out (the original just shows the message). */
  private oxygenFadeStart: number | null = null;
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
  /** The switches of the ADVANCED OPTIONS screen (launcher item 5): remake-only features that can be turned back to the 1984 behaviour. */
  readonly advanced: AdvancedOptions;
  /** Called after any switch changed (the page uses it for the display modes). */
  onAdvancedChange: (() => void) | null = null;
  /** Mission screens drawn by the enhanced renderer (render/enhanced/); a screen without a scene is drawn by the original code. */
  readonly enhanced = new EnhancedRenderer();
  /** Called when the graphics are switched, so the page can size the canvas (main.ts). */
  onGraphicsChange: ((graphics: Graphics) => void) | null = null;
  private graphicsMode: Graphics = "original";
  private enhancedView = { width: Math.round(ENHANCED_HEIGHT * 1.6), height: ENHANCED_HEIGHT };
  private advancedCursor = 0;
  /** The key assignments of the CONTROL ASSIGNMENTS screen; used for play only while CUSTOM CONTROLS is on. */
  readonly controls: Keymap;
  private controlsCursor = 0;
  private controlsEdit: { stage: "idle" } | { stage: "capture"; id: ControlId } | { stage: "conflict"; id: ControlId; key: string; other: ControlId } = { stage: "idle" };
  private controlsNote: ControlsEditorLine | null = null;
  private readonly storage: StorageLike | null;
  private readonly trailBuffers = createTrails();
  private lastTrailTick = -1;
  /** The navigation symbols of the enhanced radar, chart and map: the history of each ship, the ship with a data tag and how far ahead the vectors look. */
  private readonly navTracker = new ShipTracker();
  private navSelected: number | null = null;
  private navVectorIndex = DEFAULT_VECTOR_INTERVAL;
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
    this.advanced = new AdvancedOptions(() => this.advancedChanged(), storage?.getItem(ADVANCED_KEY) ?? null);
    this.controls = new Keymap(() => this.controlsChanged(), storage?.getItem(CONTROLS_KEY) ?? null, this.advanced.effective("simpleSpeed"), "custom");
    if (hasSplash(titleArt)) this.mode = "splash";
    this.trailsOn = storage?.getItem(TRAILS_KEY) !== "0";
    this.showControlHud = storage?.getItem(CONTROL_HUD_KEY) === "1";
    const savedScale = Number(storage?.getItem(TIME_SCALE_KEY));
    if (isTimeScale(savedScale)) this.settings.timeScale = savedScale;
    this.log = new LogStore(data.shipLog, storage);
    this.gameControl = new GameControl(this.settings, () => this.log.reset());
    this.sound.enabled = this.settings.sound;
    if (cockpit) {
      registerEnhancedScenes(this.enhanced, {
        art: new ShipArt(sprites),
        cockpit,
        trails: this.trailBuffers,
        trailsOn: () => this.trails,
        nav: () => ({ on: this.navOn, tracker: this.navTracker, selected: this.navSelected, intervals: VECTOR_INTERVALS[this.navVectorIndex] ?? 6 }),
      });
    }
  }

  /** The ship symbols replace the glowing dots: enhanced graphics with SHIP NAV SYMBOLS on. */
  private get navOn(): boolean {
    return this.graphicsMode === "enhanced" && this.advanced.effective("navSymbols");
  }

  /** The ENHANCED GRAPHICS switch decides the graphics; the page calls this once its canvas is wired, and the switch calls it on every change. */
  syncGraphics(): void {
    this.setGraphics(this.advanced.on("enhancedGraphics") ? "enhanced" : "original");
  }

  /** Time compression: 1x is the 1984 pace (2.5 simulation steps a second), 2x and 4x fast-forward. Keys [ and ], GAME CONTROL item 6; remembered in storage. */
  get timeScale(): TimeScale {
    return this.settings.timeScale ?? 1;
  }

  /** Steps per second at 1x: the 1984 PC pace, or (switch SLOW 1984 PC PACE off) the unpaced 10 steps a second. */
  get baseHz(): number {
    return this.advanced.on("pcPace") ? TIME_COMPRESSION.baseHz : DEFAULT_TICKS_PER_SECOND;
  }

  /** Simulation steps per second at the current time compression. */
  get stepRate(): number {
    return this.baseHz * this.timeScale;
  }

  setTimeScale(scale: TimeScale): void {
    this.settings.timeScale = scale;
    this.applyTimeScale();
    if (this.advanced.on("timeToast")) this.showToast(`TIME x${scale}  (${this.stepRate} STEPS/S)`);
  }

  private controlsChanged(): void {
    try {
      this.storage?.setItem(CONTROLS_KEY, this.controls.serialize());
    } catch {
      // storage may be unavailable (private mode)
    }
  }

  /** The assignments in force: the player's own with CUSTOM CONTROLS on, otherwise the original's. */
  get activeKeymap(): Keymap {
    return this.advanced.on("customControls") ? this.controls : DEFAULT_KEYMAP;
  }

  /** Whether the key is the display-mode key (V unless reassigned); the page handles it, in every mode. */
  isDisplayKey(e: KeyLike): boolean {
    return this.mode !== "controls" && !e.ctrlKey && !e.altKey && !e.metaKey && this.activeKeymap.idFor(e.key) === "display";
  }

  private advancedChanged(): void {
    try {
      this.storage?.setItem(ADVANCED_KEY, this.advanced.serialize());
    } catch {
      // storage may be unavailable (private mode)
    }
    this.controls.setSimpleSpeed(this.advanced.effective("simpleSpeed")); // the speed keys follow SIMPLE SPEED KEYS (and CUSTOM CONTROLS)
    if (this.sim) {
      // the world rules apply at once, also to the mission that is running
      this.sim.options.wrapWorld = this.advanced.on("wrapWorld");
      this.sim.options.gradualTurns = this.advanced.on("gradualTurns");
    }
    this.applyTimeScale();
    this.syncGraphics();
    this.onAdvancedChange?.();
  }

  /** The switches on the ADVANCED OPTIONS screen: those whose prerequisite switch is on (SIMPLE SPEED KEYS needs CUSTOM CONTROLS). */
  private advancedList(): AdvancedFeature[] {
    return ADVANCED_FEATURES.filter((f) => this.advanced.available(f.key));
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

  /** Persistent track dots on the radar, chart and quadrant map (authentic) or clean redraws; key W, remembered in storage. Always persistent while WAKE TRAILS ON/OFF is off. */
  get trails(): boolean {
    return this.advanced.on("trailToggle") ? this.trailsOn : true;
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
        if (this.advanced.on("splashSkip")) this.mode = "title";
        return;
      case "title":
        this.mode = "menu";
        this.launcher.pressAnyKey();
        return;
      case "menu":
        this.menuKey(e);
        return;
      case "settings":
        this.settingsKey(e);
        return;
      case "controls":
        this.controlsKey(e);
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
    if (this.mode === "title" || (this.mode === "splash" && this.advanced.on("splashSkip"))) this.keydown({ key: "Enter" });
  }

  private menuKey(e: KeyLike): void {
    if (e.key === "Enter") {
      this.choose(this.menuEntry === "" ? "1" : this.menuEntry);
    } else if (e.key === "Backspace") this.menuEntry = this.menuEntry.slice(0, -1);
    else if (/^[1-5]$/.test(e.key)) this.choose(e.key);
    else if (e.key.length === 1 && this.menuEntry.length < 3) this.menuEntry += e.key;
  }

  /** The text under the list: what the selected switch gives on (the remake feature) and off (the 1984 behaviour), and which one is in force. */
  private advancedDescriptions(): { on: string; off: string; current: boolean } {
    const f = this.advancedList()[this.advancedCursor];
    if (!f) return { on: "", off: "", current: true };
    return { on: f.remake, off: f.original, current: this.advanced.on(f.key) };
  }

  /** Left/Right (PageUp/PageDown) on ADVANCED OPTIONS: the first switch of the previous or next page, wrapping round. */
  private advancedPage(step: number): void {
    const pages = Math.ceil(this.advancedList().length / ADVANCED_PAGE_SIZE);
    const page = Math.floor(this.advancedCursor / ADVANCED_PAGE_SIZE);
    this.advancedCursor = ((page + step + pages) % pages) * ADVANCED_PAGE_SIZE;
  }

  /** ADVANCED OPTIONS: Up/Down select, Enter or Space switch, Left/Right change page, R back to the defaults, Esc leaves for the menu. */
  private settingsKey(e: KeyLike): void {
    const list = this.advancedList();
    const last = list.length - 1;
    if (this.advancedCursor > last) this.advancedCursor = last; // a switch that needs another one disappears with it
    const feature = list[this.advancedCursor];
    switch (e.key) {
      case "ArrowUp":
        this.advancedCursor = this.advancedCursor === 0 ? last : this.advancedCursor - 1;
        return;
      case "ArrowDown":
        this.advancedCursor = this.advancedCursor === last ? 0 : this.advancedCursor + 1;
        return;
      case "ArrowLeft":
      case "PageUp":
        this.advancedPage(-1);
        return;
      case "ArrowRight":
      case "PageDown":
        this.advancedPage(1);
        return;
      case "Enter":
      case " ":
        if (feature) this.advanced.toggle(feature.key);
        return;
      case "Escape":
        this.leaveSettings();
        return;
      default:
        if (e.key === "r" || e.key === "R") this.advanced.reset();
        else if ((e.key === "c" || e.key === "C") && this.advanced.on("customControls")) {
          this.controlsEdit = { stage: "idle" };
          this.controlsNote = null;
          this.mode = "controls";
        }
    }
  }

  /** Where ADVANCED OPTIONS was opened from: the launcher menu, or GAME CONTROL item 7 during a mission (the world waits meanwhile). */
  private settingsFrom: "menu" | "play" = "menu";

  private openSettings(from: "menu" | "play"): void {
    this.settingsFrom = from;
    this.mode = "settings";
  }

  /** Esc: back to the menu, or to the mission's GAME CONTROL screen with its clock restarted so no time passes while the screen was open. */
  private leaveSettings(): void {
    if (this.settingsFrom === "play" && this.sim) {
      this.mode = "play";
      this.runner?.resetClock();
      this.lastPlayMs = null;
    } else this.mode = "menu";
  }

  private noteControls(text: string, tone: ControlsEditorLine["tone"] = "info"): void {
    this.controlsNote = { text, tone };
  }

  /**
   * CONTROL ASSIGNMENTS: Up/Down/PageUp/PageDown select an action; Enter or Space then waits for the new key. A key another action
   * already has gives a warning: Enter overrides (the other action is left without a key), Esc cancels. Delete (or Backspace) blanks the
   * selected action, R restores every default, Esc leaves. Tab and Escape are fixed: their actions cannot be changed and no action can take them.
   */
  private controlsKey(e: KeyLike): void {
    const edit = this.controlsEdit;
    const defs = this.controlDefs();
    const def = defs[this.controlsCursor];
    if (!def) return;
    if (edit.stage === "conflict") {
      if (e.key === "Enter") {
        this.controls.assign(edit.id, edit.key, true);
        this.noteControls(`${keyName(edit.key)} NOW ${controlLabel(edit.id)}; ${controlLabel(edit.other)} HAS NO KEY`);
        this.controlsEdit = { stage: "idle" };
      } else if (e.key === "Escape") {
        this.noteControls("NOT CHANGED");
        this.controlsEdit = { stage: "idle" };
      }
      return;
    }
    if (edit.stage === "capture") {
      if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        this.noteControls("NOT CHANGED");
        this.controlsEdit = { stage: "idle" };
        return;
      }
      if (e.key === "Delete") {
        this.noteControls("NOT CHANGED");
        this.controlsEdit = { stage: "idle" };
        return;
      }
      const key = normalizeKey(e.key);
      if (e.ctrlKey || e.altKey || e.metaKey || !isAssignable(key)) return; // a modifier on its own, or a combination: keep waiting
      if (key === this.controls.get(edit.id)) {
        this.noteControls("NOT CHANGED");
        this.controlsEdit = { stage: "idle" };
        return;
      }
      const result = this.controls.assign(edit.id, key);
      if (result.ok) {
        this.noteControls(`${controlLabel(edit.id)} = ${keyName(key)}`);
        this.controlsEdit = { stage: "idle" };
      } else if ("locked" in result) {
        this.noteControls(`${keyName(key)} IS FIXED AND CANNOT BE ASSIGNED`, "warn");
        this.controlsEdit = { stage: "idle" };
      } else this.controlsEdit = { stage: "conflict", id: edit.id, key, other: result.conflict };
      return;
    }
    const count = defs.length;
    this.controlsNote = null;
    switch (e.key) {
      case "ArrowUp":
        this.controlsCursor = (this.controlsCursor + count - 1) % count;
        return;
      case "ArrowDown":
        this.controlsCursor = (this.controlsCursor + 1) % count;
        return;
      case "PageUp":
        this.controlsCursor = Math.max(this.controlsCursor - 10, 0);
        return;
      case "PageDown":
        this.controlsCursor = Math.min(this.controlsCursor + 10, count - 1);
        return;
      case "Enter":
      case " ":
        if (isLocked(def.id)) this.noteControls(`${def.label} IS FIXED: ${keyName(def.key)} CANNOT BE CHANGED`, "warn");
        else this.controlsEdit = { stage: "capture", id: def.id };
        return;
      case "Delete":
      case "Backspace":
        if (isLocked(def.id)) this.noteControls(`${def.label} IS FIXED: ${keyName(def.key)} CANNOT BE CHANGED`, "warn");
        else {
          this.controls.clear(def.id);
          this.noteControls(`${def.label} HAS NO KEY`);
        }
        return;
      case "Escape":
        this.mode = "settings";
        return;
      default:
        if (e.key === "r" || e.key === "R") {
          this.controls.reset();
          this.noteControls("ALL KEYS BACK TO THE DEFAULTS");
        }
    }
  }

  /** The actions listed on the assignment screen: those in use (the stage keys or the step keys, depending on SIMPLE SPEED KEYS). */
  private controlDefs(): ControlDef[] {
    return CONTROL_DEFS.filter((d) => this.controls.active(d.id));
  }

  private controlsView(): Parameters<typeof drawControlsEditor>[1] {
    const edit = this.controlsEdit;
    const defs = this.controlDefs();
    const def = defs[this.controlsCursor];
    let lines: ControlsEditorLine[] = [];
    let footer = "ENTER=SET DEL=CLEAR R=RESET ESC=BACK";
    if (edit.stage === "capture") {
      lines = [
        { text: "PRESS THE NEW KEY FOR", tone: "prompt" },
        { text: controlLabel(edit.id), tone: "prompt" },
      ];
      footer = "PRESS A KEY   ESC OR DEL=CANCEL";
    } else if (edit.stage === "conflict") {
      lines = wrapText(`${keyName(edit.key)} IS ALREADY USED FOR ${controlLabel(edit.other)}`)
        .slice(0, 2)
        .map((text) => ({ text, tone: "warn" as const }));
      footer = "ENTER=OVERRIDE (CLEARS IT) ESC=CANCEL";
    } else if (this.controlsNote) lines = wrapText(this.controlsNote.text).slice(0, 3).map((text) => ({ text, tone: this.controlsNote?.tone ?? "info" }));
    else if (def?.locked) lines = [{ text: "FIXED: CANNOT BE CHANGED OR TAKEN OVER", tone: "info" }];
    return {
      rows: defs.map((d, i) => {
        const group = controlGroup(d.id);
        const starts = i === 0 || controlGroup(defs[i - 1]?.id as ControlId) !== group;
        return { label: d.label, key: keyName(this.controls.get(d.id)), locked: d.locked === true, ...(starts ? { heading: group } : {}) };
      }),
      cursor: this.controlsCursor,
      lines,
      footer,
    };
  }

  private choose(input: string): void {
    this.menuEntry = "";
    const state = this.launcher.choose(input);
    if (state.screen !== "done") return;
    switch (state.target) {
      case "advanced":
        this.launcher.returnFrom("advanced"); // back to the menu state for when the screen is left
        this.openSettings("menu");
        break;
      case "simulation":
        this.startMission();
        break;
      case "demo":
        this.startDemo();
        break;
      case "history":
        this.history = new HistoryViewer(this.data.history, this.advanced.on("historyPaging"), this.advanced.on("historyPaging") ? this.historyResume : 0);
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
    if (this.advanced.on("historyPaging") && !isPlainKey(e)) return; // a modifier or a browser shortcut does not turn the page
    const view = this.history.press(e.key);
    if (view.phase === "done") {
      this.historyResume = this.history.resumePage ?? 0;
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
    if (this.radio.dismiss()) return; // a message box waits for a key: the key only closes it
    if (this.helpOpen) {
      this.helpKey(e);
      return;
    }
    if (this.prompt) {
      this.promptKey(e);
      return;
    }
    if (sim.status !== "running") {
      if (this.endPending()) return; // the sequence blocks the program until it is over
      if (e.key.toUpperCase() === "Y") this.startMission();
      else if (e.key.toUpperCase() === "N" || e.key === "Escape") this.returnToMenu("simulation");
      return;
    }
    if (this.screen === "gameControl") {
      this.gameControlKey(e);
      return;
    }
    const action = translatePlayKey(e, this.activeKeymap);
    // on another screen (radar, chart, map, log, damage report) a key with no assignment, or the key that brought the screen up, goes back to the control room
    if (this.screen !== "control" && (action ? action.type === "screen" && action.screen === this.screen : isPlainKey(e))) {
      this.setScreen("control");
      return;
    }
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
        if (this.showControlHud || this.advanced.on("helmHud")) {
          if (HELM_COMMANDS.has(action.command.type)) this.showToast(helmStatus(s));
        }
        return;
      }
      case "screen":
        this.setScreen(action.screen);
        return;
      case "radioRoom":
        this.radioRoom();
        return;
      case "toggleTrails":
        if (this.advanced.on("trailToggle")) this.setTrails(!this.trailsOn);
        return;
      case "navSelect": {
        const screen = this.screen;
        if (!this.navOn || !this.snapshot || (screen !== "radar" && screen !== "chart" && screen !== "quadrant")) return;
        if (!navDetail(this.settings.difficulty)) {
          this.showToast("SHIP TAGS: DIFFICULTY 2 OR LOWER");
          return;
        }
        const ships = navShips({ sim, snap: this.snapshot, settings: this.settings }, screen as NavScreen);
        this.navSelected = nextSelection(ships, this.navSelected);
        const picked = ships.find((s) => s.slot === this.navSelected);
        this.showToast(picked ? `TAG: ${picked.cls.label}` : "TAG OFF");
        return;
      }
      case "navVector":
        if (!this.navOn) return;
        this.navVectorIndex = (this.navVectorIndex + 1) % VECTOR_INTERVALS.length;
        this.showToast(vectorLegend(this.screen, VECTOR_INTERVALS[this.navVectorIndex] ?? 6).replace("VECTOR", "SHIP VECTORS:"));
        return;
      case "help":
        if (this.advanced.on("helpOverlay")) {
          this.helpPage = 0;
          this.helpOpen = true;
        }
        return;
      case "timeScale": {
        if (!this.advanced.on("timeKeys")) return;
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
        if (this.advanced.on("escQuit")) this.returnToMenu("simulation");
        return;
    }
  }

  /** Controls quick-reference overlay (key ? or H during a mission); the world is paused while it is shown. */
  get helpVisible(): boolean {
    return this.helpOpen;
  }

  /** The page of the overlay that is showing (0-based). */
  get helpPageIndex(): number {
    return this.helpPage;
  }

  private helpPages(): HelpPage[] {
    const on = (k: AdvancedKey): boolean => this.advanced.on(k);
    return controlsPages({ trails: on("trailToggle"), timeKeys: on("timeKeys"), display: on("displayModes"), escQuit: on("escQuit"), simpleSpeed: this.advanced.effective("simpleSpeed") }, (id) => this.activeKeymap.get(id));
  }

  /** Left/Up/PageUp and Right/Down/PageDown turn the pages (wrapping round); any other key closes the overlay and is not passed on. */
  private helpKey(e: KeyLike): void {
    const count = this.helpPages().length;
    if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) this.helpPage = (this.helpPage + 1) % count;
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) this.helpPage = (this.helpPage + count - 1) % count;
    else this.closeHelp();
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
    if (action.item === 7) {
      this.openSettings("play"); // remake addition: ADVANCED OPTIONS from inside the mission; the world waits
      return;
    }
    if ((action.item === 5 && !this.missionItemOn) || (action.item === 6 && !this.advanced.on("gameControlExtras"))) return;
    if (action.item === 1 || action.item === 5) {
      this.editorItem = action.item;
      this.difficultyEditor = new LineEditor(3);
    } else {
      this.gameControl.apply(action.item);
      this.applySettings();
    }
  }

  /** GAME CONTROL item 5 exists only with both GAME CONTROL ITEMS 5 AND 6 and CHOOSE THE NEXT MISSION on. */
  private get missionItemOn(): boolean {
    return this.advanced.on("gameControlExtras") && this.advanced.on("missionSelect");
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
  startMission(scenarioId: number = (this.advanced.on("missionSelect") ? this.settings.mission : undefined) ?? pickScenarioId(this.random()), seed: number = Math.floor(this.random() * 2 ** 31)): void {
    const course = this.data.courses[scenarioId];
    const orders = this.data.orders[scenarioId];
    if (!course || !orders) throw new Error(`scenario ${scenarioId} is missing`);
    const scenario: Scenario = buildScenario(scenarioId, course, orders, this.data.mxp);
    const sim = new Simulation({
      scenario,
      rng: createRng(seed),
      options: { ...this.settings, inControlRoom: true, wrapWorld: this.advanced.on("wrapWorld"), gradualTurns: this.advanced.on("gradualTurns") },
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
    this.sinking = null;
    this.oxygenFadeStart = null;
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
    if (!this.advanced.on("radioReread")) {
      this.startMission(); // the original asks for a new mission
      return;
    }
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
    if (effect === "explosion" && !this.advanced.on("boomSound")) return;
    if (effect === "radioAlert" && !this.advanced.on("radioAlert")) return;
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
    this.sinking = null;
    this.oxygenFadeStart = null;
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
      ticksPerSecond: this.baseHz,
    });
    // the narration puts the boat in quadrant 5 (with its island, the sub-tender in quadrant 7): start there, steaming west along the south
    // side of the island, outside its shoals, so the boat stays in the quadrant for the whole show
    sim.sub.x = DEMO_START.x;
    sim.sub.y = DEMO_START.y;
    sim.sub.heading = DEMO_START.heading;
    sim.command({ type: "speed", level: "F5" });
    sim.command({ type: "periscope", direction: "raise" });
    const runner = new FixedTimestepRunner(sim, this.baseHz);
    const player = new DemoPlayer(this.data.demo, { anyKeySkips: this.advanced.on("demoSkip") });
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

  /** The graphics in use: the original 320 x 200 picture, or the enhanced renderer (screens without a scene still draw as the original). */
  get graphics(): Graphics {
    return this.graphicsMode;
  }

  setGraphics(graphics: Graphics): void {
    if (graphics === this.graphicsMode) return;
    this.graphicsMode = graphics;
    if (graphics === "original") this.g.view(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.onGraphicsChange?.(graphics);
  }

  /** The logical size the enhanced scenes draw in (the page reports it when the window changes; 800 units high, 1280 to 1422 wide). */
  setEnhancedView(width: number, height: number): void {
    this.enhancedView = { width, height };
  }

  /** Draw one animation frame. `timeMs` is the requestAnimationFrame timestamp. */
  frame(timeMs: number): void {
    this.lastFrame = timeMs;
    const g = this.g;
    if (this.graphicsMode === "enhanced") {
      g.view(LOGICAL_WIDTH, LOGICAL_HEIGHT); // everything but the enhanced scenes draws in the original view, centred in the canvas
      g.fillBacking(COLORS.black);
    }
    if (this.mode === "splash") {
      this.splashStart ??= timeMs;
      if (timeMs - this.splashStart >= SPLASH_MS) this.mode = "title";
    }
    if (this.mode !== "title") this.titleSince = null;
    switch (this.mode) {
      case "splash":
        if (!this.front((w, h) => drawEnhancedSplash(g, this.titleArt, w, h, timeMs - (this.splashStart ?? timeMs), SPLASH_MS))) drawSplash(g, this.titleArt);
        return;
      case "title":
        this.titleSince ??= timeMs;
        if (!this.front((w, h) => drawEnhancedTitle(g, this.titleArt, w, h, timeMs, timeMs - (this.titleSince ?? timeMs)))) drawTitle(g, this.titleArt, this.sprites, timeMs, timeMs - this.titleSince);
        return;
      case "menu":
        if (!this.front((w, h) => drawEnhancedMenu(g, this.titleArt, w, h, this.menuEntry, LAUNCHER_MENU, timeMs))) drawLauncherMenu(g, this.menuEntry, undefined, this.titleArt);
        return;
      case "settings":
        this.withSkin(() =>
          drawAdvancedOptions(g, {
            rows: this.advancedList().map((f) => ({ label: f.label, on: this.advanced.on(f.key), indent: ADVANCED_INDENTED.has(f.key) })),
            cursor: this.advancedCursor,
            descriptions: this.advancedDescriptions(),
            controlsKey: this.advanced.on("customControls"),
          }),
        );
        return;
      case "controls":
        this.withSkin(() => drawControlsEditor(g, this.controlsView()));
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
        if (this.history) {
          const viewer = this.history;
          this.withSkin(() => drawHistory(g, viewer.view));
        }
        return;
    }
  }

  /** Draws a screen before the mission in the enhanced graphics, in the enhanced view; false (nothing drawn) in the original graphics or when the draw has no artwork. */
  private front(draw: (width: number, height: number) => boolean): boolean {
    if (this.graphicsMode !== "enhanced") return false;
    const { width, height } = this.enhancedView;
    const done = draw(width, height);
    this.g.view(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    return done;
  }

  private frameOrders(timeMs: number): void {
    const o = this.orders;
    if (!o) return;
    const elapsed = o.done ? Infinity : (timeMs - o.start) / 1000;
    const finished = o.done || elapsed >= o.timeline.duration;
    const hidden = this.settings.difficulty >= 8;
    const view: OrdersView = { screen: ordersScreen(o.lines, revealedLines(o.lines, o.timeline, finished ? Infinity : elapsed), hidden), hidden, finished, cursorOn: cursorBlink(timeMs) };
    this.front((w, h) => (drawEnhancedOrders(this.g, w, h, view, timeMs, ordersNote(view)), true)) || drawOrders(this.g, view);
  }

  private framePlay(timeMs: number): void {
    const sim = this.sim;
    const runner = this.runner;
    if (!sim || !runner) return;
    const dt = this.lastPlayMs === null ? 0 : Math.min((timeMs - this.lastPlayMs) / 1000, 0.25);
    this.lastPlayMs = timeMs;
    const blasting = !this.advanced.on("explosionsRun") && sim.explosions.length > 0; // the original blocks while an explosion plays
    const paused = this.screen === "log" || this.screen === "damage" || this.screen === "gameControl" || this.prompt !== null || this.helpOpen || blasting;
    runner.paused = paused;
    const result = runner.frame(timeMs);
    this.handleEvents(result.events);
    if (!this.sinking && sim.status === "destroyed" && !this.advanced.on("skipSinking")) {
      this.sinking = new SinkingAnimation(this.screen === "control" ? "cracks" : "bands"); // the original tests ds:0x21ce (0x0b5f0)
    }
    this.sinking?.advance(dt);
    if (this.oxygenFadeStart === null && sim.status === "suffocated" && this.graphicsMode === "enhanced") this.oxygenFadeStart = timeMs;
    sim.advanceExplosions(dt);
    this.radio.advance(dt);
    this.snapshot = result.render;
    this.draw(timeMs, sim, result.render);
  }

  private draw(timeMs: number, sim: Simulation, snap: Snapshot): void {
    const g = this.g;
    if (this.periscopeSim !== sim) {
      this.periscopeSim = sim;
      this.periscopeMotion = null;
      this.periscopeWas = sim.sub.periscopeUp;
    } else if (this.periscopeWas !== sim.sub.periscopeUp) {
      this.periscopeWas = sim.sub.periscopeUp;
      this.periscopeMotion = { up: sim.sub.periscopeUp, since: timeMs };
    }
    const view: PlayView = { sim, snap, settings: this.settings, sprites: this.sprites, log: this.log, timeMs, solidShips: this.advanced.on("solidShips"), periscopeMotion: this.periscopeMotion };
    // tracks are only remembered once per simulation step (the original plots once per pass of its loop)
    const record = sim.tick !== this.lastTrailTick;
    this.lastTrailTick = sim.tick;
    if (this.navOn) this.navTracker.update(sim);
    for (const b of Object.values(this.trailBuffers)) b.recording = this.trails && record;
    this.drawPlayScreen(this.screen, view, this.trails, this.difficultyEditor, true);
    if (this.sinking) {
      if (this.graphicsMode === "enhanced") {
        drawEnhancedSinking(g, this.sinking, this.enhancedView.width, this.enhancedView.height, timeMs);
        g.view(LOGICAL_WIDTH, LOGICAL_HEIGHT);
      } else drawSinking(g, this.sinking, this.screenPalette());
    }
    if (this.oxygenFadeStart !== null && sim.status === "suffocated") drawOxygenFade(g, (timeMs - this.oxygenFadeStart) / 1000);
    this.withSkin(() => {
      if (this.prompt) {
        drawPrompt(g, [this.prompt.kind === "password" ? "PASSWORD?" : "ENTER NEW SUB COORDINATES (X,Y):"], this.prompt.editor.value);
      }
      if (sim.status !== "running") {
        if (!this.endPending()) drawEnd(g, sim.status, this.advanced.on("endBox"));
      } else {
        const message = this.radio.current;
        if (message) drawRadioMessage(g, message);
        if (this.helpOpen) drawHelpOverlay(g, this.helpPage, this.helpPages());
      }
      if (this.toast) {
        if (timeMs < this.toast.until) drawToast(g, this.toast.text);
        else this.toast = null;
      }
    });
  }

  /** Runs `draw` with the typewriter look of the enhanced graphics (render/enhanced/skin.ts); the original graphics draw it as it always was. */
  private withSkin(draw: () => void): void {
    this.g.skin = this.graphicsMode === "enhanced" ? TYPEWRITER_SKIN : null;
    try {
      draw();
    } finally {
      this.g.skin = null;
    }
  }

  /** The sinking sequence or the oxygen fade is still running: the end message waits and keys do nothing. */
  private endPending(): boolean {
    if (this.sinking && !this.sinking.done) return true;
    return this.oxygenFadeStart !== null && (this.lastFrame - this.oxygenFadeStart) / 1000 < OXYGEN_FADE_SECONDS;
  }

  /** The four colours of the screen the sinking sequence paints over (colour 2 = water, 3 = cracks). */
  private screenPalette(): readonly string[] {
    const names = { control: "control_room", gameControl: "control_room", damage: "damage_report", radar: "radar", chart: "chart", quadrant: "quadrant_map", log: "captains_log" } as const;
    return this.cockpit?.palette(names[this.screen]) ?? ["#000000", "#55ffff", "#ff55ff", "#ffffff"];
  }

  /** One mission screen, from the extracted GATO1 layouts when they are loaded, otherwise the approximated drawing. Shared with the demo. */
  private drawPlayScreen(screen: PlayScreen, view: PlayView, trails: boolean, editor: LineEditor | null, remakeExtras = true): void {
    const g = this.g;
    const L = this.cockpit;
    const showMission = remakeExtras && this.missionItemOn;
    const showTime = remakeExtras && this.advanced.on("gameControlExtras");
    const trail = trails && (screen === "radar" || screen === "chart" || screen === "quadrant") ? this.trailBuffers[screen] : undefined;
    const prompt = editor ? (this.editorItem === 5 ? "MISSION 1-20, R = RANDOM" : "NEW DIFFICULTY LEVEL") : null;
    const scene = this.graphicsMode === "enhanced" && remakeExtras ? this.enhanced.scene(screen) : undefined; // the demo keeps the original pictures
    if (scene) {
      const { width, height } = this.enhancedView;
      g.view(width, height);
      scene({ g, view, screen, width, height });
      g.view(LOGICAL_WIDTH, LOGICAL_HEIGHT);
      return;
    }
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
        this.withSkin(() => {
          if (L) drawGameControlLayout(g, L, view.settings, prompt, editor?.value ?? "", showMission, showTime, remakeExtras);
          else drawGameControl(g, view.settings, prompt, editor?.value ?? "", showMission, showTime, remakeExtras);
        });
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
      const screen = m ? ordersScreen(m.lines, revealedLines(m.lines, m.timeline, elapsed)) : ordersScreen([], []);
      if (!this.front((w, h) => (drawEnhancedOrders(g, w, h, { screen, hidden: false, finished: false, cursorOn: cursorBlink(timeMs) }, timeMs, null), true))) drawTeletype(g, screen, cursorBlink(timeMs));
      return;
    }
    const sim = d.sim;
    // the page that names the enemy ships one by one: that ship is shown in the scope
    const listed = d.player.currentPage;
    const ship = d.screen === "shipGallery" && listed ? galleryShip(listed, d.player.pageFraction) : null;
    const view: PlayView = { sim, snap: result.render, settings: DEFAULT_SETTINGS, sprites: this.sprites, log: this.demoLog ?? this.log, timeMs, gallery: ship ? { typeCode: ship.typeCode, size: GALLERY_SHIP_SIZE, frame: GALLERY_SHIP_FRAME } : null };
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
        this.withSkin(() => g.clear());
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
      this.withSkin(() => drawDemoNarration(g, page, d.screen, pal?.[0] ?? COLORS.black, pal?.[3] ?? COLORS.white, ship?.index));
    }
  }

  private lastDemoTime: number | null = null;
}

function dtgLine(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `DTG ${p(d.getUTCDate())}/${p(d.getUTCHours())}${p(d.getUTCMinutes())} ZULU`;
}
