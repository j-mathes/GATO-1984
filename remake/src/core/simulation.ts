import {
  convoySunk,
  createVessels,
  islandShape,
  loadIsland,
  nearQuadrantEdge,
  stepAlertTimer,
  stepEnemies,
  updateContacts,
  withinIslandObjective,
} from "./ai.js";
import { advanceTorpedoes, createTorpedoes, launchTorpedo, ShipLog } from "./combat.js";
import { DAMAGE, ENGINE, RESUPPLY, DEPTH, SLOT, START } from "./constants.js";
import type { Explosion } from "./explosion.js";
import { radioRoomReport, type RadioMessage } from "./radio.js";
import {
  applyHelmCommand,
  centreControls,
  createSubmarine,
  crushRoll,
  damageCount,
  damageIndexSum,
  resolveIslandCollision,
  stepDepth,
  stepEngineChecks,
  stepHeading,
  stepPosition,
  stepResources,
  stepSpeed,
  headingsAligned,
  type HelmCommand,
} from "./physics.js";
import { quadrantOf } from "./scenario.js";
import type { GameStatus, Rng, Scenario, ShipLogDocument, SimEvent, SimOptions, SubmarineState, Torpedo, Vessel } from "./types.js";
import type { IslandShape } from "./physics.js";

export type SimCommand = HelmCommand | { type: "fire" } | { type: "neutral" };

export interface SimulationConfig {
  scenario: Scenario;
  rng: Rng;
  options: SimOptions;
  shipLog: ShipLogDocument;
  /** Steps per second; only used to turn the original's "every second" checks and the remake's wall-clock timings into step counts. Core default 10; the app runs 2.5 (see TIME_COMPRESSION). */
  ticksPerSecond?: number;
  /** Date stamped on sunk ships in the captain's log. */
  date?: string;
}

export const DEFAULT_TICKS_PER_SECOND = 10;

/**
 * The world update of GATO1 (the subroutine at program offset 0x6412 plus the control-room part before it), as a
 * deterministic fixed-step simulation. One step is one pass of the original main loop.
 */
export class Simulation {
  readonly scenario: Scenario;
  readonly sub: SubmarineState;
  readonly vessels: Vessel[];
  readonly torpedoes: Torpedo[];
  readonly log: ShipLog;
  readonly options: SimOptions;
  status: GameStatus = "running";
  tick = 0;
  /** At least one objective has been completed (the original keeps playing; see completeMission). */
  missionComplete = false;
  /** The objective completed last. */
  completedBy: "island" | "convoySunk" | null = null;
  /** Objectives completed so far, in order (each can happen once). */
  readonly completions: ("island" | "convoySunk")[] = [];
  /** Running explosion animations; they only advance through {@link advanceExplosions} (the world does not wait for them). */
  readonly explosions: Explosion[] = [];
  /** Set once the island objective has been used (the original overwrites trailer[0] with 1, 0x070f4). */
  objectiveDone = false;
  /** Set once the convoy message has been shown (ds:0x226e, 0x07e47). */
  convoyDone = false;

  private readonly rng: Rng;
  private ticksPerSecond: number;
  private readonly date: string;
  private island: IslandShape;
  private closeList: number[] = [];
  private pending: SimEvent[] = [];

  constructor(cfg: SimulationConfig) {
    this.scenario = cfg.scenario;
    this.rng = cfg.rng;
    this.options = { ...cfg.options, difficulty: clampDifficulty(cfg.options.difficulty) };
    this.ticksPerSecond = cfg.ticksPerSecond ?? DEFAULT_TICKS_PER_SECOND;
    this.date = cfg.date ?? "01-01-1984";
    this.log = new ShipLog(cfg.shipLog);
    this.sub = createSubmarine(this.rng);
    this.vessels = createVessels(cfg.scenario);
    this.torpedoes = createTorpedoes();
    this.island = this.refreshIsland();
    updateContacts(this.sub, this.vessels, this.island);
  }

  get currentQuadrant(): number {
    return quadrantOf(this.sub.x, this.sub.y);
  }

  get tender(): Vessel {
    return this.vessels[SLOT.tender] as Vessel;
  }

  /** Queue a player command; it takes effect immediately, like a key press between two passes of the main loop. */
  command(cmd: SimCommand): void {
    if (this.status !== "running") return;
    if (cmd.type === "fire") {
      launchTorpedo(this.sub, this.torpedoes, this.pending);
    } else if (cmd.type === "neutral") {
      centreControls(this.sub);
    } else {
      applyHelmCommand(this.sub, cmd);
    }
  }

  setInControlRoom(value: boolean): void {
    this.options.inControlRoom = value;
  }

  /** The step rate changed (time compression): wall-clock based remake timings (alarm interval, resupply speed) follow it. */
  setTicksPerSecond(stepsPerSecond: number): void {
    if (stepsPerSecond > 0) this.ticksPerSecond = stepsPerSecond;
  }

  /**
   * Put the boat at (x, y) and reload the island of that quadrant (GOSUB c6c7). The original has this as a hidden command:
   * key Z on the chart asks PASSWORD? (answer PAED) and then "ENTER NEW SUB COORDINATES (X,Y)" (Gato1.exe 0x0b4d4-0x0b563).
   */
  teleport(x: number, y: number): void {
    this.sub.x = x;
    this.sub.y = y;
    this.island = this.refreshIsland();
    updateContacts(this.sub, this.vessels, this.island);
  }

  /** Advance one step; returns the events of this step (including those queued by commands since the last step). */
  step(): SimEvent[] {
    const events = this.pending;
    this.pending = [];
    if (this.status !== "running") return events;
    this.tick += 1;
    const sub = this.sub;
    const o = this.options;

    if (damageCount(sub) > DAMAGE.maxCompartments) return this.destroy("damage", events);
    stepEngineChecks(sub, events);
    if (o.inControlRoom) {
      stepSpeed(sub);
      stepHeading(sub);
    }

    // --- world update (subroutine at 0x6412) -------------------------------------------------------------------
    if (this.torpedoes.some((t) => t.speed > 0)) {
      const result = advanceTorpedoes({
        sub,
        difficulty: o.difficulty,
        rng: this.rng,
        events,
        vessels: this.vessels,
        torpedoes: this.torpedoes,
        log: this.log,
        closeList: this.closeList,
        inControlRoom: o.inControlRoom,
        date: this.date,
        explosions: this.explosions,
      });
      if (result.ownBoatDestroyed) return this.destroy("ownTorpedo", events);
    }

    if (this.alarmStep()) {
      events.push({ type: "damageAlarm" });
      const sum = damageIndexSum(sub);
      if (sum > DAMAGE.lostIndexSum) return this.destroy("damage", events);
    }

    stepDepth(sub);
    if (nearQuadrantEdge(sub)) this.island = this.refreshIsland();
    stepPosition(sub);
    const island = this.vessels[SLOT.island];
    if (island) resolveIslandCollision(sub, this.island, island.bearing);

    const contacts = updateContacts(sub, this.vessels, this.island);
    this.closeList = contacts.closeList;
    if (contacts.collision) {
      events.push({ type: "collision", slot: contacts.collision.slot });
      if (sub.depth < DEPTH.collisionSafe) return this.destroy("collision", events);
      if (sub.periscopeUp && sub.depth < DEPTH.periscopeBreaks && (sub.damage[6] ?? 0) === 0) {
        sub.damage[6] = 1;
        events.push({ type: "periscopeBroken" });
      }
    }

    if (crushRoll(sub, this.rng)) return this.destroy("crush", events);
    this.checkIslandObjective(events);
    this.stepResupply(events);

    if (stepResources(sub) === "suffocated") {
      this.status = "suffocated";
      events.push({ type: "radio", message: "oxygenExhausted" });
      events.push({ type: "subDestroyed", reason: "oxygen" });
      return events;
    }
    if (!o.inControlRoom) {
      stepSpeed(sub);
      stepHeading(sub);
    }

    stepAlertTimer(sub, this.vessels, o.difficulty);
    stepEnemies({ sub, vessels: this.vessels, difficulty: o.difficulty, timeOfDay: o.timeOfDay, island: this.island, rng: this.rng, events });
    if (!this.convoyDone && convoySunk(this.vessels, this.scenario.objectives.lastConvoySlot)) {
      this.completeMission("convoySunk", events);
    }
    return events;
  }

  private alarmStep(): boolean {
    return this.tick % (2 * this.ticksPerSecond) === 0 && damageIndexSum(this.sub) > DAMAGE.alarmIndexSum;
  }

  private refreshIsland(): IslandShape {
    const record = this.scenario.islands[quadrantOf(this.sub.x, this.sub.y)];
    loadIsland(this.vessels, record);
    return islandShape(record);
  }

  private destroy(reason: "damage" | "crush" | "collision" | "ownTorpedo", events: SimEvent[]): SimEvent[] {
    this.status = "destroyed";
    events.push({ type: "subDestroyed", reason });
    return events;
  }

  /**
   * Island objective (0x06fef-0x070f4): stopped, in the objective quadrant, time of day equal to trailer[1], and closer
   * than the island's inner radius + 200. It fires once (the original then sets ds:0x2246 to 1, which switches it off for the
   * scenarios whose objective is another quadrant) and does not stop the simulation.
   */
  private checkIslandObjective(events: SimEvent[]): void {
    const obj = this.scenario.objectives;
    if (this.objectiveDone || obj.objectiveQuadrant === 0) return;
    if (
      this.sub.speed === 0 &&
      this.currentQuadrant === obj.objectiveQuadrant &&
      this.options.timeOfDay === obj.requiredTimeOfDay &&
      withinIslandObjective(this.vessels, this.island)
    ) {
      this.objectiveDone = true;
      events.push({ type: "objectiveReached" });
      events.push({ type: "radio", message: "contactMade" });
      events.push({ type: "radio", message: "missionCompleted" });
      this.completeMission("island", events);
    }
  }

  /**
   * An objective is done (GOSUB 0x0d327 in the original: the log is written and the count of completed missions goes up). The original shows
   * its message and goes on with the loop: the boat keeps patrolling, resupplies, and leaves with Escape or M when the player is ready.
   * The convoy objective and the island objective are independent and each counts once.
   */
  private completeMission(reason: "island" | "convoySunk", events: SimEvent[]): void {
    this.missionComplete = true;
    this.completedBy = reason;
    this.completions.push(reason);
    this.log.totals.missionsCompleted += 1;
    if (reason === "convoySunk") {
      this.convoyDone = true;
      events.push({ type: "radio", message: "convoyDestroyed" });
    }
    events.push({ type: "missionComplete", reason });
  }

  /** Key M: ask the radio room. Queues the "heavy damage" report when the radio room is damaged and returns it, otherwise null. */
  requestRadioRoom(): RadioMessage | null {
    const report = radioRoomReport(this.sub);
    if (report) this.pending.push({ type: "radio", message: report.id });
    return report;
  }

  /** Advance the explosion animations by real time and drop the finished ones. */
  advanceExplosions(seconds: number): void {
    for (const e of this.explosions) e.advance(seconds);
    for (let i = this.explosions.length - 1; i >= 0; i -= 1) if (this.explosions[i]?.finished) this.explosions.splice(i, 1);
  }

  /** Subtender resupply (0x07108-0x071bf, 0x0cd8e-0x0cf8b): refuel, reload torpedoes, repair all compartments. */
  private stepResupply(events: SimEvent[]): void {
    const sub = this.sub;
    const tender = this.tender;
    if (!sub.resupply) {
      if (!tender.sunk && tender.distance < RESUPPLY.range && sub.fuel < RESUPPLY.fuelFullThreshold && headingsAligned(tender.heading, sub.heading)) {
        sub.resupply = { stepsRemaining: 0, reloadTicks: 0 };
        events.push({ type: "resupplyStarted" });
      }
      return;
    }
    if (sub.fuel < RESUPPLY.fuelFullThreshold) {
      sub.fuel = Math.min(sub.fuel + (RESUPPLY.fuelPerStep * RESUPPLY.innerStepsPerSecond) / this.ticksPerSecond, RESUPPLY.fuelCeiling);
      return;
    }
    if (sub.torpedoes < START.torpedoes) {
      sub.resupply.reloadTicks += 1;
      if (sub.resupply.reloadTicks >= Math.round(RESUPPLY.torpedoReloadSeconds * this.ticksPerSecond)) {
        sub.resupply.reloadTicks = 0;
        sub.torpedoes += 1;
      }
      return;
    }
    sub.fuel = RESUPPLY.fuelCeiling;
    sub.damage.fill(0);
    sub.resupply = null;
    events.push({ type: "resupplyFinished" });
  }

  /** Engine mode text helper for UIs. */
  get engineName(): "off" | "electric" | "diesel" {
    return this.sub.engine === ENGINE.diesel ? "diesel" : this.sub.engine === ENGINE.electric ? "electric" : "off";
  }
}

export function clampDifficulty(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 9);
}

/** Accumulator for a fixed-timestep loop: feed real elapsed time, run whole steps. */
export class FixedStepLoop {
  private accumulator = 0;
  readonly stepMs: number;

  constructor(
    private readonly sim: Simulation,
    stepsPerSecond: number = DEFAULT_TICKS_PER_SECOND,
    private readonly maxStepsPerAdvance = 20,
  ) {
    this.stepMs = 1000 / stepsPerSecond;
  }

  /** Returns the events of all steps run. Drops time beyond `maxStepsPerAdvance` steps (spiral-of-death guard). */
  advance(elapsedMs: number): SimEvent[] {
    this.accumulator += Math.max(0, elapsedMs);
    const events: SimEvent[] = [];
    let steps = 0;
    while (this.accumulator >= this.stepMs && steps < this.maxStepsPerAdvance && this.sim.status === "running") {
      events.push(...this.sim.step());
      this.accumulator -= this.stepMs;
      steps += 1;
    }
    if (steps >= this.maxStepsPerAdvance) this.accumulator = 0;
    return events;
  }
}
