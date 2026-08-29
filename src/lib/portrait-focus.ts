import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ssbu-portrait-focus";
/** Default eye line for bust shots. Lower = more forehead; higher = more chest. */
export const DEFAULT_PORTRAIT_FOCUS_Y = 22;
const MIN_Y = 0;
const MAX_Y = 100;

let map: Record<string, number> = {};
let epoch = 0;
const listeners = new Set<() => void>();

function clampY(y: number): number {
  return Math.round(Math.min(MAX_Y, Math.max(MIN_Y, y)));
}

function readStored(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const next: Record<string, number> = {};
    for (const [id, y] of Object.entries(parsed)) {
      if (typeof y === "number" && Number.isFinite(y)) next[id] = clampY(y);
    }
    return next;
  } catch {
    return {};
  }
}

if (typeof window !== "undefined") {
  map = readStored();
}

function emit() {
  epoch += 1;
  listeners.forEach((fn) => fn());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getPortraitFocusY(id: string): number {
  return map[id] ?? DEFAULT_PORTRAIT_FOCUS_Y;
}

export function setPortraitFocusY(id: string, y: number): void {
  const next = clampY(y);
  if (next === DEFAULT_PORTRAIT_FOCUS_Y) {
    if (!(id in map)) return;
    delete map[id];
  } else {
    if (map[id] === next) return;
    map[id] = next;
  }
  persist();
  emit();
}

export function resetPortraitFocusY(id: string): void {
  if (!(id in map)) return;
  delete map[id];
  persist();
  emit();
}

export function hasCustomPortraitFocus(id: string): boolean {
  return id in map;
}

export function getPortraitFocusOverrides(): Record<string, number> {
  return { ...map };
}

/** Pasteable dump for hard-coding later. Only custom (non-default) eye lines. */
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

export function portraitObjectPosition(id: string): string {
  return `50% ${getPortraitFocusY(id)}%`;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePortraitFocusY(id: string): number {
  return useSyncExternalStore(
    subscribe,
    () => getPortraitFocusY(id),
    () => DEFAULT_PORTRAIT_FOCUS_Y,
  );
}

export function usePortraitFocusEpoch(): number {
  return useSyncExternalStore(subscribe, () => epoch, () => 0);
}
