import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ssbu-portrait-focus";
/** Fallback when a fighter has no built-in line (new art, missing id). */
export const DEFAULT_PORTRAIT_FOCUS_Y = 22;
const MIN_Y = 0;
const MAX_Y = 100;

/**
 * Eye lines for the current `public/portraits/{id}.webp` files.
 * Gallery tweaks persist in localStorage and win until Reset.
 *
 * When replacing a portrait file:
 *   1. Delete that id from this map (falls back to 22 until retuned).
 *   2. Bump `PORTRAIT_ART_GEN[id]` so stale Gallery overrides are dropped.
 */
export const BUILT_IN_PORTRAIT_FOCUS_Y: Readonly<Record<string, number>> = {
  mario: 46,
  "donkey-kong": 34,
  link: 40,
  samus: 39,
  "dark-samus": 39,
  yoshi: 44,
  kirby: 65,
  fox: 41,
  pikachu: 54,
  luigi: 46,
  ness: 47,
  "captain-falcon": 46,
  jigglypuff: 54,
  peach: 58,
  daisy: 53,
  bowser: 45,
  "ice-climbers": 51,
  sheik: 52,
  zelda: 39,
  "dr-mario": 44,
  pichu: 57,
  falco: 33,
  marth: 32,
  lucina: 46,
  "young-link": 41,
  ganondorf: 38,
  mewtwo: 50,
  roy: 30,
  chrom: 36,
  "mr-game-watch": 47,
  "meta-knight": 39,
  pit: 47,
  "dark-pit": 55,
  "zero-suit-samus": 39,
  wario: 42,
  snake: 39,
  ike: 47,
  "pokemon-trainer": 36,
  "diddy-kong": 58,
  lucas: 45,
  sonic: 36,
  "king-dedede": 48,
  olimar: 37,
  lucario: 53,
  rob: 40,
  "toon-link": 58,
  wolf: 30,
  villager: 49,
  "mega-man": 31,
  "wii-fit-trainer": 39,
  rosalina: 36,
  "little-mac": 43,
  greninja: 36,
  "mii-brawler": 44,
  "mii-swordfighter": 57,
  "mii-gunner": 44,
  palutena: 34,
  "pac-man": 46,
  robin: 32,
  shulk: 29,
  "bowser-jr": 39,
  "duck-hunt": 49,
  ryu: 39,
  ken: 35,
  cloud: 47,
  corrin: 50,
  bayonetta: 30,
  inkling: 51,
  ridley: 38,
  simon: 31,
  richter: 26,
  "king-k-rool": 39,
  isabelle: 41,
  incineroar: 37,
  "piranha-plant": 51,
  joker: 51,
  hero: 33,
  "banjo-kazooie": 61,
  terry: 24,
  byleth: 29,
  "min-min": 32,
  steve: 34,
  sephiroth: 26,
  "pyra-mythra": 38,
  kazuya: 36,
  sora: 45,
};

/**
 * Art generation per fighter. Missing id = 1.
 * Bump when `public/portraits/{id}.webp` is replaced so old localStorage
 * tweaks for that fighter are discarded.
 */
export const PORTRAIT_ART_GEN: Readonly<Record<string, number>> = {
  "king-k-rool": 2,
};

function artGen(id: string): number {
  return PORTRAIT_ART_GEN[id] ?? 1;
}

let map: Record<string, number> = {};
let storedGen: Record<string, number> = {};
let epoch = 0;
const listeners = new Set<() => void>();

function clampY(y: number): number {
  return Math.round(Math.min(MAX_Y, Math.max(MIN_Y, y)));
}

export function getBuiltInPortraitFocusY(id: string): number {
  return BUILT_IN_PORTRAIT_FOCUS_Y[id] ?? DEFAULT_PORTRAIT_FOCUS_Y;
}

function readStored(): { y: Record<string, number>; gen: Record<string, number> } {
  const empty = { y: {} as Record<string, number>, gen: {} as Record<string, number> };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return empty;

    const rec = parsed as Record<string, unknown>;
    let yRaw: Record<string, unknown>;
    let genRaw: Record<string, unknown>;
    if (rec.v === 2 && rec.y && typeof rec.y === "object" && !Array.isArray(rec.y)) {
      yRaw = rec.y as Record<string, unknown>;
      genRaw =
        rec.gen && typeof rec.gen === "object" && !Array.isArray(rec.gen)
          ? (rec.gen as Record<string, unknown>)
          : {};
    } else {
      yRaw = rec;
      genRaw = {};
    }

    const y: Record<string, number> = {};
    const gen: Record<string, number> = {};
    for (const [id, value] of Object.entries(yRaw)) {
      if (id === "v" || id === "y" || id === "gen") continue;
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const g = typeof genRaw[id] === "number" ? (genRaw[id] as number) : 1;
      if (g < artGen(id)) continue;
      const next = clampY(value);
      if (next === getBuiltInPortraitFocusY(id)) continue;
      y[id] = next;
      gen[id] = g;
    }
    return { y, gen };
  } catch {
    return empty;
  }
}

if (typeof window !== "undefined") {
  const stored = readStored();
  map = stored.y;
  storedGen = stored.gen;
}

function emit() {
  epoch += 1;
  listeners.forEach((fn) => fn());
}

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: 2, y: map, gen: storedGen }),
    );
  } catch {
    /* ignore */
  }
}

export function getPortraitFocusY(id: string): number {
  return map[id] ?? getBuiltInPortraitFocusY(id);
}

export function setPortraitFocusY(id: string, y: number): void {
  const next = clampY(y);
  const builtIn = getBuiltInPortraitFocusY(id);
  if (next === builtIn) {
    if (!(id in map)) return;
    delete map[id];
    delete storedGen[id];
  } else {
    if (map[id] === next) return;
    map[id] = next;
    storedGen[id] = artGen(id);
  }
  persist();
  emit();
}

export function resetPortraitFocusY(id: string): void {
  if (!(id in map)) return;
  delete map[id];
  delete storedGen[id];
  persist();
  emit();
}

export function hasCustomPortraitFocus(id: string): boolean {
  return id in map;
}

export function getPortraitFocusOverrides(): Record<string, number> {
  return { ...map };
}

/** Pasteable dump of Gallery tweaks (not the shipped built-ins). */
export function formatPortraitFocusDump(): string {
  const ids = Object.keys(map).sort();
  const json: Record<string, number> = {};
  const lines: string[] = ["ssbu-portrait-focus"];
  for (const id of ids) {
    json[id] = map[id];
    lines.push(`${id} ${map[id]}`);
  }
  lines.push(JSON.stringify(json));
  return lines.join("\n");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePortraitFocusY(id: string): number {
  return useSyncExternalStore(
    subscribe,
    () => getPortraitFocusY(id),
    () => getBuiltInPortraitFocusY(id),
  );
}

export function usePortraitFocusEpoch(): number {
  return useSyncExternalStore(subscribe, () => epoch, () => 0);
}
