/** Colours of the enhanced graphics: natural tones for the sea, the sky, the ships and the instruments. */

export function parseHex(color: string): [number, number, number] {
  const h = color.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function toHex(r: number, g: number, b: number): string {
  const c = (v: number): string => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Blend of two colours: 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

export const lighten = (color: string, amount: number): string => mix(color, "#ffffff", amount);
export const darken = (color: string, amount: number): string => mix(color, "#000000", amount);

export function rgba(color: string, alpha: number): string {
  const [r, g, b] = parseHex(color);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** The scope: sky and sea by day and by night. */
export const SCOPE = {
  day: {
    skyTop: "#2f6db0",
    skyMid: "#76aee0",
    skyHorizon: "#d3e7f3",
    seaHorizon: "#3b7f97",
    seaNear: "#0f4560",
    seaDeep: "#082a3d",
    wave: "#bfe3ee",
    haze: "#d3e7f3",
  },
  night: {
    skyTop: "#01030a",
    skyMid: "#06122a",
    skyHorizon: "#1a2b46",
    seaHorizon: "#0b1a2c",
    seaNear: "#040b16",
    seaDeep: "#02060c",
    wave: "#6b88b0",
    haze: "#1a2b46",
  },
} as const;

/** Hull colours by role: the subtender white, merchants and tankers rust red, warships battleship grey (the troop carrier a buff merchant). */
export const SHIP_HULL: Record<number, string> = {
  3: "#e7e4d6", // subtender
  4: "#a4492f", // freighter
  5: "#7f342f", // tanker
  6: "#a76a3d", // troop carrier
  7: "#93a0a9", // patrol boat
  8: "#7a8791", // destroyer
};

export const ISLAND = { top: "#77a64e", bottom: "#2f5a2b", shore: "#d2bd7c" } as const;

/** Instruments (radar, chart, map). */
export const INSTRUMENT = {
  frame: "#b79a54",
  frameDark: "#6b5a2e",
  panel: "#0d1411",
  panelText: "#bfe8c8",
  label: "#d7c58a",
  radarBg: "#0b2814",
  radarBgEdge: "#030c06",
  radarLine: "#2f9a52",
  radarSweep: "#6dff9a",
  blip: "#8dffb0",
  chartSeaTop: "#17566e",
  chartSeaBottom: "#0b3348",
  mapSeaTop: "#123a66",
  mapSeaBottom: "#08203e",
  grid: "#9fc7d6",
  tick: "#e0cf8f",
  enemy: "#ff6a5a",
  tender: "#6dff9a",
  boat: "#ffffff",
} as const;
