/** Smash-style player slot colors (1-indexed). */
export const PLAYER_COLORS = [
  { id: 1, name: "red", hex: "#ef4444", soft: "rgba(239, 68, 68, 0.16)", ring: "rgba(239, 68, 68, 0.55)" },
  { id: 2, name: "blue", hex: "#3b82f6", soft: "rgba(59, 130, 246, 0.16)", ring: "rgba(59, 130, 246, 0.55)" },
  { id: 3, name: "yellow", hex: "#eab308", soft: "rgba(234, 179, 8, 0.16)", ring: "rgba(234, 179, 8, 0.55)" },
  { id: 4, name: "green", hex: "#22c55e", soft: "rgba(34, 197, 94, 0.16)", ring: "rgba(34, 197, 94, 0.55)" },
  { id: 5, name: "orange", hex: "#f97316", soft: "rgba(249, 115, 22, 0.16)", ring: "rgba(249, 115, 22, 0.55)" },
  { id: 6, name: "cyan", hex: "#06b6d4", soft: "rgba(6, 182, 212, 0.16)", ring: "rgba(6, 182, 212, 0.55)" },
  { id: 7, name: "magenta", hex: "#ec4899", soft: "rgba(236, 72, 153, 0.16)", ring: "rgba(236, 72, 153, 0.55)" },
  { id: 8, name: "purple", hex: "#a855f7", soft: "rgba(168, 85, 247, 0.16)", ring: "rgba(168, 85, 247, 0.55)" },
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];

/** 0-based player index → color (clamped 0–7). */
export function playerColor(index: number): PlayerColor {
  const i = Math.min(7, Math.max(0, Math.floor(index)));
  return PLAYER_COLORS[i];
}

/** Text color for badges on colored backgrounds (yellow needs dark). */
export function playerBadgeFg(index: number): string {
  const c = playerColor(index);
  return c.name === "yellow" ? "#1a1a0a" : "#0a0a0b";
}
