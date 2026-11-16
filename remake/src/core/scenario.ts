import { SLOT } from "./constants.js";
import type { CourseJson, IslandRecord, MxpJson, OrdersJson, Scenario, ScenarioShip } from "./types.js";

/** Build a Scenario from the JSON files written by analysis/parse_scenarios.py. */
export function buildScenario(id: number, course: CourseJson, orders: OrdersJson, mxp: MxpJson): Scenario {
  if (course.ships.length !== 7) throw new Error(`COURXX${id}: expected 7 ship columns`);
  const ships: ScenarioShip[] = course.ships.map((s) => {
    if (s.waypoints.length !== 7) throw new Error(`COURXX${id}: ship ${s.index} needs 7 waypoints`);
    return {
      // File column j is stored in array slot j + 2 (loader loops FOR K = 2 TO 8, Gato1.exe 0x0bee5-0x0c0cc).
      slot: SLOT.tender + s.index,
      typeCode: s.type_code,
      start: { x: s.start.x, y: s.start.y },
      waypoints: s.waypoints.map((w) => ({ x: w.x, y: w.y, speed: w.speed_knots })),
    };
  });
  const islands: IslandRecord[] = [{ quadrant: 0, present: false, x: 0, y: 0, innerRadius: 0, outerRadius: 0, shape: 0, drawScale: 0 }];
  for (const q of mxp.quadrants) {
    islands[q.quadrant] = {
      quadrant: q.quadrant,
      present: q.has_island,
      x: q.center_x ?? -1,
      y: q.center_y ?? -1,
      innerRadius: q.radius_inner ?? 1,
      outerRadius: q.radius_outer ?? 1,
      shape: q.attr_5 ?? 0,
      drawScale: q.attr_6 ?? 0,
    };
  }
  return {
    id,
    orders,
    ships,
    objectives: {
      objectiveQuadrant: course.trailer.objective_quadrant,
      requiredTimeOfDay: course.trailer.flag_b,
      lastConvoySlot: course.trailer.value_c,
    },
    islands,
  };
}

/** Scenario number picked at the start of a mission: 1 + FIX(RND*20) (Gato1.exe 0x0bb10). */
export function pickScenarioId(random: number): number {
  return 1 + Math.floor(random * 20);
}

/** quadrant = 1 + INT(x/5000) + 5*INT(y/5000) (Gato1.exe 0x0c6c8-0x0c710; the original multiplies by the constant 0.0002). */
export function quadrantOf(x: number, y: number): number {
  return 1 + Math.trunc(x / 5000) + 5 * Math.trunc(y / 5000);
}
