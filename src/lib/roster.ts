export type SeriesId =
  | "mario"
  | "donkey-kong"
  | "zelda"
  | "metroid"
  | "yoshi"
  | "kirby"
  | "star-fox"
  | "pokemon"
  | "earthbound"
  | "f-zero"
  | "ice-climber"
  | "fire-emblem"
  | "game-watch"
  | "kid-icarus"
  | "wario"
  | "metal-gear"
  | "sonic"
  | "pikmin"
  | "robot"
  | "animal-crossing"
  | "mega-man"
  | "wii-fit"
  | "punch-out"
  | "xenoblade"
  | "duck-hunt"
  | "street-fighter"
  | "final-fantasy"
  | "bayonetta"
  | "splatoon"
  | "castlevania"
  | "persona"
  | "dragon-quest"
  | "banjo"
  | "fatal-fury"
  | "arms"
  | "minecraft"
  | "tekken"
  | "kingdom-hearts"
  | "mii"
  | "other";

export interface Fighter {
  id: string;
  name: string;
  series: SeriesId;
  seriesLabel: string;
  number: number;
  dlc?: boolean;
  echo?: boolean;
}

/** Full Super Smash Bros. Ultimate roster (86 selectable fighters). */
export const ROSTER: Fighter[] = [
  { id: "mario", name: "Mario", series: "mario", seriesLabel: "Super Mario", number: 1 },
  { id: "donkey-kong", name: "Donkey Kong", series: "donkey-kong", seriesLabel: "Donkey Kong", number: 2 },
  { id: "link", name: "Link", series: "zelda", seriesLabel: "The Legend of Zelda", number: 3 },
  { id: "samus", name: "Samus", series: "metroid", seriesLabel: "Metroid", number: 4 },
  { id: "dark-samus", name: "Dark Samus", series: "metroid", seriesLabel: "Metroid", number: 4.1, echo: true },
  { id: "yoshi", name: "Yoshi", series: "yoshi", seriesLabel: "Yoshi", number: 5 },
  { id: "kirby", name: "Kirby", series: "kirby", seriesLabel: "Kirby", number: 6 },
  { id: "fox", name: "Fox", series: "star-fox", seriesLabel: "Star Fox", number: 7 },
  { id: "pikachu", name: "Pikachu", series: "pokemon", seriesLabel: "Pokémon", number: 8 },
  { id: "luigi", name: "Luigi", series: "mario", seriesLabel: "Super Mario", number: 9 },
  { id: "ness", name: "Ness", series: "earthbound", seriesLabel: "EarthBound", number: 10 },
  { id: "captain-falcon", name: "Captain Falcon", series: "f-zero", seriesLabel: "F-Zero", number: 11 },
  { id: "jigglypuff", name: "Jigglypuff", series: "pokemon", seriesLabel: "Pokémon", number: 12 },
  { id: "peach", name: "Peach", series: "mario", seriesLabel: "Super Mario", number: 13 },
  { id: "daisy", name: "Daisy", series: "mario", seriesLabel: "Super Mario", number: 13.1, echo: true },
  { id: "bowser", name: "Bowser", series: "mario", seriesLabel: "Super Mario", number: 14 },
  { id: "ice-climbers", name: "Ice Climbers", series: "ice-climber", seriesLabel: "Ice Climber", number: 15 },
  { id: "sheik", name: "Sheik", series: "zelda", seriesLabel: "The Legend of Zelda", number: 16 },
  { id: "zelda", name: "Zelda", series: "zelda", seriesLabel: "The Legend of Zelda", number: 17 },
  { id: "dr-mario", name: "Dr. Mario", series: "mario", seriesLabel: "Super Mario", number: 18 },
  { id: "pichu", name: "Pichu", series: "pokemon", seriesLabel: "Pokémon", number: 19 },
  { id: "falco", name: "Falco", series: "star-fox", seriesLabel: "Star Fox", number: 20 },
  { id: "marth", name: "Marth", series: "fire-emblem", seriesLabel: "Fire Emblem", number: 21 },
  { id: "lucina", name: "Lucina", series: "fire-emblem", seriesLabel: "Fire Emblem", number: 21.1, echo: true },
  { id: "young-link", name: "Young Link", series: "zelda", seriesLabel: "The Legend of Zelda", number: 22 },
  { id: "ganondorf", name: "Ganondorf", series: "zelda", seriesLabel: "The Legend of Zelda", number: 23 },
  { id: "mewtwo", name: "Mewtwo", series: "pokemon", seriesLabel: "Pokémon", number: 24 },
  { id: "roy", name: "Roy", series: "fire-emblem", seriesLabel: "Fire Emblem", number: 25 },
  { id: "chrom", name: "Chrom", series: "fire-emblem", seriesLabel: "Fire Emblem", number: 25.1, echo: true },
  { id: "mr-game-watch", name: "Mr. Game & Watch", series: "game-watch", seriesLabel: "Game & Watch", number: 26 },
  { id: "meta-knight", name: "Meta Knight", series: "kirby", seriesLabel: "Kirby", number: 27 },
  { id: "pit", name: "Pit", series: "kid-icarus", seriesLabel: "Kid Icarus", number: 28 },
  { id: "dark-pit", name: "Dark Pit", series: "kid-icarus", seriesLabel: "Kid Icarus", number: 28.1, echo: true },
  { id: "zero-suit-samus", name: "Zero Suit Samus", series: "metroid", seriesLabel: "Metroid", number: 29 },
  { id: "wario", name: "Wario", series: "wario", seriesLabel: "Wario", number: 30 },
  { id: "snake", name: "Snake", series: "metal-gear", seriesLabel: "Metal Gear", number: 31 },
  { id: "ike", name: "Ike", series: "fire-emblem", seriesLabel: "Fire Emblem", number: 32 },
  { id: "pokemon-trainer", name: "Pokémon Trainer", series: "pokemon", seriesLabel: "Pokémon", number: 33 },
  { id: "diddy-kong", name: "Diddy Kong", series: "donkey-kong", seriesLabel: "Donkey Kong", number: 36 },
  { id: "lucas", name: "Lucas", series: "earthbound", seriesLabel: "EarthBound", number: 37 },
  { id: "sonic", name: "Sonic", series: "sonic", seriesLabel: "Sonic", number: 38 },
  { id: "king-dedede", name: "King Dedede", series: "kirby", seriesLabel: "Kirby", number: 39 },
  { id: "olimar", name: "Olimar", series: "pikmin", seriesLabel: "Pikmin", number: 40 },
  { id: "lucario", name: "Lucario", series: "pokemon", seriesLabel: "Pokémon", number: 41 },
  { id: "rob", name: "R.O.B.", series: "robot", seriesLabel: "R.O.B.", number: 42 },
  { id: "toon-link", name: "Toon Link", series: "zelda", seriesLabel: "The Legend of Zelda", number: 43 },
  { id: "wolf", name: "Wolf", series: "star-fox", seriesLabel: "Star Fox", number: 44 },
  { id: "villager", name: "Villager", series: "animal-crossing", seriesLabel: "Animal Crossing", number: 45 },
  { id: "mega-man", name: "Mega Man", series: "mega-man", seriesLabel: "Mega Man", number: 46 },
  { id: "wii-fit-trainer", name: "Wii Fit Trainer", series: "wii-fit", seriesLabel: "Wii Fit", number: 47 },
  { id: "rosalina", name: "Rosalina & Luma", series: "mario", seriesLabel: "Super Mario", number: 48 },
  { id: "little-mac", name: "Little Mac", series: "punch-out", seriesLabel: "Punch-Out!!", number: 49 },
  { id: "greninja", name: "Greninja", series: "pokemon", seriesLabel: "Pokémon", number: 50 },
  { id: "mii-brawler", name: "Mii Brawler", series: "mii", seriesLabel: "Mii", number: 51 },
  { id: "mii-swordfighter", name: "Mii Swordfighter", series: "mii", seriesLabel: "Mii", number: 52 },
  { id: "mii-gunner", name: "Mii Gunner", series: "mii", seriesLabel: "Mii", number: 53 },
  { id: "palutena", name: "Palutena", series: "kid-icarus", seriesLabel: "Kid Icarus", number: 54 },
  { id: "pac-man", name: "Pac-Man", series: "other", seriesLabel: "Pac-Man", number: 55 },
  { id: "robin", name: "Robin", series: "fire-emblem", seriesLabel: "Fire Emblem", number: 56 },
  { id: "shulk", name: "Shulk", series: "xenoblade", seriesLabel: "Xenoblade", number: 57 },
  { id: "bowser-jr", name: "Bowser Jr.", series: "mario", seriesLabel: "Super Mario", number: 58 },
  { id: "duck-hunt", name: "Duck Hunt", series: "duck-hunt", seriesLabel: "Duck Hunt", number: 59 },
  { id: "ryu", name: "Ryu", series: "street-fighter", seriesLabel: "Street Fighter", number: 60 },
  { id: "ken", name: "Ken", series: "street-fighter", seriesLabel: "Street Fighter", number: 60.1, echo: true },
  { id: "cloud", name: "Cloud", series: "final-fantasy", seriesLabel: "Final Fantasy", number: 61 },
  { id: "corrin", name: "Corrin", series: "fire-emblem", seriesLabel: "Fire Emblem", number: 62 },
  { id: "bayonetta", name: "Bayonetta", series: "bayonetta", seriesLabel: "Bayonetta", number: 63 },
  { id: "inkling", name: "Inkling", series: "splatoon", seriesLabel: "Splatoon", number: 64 },
  { id: "ridley", name: "Ridley", series: "metroid", seriesLabel: "Metroid", number: 65 },
  { id: "simon", name: "Simon", series: "castlevania", seriesLabel: "Castlevania", number: 66 },
  { id: "richter", name: "Richter", series: "castlevania", seriesLabel: "Castlevania", number: 66.1, echo: true },
  { id: "king-k-rool", name: "King K. Rool", series: "donkey-kong", seriesLabel: "Donkey Kong", number: 67 },
  { id: "isabelle", name: "Isabelle", series: "animal-crossing", seriesLabel: "Animal Crossing", number: 68 },
  { id: "incineroar", name: "Incineroar", series: "pokemon", seriesLabel: "Pokémon", number: 69 },
  { id: "piranha-plant", name: "Piranha Plant", series: "mario", seriesLabel: "Super Mario", number: 70, dlc: true },
  { id: "joker", name: "Joker", series: "persona", seriesLabel: "Persona", number: 71, dlc: true },
  { id: "hero", name: "Hero", series: "dragon-quest", seriesLabel: "Dragon Quest", number: 72, dlc: true },
  { id: "banjo-kazooie", name: "Banjo & Kazooie", series: "banjo", seriesLabel: "Banjo-Kazooie", number: 73, dlc: true },
  { id: "terry", name: "Terry", series: "fatal-fury", seriesLabel: "Fatal Fury", number: 74, dlc: true },
  { id: "byleth", name: "Byleth", series: "fire-emblem", seriesLabel: "Fire Emblem", number: 75, dlc: true },
  { id: "min-min", name: "Min Min", series: "arms", seriesLabel: "ARMS", number: 76, dlc: true },
  { id: "steve", name: "Steve", series: "minecraft", seriesLabel: "Minecraft", number: 77, dlc: true },
  { id: "sephiroth", name: "Sephiroth", series: "final-fantasy", seriesLabel: "Final Fantasy", number: 78, dlc: true },
  { id: "pyra-mythra", name: "Pyra / Mythra", series: "xenoblade", seriesLabel: "Xenoblade", number: 79, dlc: true },
  { id: "kazuya", name: "Kazuya", series: "tekken", seriesLabel: "Tekken", number: 80, dlc: true },
  { id: "sora", name: "Sora", series: "kingdom-hearts", seriesLabel: "Kingdom Hearts", number: 81, dlc: true },
];

/**
 * Official Ultimate character-select order: 13 per row.
 * Miis sit on the last row with the late DLC (not after Greninja).
 */
export const CSS_COLUMNS = 13;

export const CSS_ROSTER_IDS = [
  "mario",
  "donkey-kong",
  "link",
  "samus",
  "dark-samus",
  "yoshi",
  "kirby",
  "fox",
  "pikachu",
  "luigi",
  "ness",
  "captain-falcon",
  "jigglypuff",
  "peach",
  "daisy",
  "bowser",
  "ice-climbers",
  "sheik",
  "zelda",
  "dr-mario",
  "pichu",
  "falco",
  "marth",
  "lucina",
  "young-link",
  "ganondorf",
  "mewtwo",
  "roy",
  "chrom",
  "mr-game-watch",
  "meta-knight",
  "pit",
  "dark-pit",
  "zero-suit-samus",
  "wario",
  "snake",
  "ike",
  "pokemon-trainer",
  "diddy-kong",
  "lucas",
  "sonic",
  "king-dedede",
  "olimar",
  "lucario",
  "rob",
  "toon-link",
  "wolf",
  "villager",
  "mega-man",
  "wii-fit-trainer",
  "rosalina",
  "little-mac",
  "greninja",
  "palutena",
  "pac-man",
  "robin",
  "shulk",
  "bowser-jr",
  "duck-hunt",
  "ryu",
  "ken",
  "cloud",
  "corrin",
  "bayonetta",
  "inkling",
  "ridley",
  "simon",
  "richter",
  "king-k-rool",
  "isabelle",
  "incineroar",
  "piranha-plant",
  "joker",
  "hero",
  "banjo-kazooie",
  "terry",
  "byleth",
  "min-min",
  "steve",
  "sephiroth",
  "pyra-mythra",
  "kazuya",
  "sora",
  "mii-brawler",
  "mii-swordfighter",
  "mii-gunner",
] as const;

const ROSTER_BY_ID = new Map(ROSTER.map((f) => [f.id, f]));

export const CSS_ROSTER: Fighter[] = CSS_ROSTER_IDS.map((id) => ROSTER_BY_ID.get(id)).filter(
  (f): f is Fighter => Boolean(f),
);

export function cssRosterRows(): Fighter[][] {
  const rows: Fighter[][] = [];
  for (let i = 0; i < CSS_ROSTER.length; i += CSS_COLUMNS) {
    rows.push(CSS_ROSTER.slice(i, i + CSS_COLUMNS));
  }
  return rows;
}

export const SERIES_LIST = Array.from(
  new Map(ROSTER.map((f) => [f.series, f.seriesLabel])).entries(),
)
  .map(([id, label]) => ({ id: id as SeriesId, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

/** Named presets — values are roll multipliers. */
export type WeightPreset = "never" | "rare" | "normal" | "often" | "favorite";

export type WeightLevel = WeightPreset | "custom";

export const WEIGHT_PRESETS: {
  id: WeightPreset;
  label: string;
  short: string;
  multiplier: number;
  description: string;
}[] = [
  { id: "never", label: "Never", short: "Off", multiplier: 0, description: "Excluded from the pool" },
  { id: "rare", label: "Rare", short: "Rare", multiplier: 0.25, description: "Quarter chance" },
  { id: "normal", label: "Normal", short: "Norm", multiplier: 1, description: "Default chance" },
  { id: "often", label: "Often", short: "Often", multiplier: 2, description: "Double chance" },
  { id: "favorite", label: "Favorite", short: "Fav", multiplier: 5, description: "Five times chance" },
];

/** @deprecated use WEIGHT_PRESETS — alias for older imports */
export const WEIGHT_LEVELS = WEIGHT_PRESETS;

export const WEIGHT_MAP = Object.fromEntries(
  WEIGHT_PRESETS.map((w) => [w.id, w.multiplier]),
) as Record<WeightPreset, number>;

const PRESET_BY_VALUE = new Map(
  WEIGHT_PRESETS.map((w) => [w.multiplier, w.id] as const),
);

const PRESET_ORDER: WeightPreset[] = ["never", "rare", "normal", "often", "favorite"];

/** Bump when preset multipliers change so saved profiles can be remapped once. */
export const WEIGHT_PRESET_SCALE = 3;

/** v2 scale: rare 0.5, often 1.5, favorite 2 → current rare 0.25, often 2, favorite 5. */
export function remapLegacyPresetValue(value: number): number {
  const v = clampWeight(value);
  if (Math.abs(v - 2) < 1e-9) return 5;
  if (Math.abs(v - 1.5) < 1e-9) return 2;
  if (Math.abs(v - 0.5) < 1e-9) return 0.25;
  return v;
}

export function remapLegacyWeightMap(
  weights: Record<string, number>,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [id, value] of Object.entries(weights)) {
    next[id] = remapLegacyPresetValue(value);
  }
  return next;
}

export function clampWeight(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(100, Math.round(n * 1000) / 1000);
}

/** Parse a stored weight cell (number, numeric string, or legacy preset name). */
export function parseWeightRaw(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampWeight(raw);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed in WEIGHT_MAP) {
      return WEIGHT_MAP[trimmed as WeightPreset];
    }
    // Custom numeric strings from JSON / form edge cases ("3", "1.5")
    if (trimmed !== "" && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      return clampWeight(Number(trimmed));
    }
  }
  return null;
}

export function getWeightValue(
  weights: Record<string, number | string | undefined> | undefined,
  id: string,
): number {
  const parsed = parseWeightRaw(weights?.[id]);
  return parsed ?? 1;
}

export function resolveWeightLevel(value: number): WeightLevel {
  const v = clampWeight(value);
  // Use approximate match so 0.2500001 still maps to rare
  for (const preset of WEIGHT_PRESETS) {
    if (Math.abs(preset.multiplier - v) < 1e-9) return preset.id;
  }
  void PRESET_BY_VALUE;
  return "custom";
}

export function cyclePresetValue(current: number): number {
  const level = resolveWeightLevel(current);
  if (level === "custom") {
    const next = PRESET_ORDER.find((p) => WEIGHT_MAP[p] > current + 1e-9);
    return next ? WEIGHT_MAP[next] : 0;
  }
  const idx = PRESET_ORDER.indexOf(level);
  const next = PRESET_ORDER[(idx + 1) % PRESET_ORDER.length];
  return WEIGHT_MAP[next];
}

export function formatMultiplier(value: number): string {
  const v = clampWeight(value);
  if (v === 0) return "×0";
  if (Number.isInteger(v)) return `×${v}`;
  // trim trailing zeros: 1.5 stays 1.5, 1.50 → 1.5
  return `×${Number(v.toFixed(3))}`;
}

export function formatProbability(p: number): string {
  if (p <= 0) return "0%";
  if (p >= 1) return "100%";
  const pct = p * 100;
  if (pct < 0.05) return "<0.1%";
  if (pct < 10) return `${pct.toFixed(1)}%`;
  if (pct < 99.95) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(1)}%`;
}

/**
 * Single-pick odds for each fighter under the current weights.
 * Custom multipliers (any number ≥ 0) are fully supported.
 */
export function computeProbabilities(
  weights: Record<string, number | string | undefined> | undefined,
): { total: number; byId: Record<string, number>; eligible: number } {
  const byId: Record<string, number> = {};
  let total = 0;
  let eligible = 0;
  const values: Record<string, number> = {};

  for (const f of ROSTER) {
    const w = getWeightValue(weights, f.id);
    values[f.id] = w;
    if (w > 0) {
      total += w;
      eligible += 1;
    }
  }

  for (const f of ROSTER) {
    const w = values[f.id];
    byId[f.id] = total > 0 && w > 0 ? w / total : 0;
  }

  return { total, byId, eligible };
}

/** Probability if one fighter's weight were `overrideWeight` instead. */
export function probabilityWithOverride(
  weights: Record<string, number | string | undefined> | undefined,
  fighterId: string,
  overrideWeight: number,
): number {
  const override = clampWeight(overrideWeight);
  let total = 0;
  for (const f of ROSTER) {
    const w = f.id === fighterId ? override : getWeightValue(weights, f.id);
    if (w > 0) total += w;
  }
  if (total <= 0 || override <= 0) return 0;
  return override / total;
}

export function initials(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 &/]/g, "").trim();
  const parts = cleaned.split(/[\s/&]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

/** Fighters with a custom portrait in /public/portraits. Others keep the monogram. */
const PORTRAIT_IDS = new Set([
  "mario",
  "donkey-kong",
  "link",
  "samus",
  "dark-samus",
  "yoshi",
  "kirby",
  "fox",
  "pikachu",
  "luigi",
  "ness",
  "captain-falcon",
  "jigglypuff",
  "peach",
  "daisy",
  "bowser",
  "ice-climbers",
  "sheik",
  "zelda",
  "dr-mario",
  "pichu",
  "falco",
  "marth",
  "lucina",
  "young-link",
  "ganondorf",
  "mewtwo",
  "roy",
  "chrom",
  "mr-game-watch",
  "meta-knight",
  "pit",
  "dark-pit",
  "zero-suit-samus",
  "wario",
  "snake",
  "ike",
  "pokemon-trainer",
  "diddy-kong",
  "lucas",
  "sonic",
  "king-dedede",
  "olimar",
  "lucario",
  "rob",
  "toon-link",
  "wolf",
  "villager",
  "mega-man",
  "wii-fit-trainer",
  "mii-brawler",
  "mii-swordfighter",
  "mii-gunner",
  "rosalina",
  "little-mac",
  "greninja",
  "palutena",
  "pac-man",
  "robin",
  "shulk",
  "bowser-jr",
  "duck-hunt",
  "ryu",
  "ken",
  "cloud",
  "corrin",
  "bayonetta",
  "inkling",
  "ridley",
  "simon",
  "richter",
  "king-k-rool",
  "isabelle",
  "incineroar",
  "piranha-plant",
  "joker",
  "hero",
  "banjo-kazooie",
  "terry",
  "byleth",
  "min-min",
  "steve",
  "sephiroth",
  "pyra-mythra",
  "kazuya",
  "sora",
]);

export function fighterPortraitUrl(id: string): string | null {
  return PORTRAIT_IDS.has(id) ? `/portraits/${id}.webp` : null;
}

export function portraitUrls(): string[] {
  return Array.from(PORTRAIT_IDS, (id) => `/portraits/${id}.webp`);
}

const warmImages: HTMLImageElement[] = [];
let preloadInflight: Promise<void> | null = null;
let preloadLoaded = 0;
const preloadListeners = new Set<(loaded: number, total: number) => void>();

function notifyPreload(loaded: number, total: number) {
  preloadLoaded = loaded;
  for (const fn of preloadListeners) fn(loaded, total);
}

function loadPortrait(src: string, timeoutMs = 10_000): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    const finish = () => {
      img.onload = null;
      img.onerror = null;
      resolve();
    };
    const t = window.setTimeout(finish, timeoutMs);
    img.onload = () => {
      window.clearTimeout(t);
      void img.decode().then(finish, finish);
    };
    img.onerror = () => {
      window.clearTimeout(t);
      finish();
    };
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      window.clearTimeout(t);
      finish();
    }
    warmImages.push(img);
  });
}

/** Download + decode every portrait so the randomizer reel never flashes empty. */
export function preloadFighterPortraits(
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  const urls = portraitUrls();
  const total = urls.length;
  if (typeof window === "undefined") {
    onProgress?.(total, total);
    return Promise.resolve();
  }

  if (onProgress) {
    onProgress(preloadLoaded, total);
    preloadListeners.add(onProgress);
  }

  if (!preloadInflight) {
    if (warmImages.length >= total && preloadLoaded >= total) {
      notifyPreload(total, total);
      preloadInflight = Promise.resolve();
    } else {
      preloadInflight = (async () => {
        let loaded = preloadLoaded;
        notifyPreload(loaded, total);
        await Promise.all(
          urls.map((src) =>
            loadPortrait(src).then(() => {
              loaded += 1;
              notifyPreload(loaded, total);
            }),
          ),
        );
      })();
    }
  }

  return preloadInflight.finally(() => {
    if (onProgress) preloadListeners.delete(onProgress);
  });
}

export function portraitPreloadTotal(): number {
  return portraitUrls().length;
}

export interface FighterPalette {
  h: number;
  s: number;
}

export const FIGHTER_COLORS: Record<string, FighterPalette> = {
  mario: { h: 0, s: 78 },
  luigi: { h: 128, s: 62 },
  peach: { h: 330, s: 58 },
  daisy: { h: 42, s: 82 },
  bowser: { h: 88, s: 48 },
  "bowser-jr": { h: 95, s: 55 },
  rosalina: { h: 195, s: 55 },
  "dr-mario": { h: 210, s: 55 },
  "piranha-plant": { h: 8, s: 72 },
  "donkey-kong": { h: 28, s: 52 },
  "diddy-kong": { h: 22, s: 62 },
  "king-k-rool": { h: 100, s: 48 },
  link: { h: 142, s: 58 },
  "young-link": { h: 138, s: 52 },
  "toon-link": { h: 148, s: 62 },
  zelda: { h: 280, s: 38 },
  sheik: { h: 250, s: 28 },
  ganondorf: { h: 15, s: 55 },
  samus: { h: 32, s: 72 },
  "dark-samus": { h: 270, s: 35 },
  "zero-suit-samus": { h: 200, s: 62 },
  ridley: { h: 285, s: 42 },
  yoshi: { h: 118, s: 58 },
  kirby: { h: 330, s: 62 },
  "meta-knight": { h: 230, s: 48 },
  "king-dedede": { h: 210, s: 58 },
  fox: { h: 25, s: 48 },
  falco: { h: 205, s: 55 },
  wolf: { h: 280, s: 22 },
  pikachu: { h: 48, s: 88 },
  pichu: { h: 50, s: 82 },
  jigglypuff: { h: 320, s: 48 },
  mewtwo: { h: 280, s: 35 },
  "pokemon-trainer": { h: 8, s: 68 },
  lucario: { h: 215, s: 55 },
  greninja: { h: 225, s: 58 },
  incineroar: { h: 12, s: 72 },
  ness: { h: 0, s: 62 },
  lucas: { h: 210, s: 52 },
  "captain-falcon": { h: 5, s: 75 },
  "ice-climbers": { h: 200, s: 48 },
  marth: { h: 210, s: 58 },
  lucina: { h: 205, s: 48 },
  roy: { h: 8, s: 68 },
  chrom: { h: 215, s: 52 },
  ike: { h: 215, s: 35 },
  robin: { h: 250, s: 28 },
  corrin: { h: 185, s: 35 },
  byleth: { h: 155, s: 28 },
  "mr-game-watch": { h: 0, s: 0 },
  pit: { h: 45, s: 55 },
  "dark-pit": { h: 275, s: 32 },
  palutena: { h: 155, s: 48 },
  wario: { h: 52, s: 78 },
  snake: { h: 95, s: 28 },
  sonic: { h: 215, s: 78 },
  olimar: { h: 28, s: 58 },
  rob: { h: 0, s: 0 },
  villager: { h: 25, s: 55 },
  isabelle: { h: 45, s: 72 },
  "mega-man": { h: 210, s: 62 },
  "wii-fit-trainer": { h: 185, s: 42 },
  "little-mac": { h: 8, s: 72 },
  "pac-man": { h: 50, s: 90 },
  shulk: { h: 200, s: 48 },
  "duck-hunt": { h: 30, s: 42 },
  ryu: { h: 210, s: 28 },
  ken: { h: 25, s: 72 },
  cloud: { h: 200, s: 18 },
  bayonetta: { h: 0, s: 8 },
  inkling: { h: 28, s: 85 },
  simon: { h: 0, s: 55 },
  richter: { h: 215, s: 48 },
  "mii-brawler": { h: 8, s: 62 },
  "mii-swordfighter": { h: 210, s: 48 },
  "mii-gunner": { h: 145, s: 42 },
  joker: { h: 0, s: 72 },
  hero: { h: 210, s: 55 },
  "banjo-kazooie": { h: 32, s: 58 },
  terry: { h: 210, s: 55 },
  "min-min": { h: 25, s: 78 },
  steve: { h: 145, s: 42 },
  sephiroth: { h: 0, s: 5 },
  "pyra-mythra": { h: 12, s: 78 },
  kazuya: { h: 0, s: 62 },
  sora: { h: 210, s: 55 },
};

const FALLBACK: FighterPalette = { h: 210, s: 18 };

export function fighterHue(id: string): number {
  return fighterPalette(id).h;
}

export function fighterPalette(id: string): FighterPalette {
  return FIGHTER_COLORS[id] ?? FALLBACK;
}

export function fighterTileStyle(id: string): {
  background: string;
  boxShadow: string;
} {
  const { h, s } = fighterPalette(id);
  if (s < 8) {
    return {
      background: `linear-gradient(145deg, hsl(${h} 4% 28%), hsl(${h} 3% 14%))`,
      boxShadow: `inset 0 0 0 1px hsl(${h} 0% 45% / 0.35)`,
    };
  }
  return {
    background: `linear-gradient(145deg, hsl(${h} ${s}% 30%), hsl(${h} ${Math.max(s - 12, 20)}% 16%))`,
    boxShadow: `inset 0 0 0 1px hsl(${h} ${s}% 48% / 0.42)`,
  };
}

export function pickWeighted(
  pool: { fighter: Fighter; weight: number }[],
  rng: () => number = Math.random,
): Fighter | null {
  const active = pool.filter((p) => p.weight > 0);
  if (active.length === 0) return null;
  const total = active.reduce((s, p) => s + p.weight, 0);
  let r = rng() * total;
  for (const p of active) {
    r -= p.weight;
    if (r <= 0) return p.fighter;
  }
  return active[active.length - 1].fighter;
}

export function pickManyWeighted(
  pool: { fighter: Fighter; weight: number }[],
  count: number,
  rng: () => number = Math.random,
): Fighter[] {
  const remaining = pool.map((p) => ({ ...p }));
  const results: Fighter[] = [];
  const n = Math.min(count, remaining.filter((p) => p.weight > 0).length);
  for (let i = 0; i < n; i++) {
    const pick = pickWeighted(remaining, rng);
    if (!pick) break;
    results.push(pick);
    const idx = remaining.findIndex((p) => p.fighter.id === pick.id);
    if (idx >= 0) remaining.splice(idx, 1);
  }
  return results;
}
