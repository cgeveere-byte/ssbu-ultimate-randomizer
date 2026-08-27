import { ROSTER, WEIGHT_MAP } from "./roster";
import { type WeightMap, defaultWeights } from "./profiles";

export type QuizChoice = "left" | "right" | "neither" | "skip";

export interface QuizRating {
  mu: number;
  games: number;
  wins: number;
  neverVotes: number;
}

export interface QuizPair {
  left: string;
  right: string;
}

export interface QuizState {
  ratings: Record<string, QuizRating>;
  compared: string[];
  pair: QuizPair | null;
  champion: string | null;
  streak: number;
  matchups: number;
}

const START_MU = 1500;
const K = 40;
const MAX_STREAK = 5;
const PAIR_SEP = "\0";

export function emptyRating(): QuizRating {
  return { mu: START_MU, games: 0, wins: 0, neverVotes: 0 };
}

export function createQuizState(): QuizState {
  const ratings: Record<string, QuizRating> = {};
  for (const f of ROSTER) ratings[f.id] = emptyRating();
  const state: QuizState = {
    ratings,
    compared: [],
    pair: null,
    champion: null,
    streak: 0,
    matchups: 0,
  };
  state.pair = nextPair(state);
  return state;
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}${PAIR_SEP}${b}` : `${b}${PAIR_SEP}${a}`;
}

function shuffle<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = out[i]!;
    out[i] = out[j]!;
    out[j] = t;
  }
  return out;
}

function expected(a: number, b: number): number {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

function applyWin(winner: QuizRating, loser: QuizRating): void {
  const exp = expected(winner.mu, loser.mu);
  const kW = K / (1 + winner.games * 0.06);
  const kL = K / (1 + loser.games * 0.06);
  winner.mu += kW * (1 - exp);
  loser.mu -= kL * (1 - exp);
  winner.games += 1;
  loser.games += 1;
  winner.wins += 1;
}

function seenSet(compared: readonly string[]): Set<string> {
  return new Set(compared);
}

export function nextPair(state: QuizState): QuizPair | null {
  const ids = ROSTER.map((f) => f.id);
  const seen = seenSet(state.compared);
  const unseen = ids.filter((id) => state.ratings[id]!.games === 0);
  const champ = state.champion;

  const tryPair = (a: string, b: string): QuizPair | null => {
    if (a === b) return null;
    if (seen.has(pairKey(a, b))) return null;
    return { left: a, right: b };
  };

  if (champ && state.streak < MAX_STREAK) {
    const fresh = shuffle(unseen.filter((id) => id !== champ));
    for (const id of fresh) {
      const p = tryPair(champ, id);
      if (p) return p;
    }
    const others = ids
      .filter((id) => id !== champ)
      .sort((a, b) => {
        const da = Math.abs(state.ratings[a]!.mu - state.ratings[champ]!.mu);
        const db = Math.abs(state.ratings[b]!.mu - state.ratings[champ]!.mu);
        const ga = state.ratings[a]!.games;
        const gb = state.ratings[b]!.games;
        return ga - gb || da - db;
      });
    for (const id of others) {
      const p = tryPair(champ, id);
      if (p) return p;
    }
  }

  if (unseen.length >= 2) {
    const mixed = shuffle(unseen);
    return { left: mixed[0]!, right: mixed[1]! };
  }

  if (unseen.length === 1) {
    const only = unseen[0]!;
    const opp = ids
      .filter((id) => id !== only)
      .sort((a, b) => state.ratings[a]!.games - state.ratings[b]!.games)[0];
    if (opp) {
      const p = tryPair(only, opp);
      if (p) return p;
    }
  }

  const ranked = ids.slice().sort((a, b) => state.ratings[b]!.mu - state.ratings[a]!.mu);
  for (let i = 0; i < ranked.length - 1; i++) {
    const p = tryPair(ranked[i]!, ranked[i + 1]!);
    if (p) return p;
  }
  for (let i = 0; i < ranked.length; i++) {
    for (let j = i + 2; j < ranked.length; j++) {
      const p = tryPair(ranked[i]!, ranked[j]!);
      if (p) return p;
    }
  }
  return null;
}

export function applyChoice(state: QuizState, choice: QuizChoice): QuizState {
  const pair = state.pair;
  if (!pair) return state;
  const ratings: Record<string, QuizRating> = {};
  for (const id of Object.keys(state.ratings)) {
    ratings[id] = { ...state.ratings[id]! };
  }
  const left = ratings[pair.left]!;
  const right = ratings[pair.right]!;
  let champion = state.champion;
  let streak = state.streak;
  let compared = state.compared;
  let matchups = state.matchups;

  if (choice === "skip") {
    compared = [...compared, pairKey(pair.left, pair.right)];
    champion = null;
    streak = 0;
  } else if (choice === "neither") {
    left.neverVotes += 1;
    right.neverVotes += 1;
    left.mu -= 18;
    right.mu -= 18;
    left.games += 1;
    right.games += 1;
    compared = [...compared, pairKey(pair.left, pair.right)];
    matchups += 1;
    champion = null;
    streak = 0;
  } else {
    const winId = choice === "left" ? pair.left : pair.right;
    const loseId = choice === "left" ? pair.right : pair.left;
    applyWin(ratings[winId]!, ratings[loseId]!);
    compared = [...compared, pairKey(pair.left, pair.right)];
    matchups += 1;
    if (champion === winId) streak += 1;
    else {
      champion = winId;
      streak = 1;
    }
  }

  const next: QuizState = {
    ratings,
    compared,
    pair: null,
    champion,
    streak,
    matchups,
  };
  next.pair = nextPair(next);
  if (next.pair && Math.random() < 0.5) {
    next.pair = { left: next.pair.right, right: next.pair.left };
  }
  return next;
}

/** 0–1 how settled the ranking is. */
export function quizClarity(state: QuizState): number {
  const played = ROSTER.filter((f) => state.ratings[f.id]!.games > 0);
  if (played.length < 2) return 0;
  const coverage = played.length / ROSTER.length;
  const avgGames =
    played.reduce((s, f) => s + state.ratings[f.id]!.games, 0) / played.length;
  const gamesPart = Math.min(1, avgGames / 3);
  const mus = played.map((f) => state.ratings[f.id]!.mu);
  const mean = mus.reduce((s, n) => s + n, 0) / mus.length;
  const variance = mus.reduce((s, n) => s + (n - mean) ** 2, 0) / mus.length;
  const spread = Math.min(1, Math.sqrt(variance) / 180);
  return Math.max(0, Math.min(1, 0.4 * coverage + 0.3 * gamesPart + 0.3 * spread));
}

export function rankedQuizFighters(state: QuizState): { id: string; rating: QuizRating }[] {
  return ROSTER.map((f) => ({ id: f.id, rating: state.ratings[f.id]! })).sort((a, b) => {
    if (b.rating.mu !== a.rating.mu) return b.rating.mu - a.rating.mu;
    return b.rating.wins - a.rating.wins;
  });
}

export function ratingsToWeights(state: QuizState): WeightMap {
  const weights = defaultWeights();
  const played = rankedQuizFighters(state).filter((r) => r.rating.games > 0);
  if (played.length === 0) return weights;

  const n = played.length;
  for (let i = 0; i < n; i++) {
    const row = played[i]!;
    const pct = n === 1 ? 1 : 1 - i / (n - 1);
    if (row.rating.neverVotes >= 2 && row.rating.wins === 0) {
      weights[row.id] = WEIGHT_MAP.never;
      continue;
    }
    if (pct >= 0.88) weights[row.id] = WEIGHT_MAP.favorite;
    else if (pct >= 0.68) weights[row.id] = WEIGHT_MAP.often;
    else if (pct >= 0.38) weights[row.id] = WEIGHT_MAP.normal;
    else if (pct >= 0.16) weights[row.id] = WEIGHT_MAP.rare;
    else weights[row.id] = WEIGHT_MAP.never;
  }
  return weights;
}

export function quizTierCounts(weights: WeightMap): {
  favorite: number;
  often: number;
  normal: number;
  rare: number;
  never: number;
} {
  const out = { favorite: 0, often: 0, normal: 0, rare: 0, never: 0 };
  for (const f of ROSTER) {
    const w = weights[f.id] ?? 1;
    if (w >= WEIGHT_MAP.favorite) out.favorite += 1;
    else if (w >= WEIGHT_MAP.often) out.often += 1;
    else if (w <= 0) out.never += 1;
    else if (w <= WEIGHT_MAP.rare) out.rare += 1;
    else out.normal += 1;
  }
  return out;
}
