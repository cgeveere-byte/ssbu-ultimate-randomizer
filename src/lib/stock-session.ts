import { ROSTER } from "./roster";

/** Smash Ultimate default 1v1. */
export const STOCKS_PER_GAME = 3;
export const MATCH_TIMER_SECONDS = 7 * 60;

export interface StockGame {
  id: string;
  at: number;
  p1FighterId: string;
  p2FighterId: string;
  /** Remaining stocks after the game (0–3). */
  p1Stocks: number;
  p2Stocks: number;
  timedOut: boolean;
}

export interface MatchupStat {
  myFighterId: string;
  theirFighterId: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  /** Sum of (my remaining − their remaining). */
  stockDiff: number;
}

export function clampStocks(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(STOCKS_PER_GAME, Math.max(0, Math.round(n)));
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function fighterLabel(id: string): string {
  return ROSTER.find((f) => f.id === id)?.name ?? id;
}

/** 0 = P1, 1 = P2, null = draw (same stocks). */
export function winnerOf(game: StockGame): 0 | 1 | null {
  if (game.p1Stocks > game.p2Stocks) return 0;
  if (game.p2Stocks > game.p1Stocks) return 1;
  return null;
}

export function setScore(games: StockGame[]): {
  p1: number;
  p2: number;
  draws: number;
} {
  let p1 = 0;
  let p2 = 0;
  let draws = 0;
  for (const g of games) {
    const w = winnerOf(g);
    if (w === 0) p1 += 1;
    else if (w === 1) p2 += 1;
    else draws += 1;
  }
  return { p1, p2, draws };
}

export function matchupStats(
  games: StockGame[],
  playerIndex: 0 | 1,
): MatchupStat[] {
  const map = new Map<string, MatchupStat>();
  for (const g of games) {
    const myId = playerIndex === 0 ? g.p1FighterId : g.p2FighterId;
    const theirId = playerIndex === 0 ? g.p2FighterId : g.p1FighterId;
    const myStocks = playerIndex === 0 ? g.p1Stocks : g.p2Stocks;
    const theirStocks = playerIndex === 0 ? g.p2Stocks : g.p1Stocks;
    const key = `${myId}__${theirId}`;
    const cur = map.get(key) ?? {
      myFighterId: myId,
      theirFighterId: theirId,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      stockDiff: 0,
    };
    cur.games += 1;
    cur.stockDiff += myStocks - theirStocks;
    if (myStocks > theirStocks) cur.wins += 1;
    else if (myStocks < theirStocks) cur.losses += 1;
    else cur.draws += 1;
    map.set(key, cur);
  }
  return [...map.values()];
}

function rank(a: MatchupStat, b: MatchupStat): number {
  if (b.stockDiff !== a.stockDiff) return b.stockDiff - a.stockDiff;
  const aRate = a.games ? (a.wins - a.losses) / a.games : 0;
  const bRate = b.games ? (b.wins - b.losses) / b.games : 0;
  if (bRate !== aRate) return bRate - aRate;
  return b.games - a.games;
}

export function bestAndWorst(
  games: StockGame[],
  playerIndex: 0 | 1,
): { best: MatchupStat | null; worst: MatchupStat | null } {
  const list = matchupStats(games, playerIndex).sort(rank);
  if (list.length === 0) return { best: null, worst: null };
  if (list.length === 1) return { best: list[0], worst: list[0] };
  return { best: list[0], worst: list[list.length - 1] };
}

export function formatMatchup(stat: MatchupStat): string {
  return `${fighterLabel(stat.myFighterId)} vs ${fighterLabel(stat.theirFighterId)}`;
}

export function formatMatchupRecord(stat: MatchupStat): string {
  const sign = stat.stockDiff > 0 ? "+" : "";
  return `${stat.wins}–${stat.losses}${stat.draws ? `–${stat.draws}` : ""} · ${sign}${stat.stockDiff} stock`;
}
