import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ssbu-roll-sfx";

let ctx: AudioContext | null = null;
let enabled = true;
const listeners = new Set<() => void>();

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

if (typeof window !== "undefined") {
  enabled = readStored();
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export function unlockRollSound(): void {
  const ac = getCtx();
  if (ac && ac.state === "suspended") void ac.resume();
}

export function getRollSfxEnabled(): boolean {
  return enabled;
}

export function setRollSfxEnabled(value: boolean): void {
  enabled = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

export function useRollSfxEnabled(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => enabled,
    () => true,
  );
}

/** Soft slot-style tick. Quieter and lower as the reel slows. */
export function playRollTick(progress: number, intensity = 1): void {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const t = ac.currentTime;
  const dur = 0.038;
  const frames = Math.max(64, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 820 - progress * 280 + Math.random() * 40;
  filter.Q.value = 1.8;
  const gain = ac.createGain();
  const vol = 0.048 * intensity * (1 - progress * 0.4);
  gain.gain.setValueAtTime(Math.max(0.012 * intensity, vol), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + dur + 0.01);
}

/** Quiet two-note lock-in when the reel stops. */
export function playRollLock(intensity = 1): void {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const t = ac.currentTime;
  const notes = [392, 523.25];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    const start = t + i * 0.055;
    const peak = 0.055 * intensity;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
    osc.connect(filter).connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.28);
  });
}
