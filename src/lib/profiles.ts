import {
  ROSTER,
  getWeightValue,
  parseWeightRaw,
  remapLegacyWeightMap,
  resolveWeightLevel,
} from "./roster";
import {
  CHRIS_PROFILE_ID,
  CHRIS_PROFILE_NAME,
  CHRIS_WEIGHTS,
  WRISTAKER_PROFILE_ID,
  WRISTAKER_PROFILE_NAME,
  WRISTAKER_WEIGHTS,
  defaultPlayerProfileId,
} from "./seed-profiles";

export {
  CHRIS_PROFILE_ID,
  CHRIS_PROFILE_NAME,
  WRISTAKER_PROFILE_ID,
  WRISTAKER_PROFILE_NAME,
  defaultPlayerProfileId,
} from "./seed-profiles";

/** Numeric multipliers per fighter id (0 = never). */
export type WeightMap = Record<string, number>;

export interface WeightProfile {
  id: string;
  name: string;
  weights: WeightMap;
  updatedAt: number;
}

export const EXPORT_FORMAT = "ssbu-randomizer-profiles" as const;
export const EXPORT_VERSION = 3 as const;

/** Built-in equal-weight full roster — always present, never editable or deleted. */
export const DEFAULT_PROFILE_ID = "default";
export const DEFAULT_PROFILE_NAME = "Default";

/** Built-in Super Smash Bros. (N64) roster only. */
export const SMASH_64_PROFILE_ID = "smash-64";
export const SMASH_64_PROFILE_NAME = "Smash 64";

/** Original Super Smash Bros. (1999) fighters. */
export const SMASH_64_FIGHTER_IDS = [
  "mario",
  "donkey-kong",
  "link",
  "samus",
  "yoshi",
  "kirby",
  "fox",
  "pikachu",
  "luigi",
  "ness",
  "captain-falcon",
  "jigglypuff",
] as const;

const SMASH_64_SET = new Set<string>(SMASH_64_FIGHTER_IDS);

export const BUILTIN_PROFILE_IDS = [
  DEFAULT_PROFILE_ID,
  SMASH_64_PROFILE_ID,
  CHRIS_PROFILE_ID,
  WRISTAKER_PROFILE_ID,
] as const;

export type BuiltInProfileId = (typeof BUILTIN_PROFILE_IDS)[number];

export interface ProfilesExportPayload {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  profiles: WeightProfile[];
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isDefaultProfileId(id: string | null | undefined): boolean {
  return id === DEFAULT_PROFILE_ID;
}

export function isSmash64ProfileId(id: string | null | undefined): boolean {
  return id === SMASH_64_PROFILE_ID;
}

/** Any locked built-in profile (Default, Smash 64, …). */
export function isBuiltInProfileId(id: string | null | undefined): boolean {
  return !!id && (BUILTIN_PROFILE_IDS as readonly string[]).includes(id);
}

export function isBuiltInProfile(
  profile: Pick<WeightProfile, "id"> | null | undefined,
): boolean {
  return !!profile && isBuiltInProfileId(profile.id);
}

/** @deprecated use isBuiltInProfileId for immutability checks */
export function isDefaultProfile(profile: Pick<WeightProfile, "id"> | null | undefined): boolean {
  return isBuiltInProfile(profile);
}

/** Equal chance for every fighter (×1). */
export function defaultWeights(): WeightMap {
  const w: WeightMap = {};
  for (const f of ROSTER) w[f.id] = 1;
  return w;
}

/** Only Smash 64 cast in pool; everyone else banned. */
export function smash64Weights(): WeightMap {
  const w: WeightMap = {};
  for (const f of ROSTER) {
    w[f.id] = SMASH_64_SET.has(f.id) ? 1 : 0;
  }
  return w;
}

export function makeDefaultProfile(): WeightProfile {
  return {
    id: DEFAULT_PROFILE_ID,
    name: DEFAULT_PROFILE_NAME,
    weights: defaultWeights(),
    updatedAt: 0,
  };
}

export function makeSmash64Profile(): WeightProfile {
  return {
    id: SMASH_64_PROFILE_ID,
    name: SMASH_64_PROFILE_NAME,
    weights: smash64Weights(),
    updatedAt: 0,
  };
}

export function makeChrisProfile(): WeightProfile {
  return {
    id: CHRIS_PROFILE_ID,
    name: CHRIS_PROFILE_NAME,
    weights: normalizeWeights(CHRIS_WEIGHTS),
    updatedAt: 0,
  };
}

export function makeWristakerProfile(): WeightProfile {
  return {
    id: WRISTAKER_PROFILE_ID,
    name: WRISTAKER_PROFILE_NAME,
    weights: normalizeWeights(WRISTAKER_WEIGHTS),
    updatedAt: 0,
  };
}

export function makeBuiltInProfile(id: string): WeightProfile | null {
  if (id === DEFAULT_PROFILE_ID) return makeDefaultProfile();
  if (id === SMASH_64_PROFILE_ID) return makeSmash64Profile();
  if (id === CHRIS_PROFILE_ID) return makeChrisProfile();
  if (id === WRISTAKER_PROFILE_ID) return makeWristakerProfile();
  return null;
}

/** Canonical built-ins in display order. */
export function listBuiltInProfiles(): WeightProfile[] {
  return [
    makeDefaultProfile(),
    makeSmash64Profile(),
    makeChrisProfile(),
    makeWristakerProfile(),
  ];
}

export function builtInSubtitle(id: string): string {
  if (id === DEFAULT_PROFILE_ID) return `Equal odds · ${ROSTER.length}/${ROSTER.length}`;
  if (id === SMASH_64_PROFILE_ID) {
    return `N64 cast · ${SMASH_64_FIGHTER_IDS.length}/${ROSTER.length}`;
  }
  if (id === CHRIS_PROFILE_ID || id === WRISTAKER_PROFILE_ID) {
    const p = makeBuiltInProfile(id);
    const n = p ? profileEligibleCount(p.weights) : 0;
    return `Starter · ${n}/${ROSTER.length}`;
  }
  return "";
}

/** Accept numeric map, numeric strings, or legacy preset-name map. */
export function normalizeWeights(
  input?: Record<string, number | string | undefined> | null,
): WeightMap {
  const base = defaultWeights();
  if (!input || typeof input !== "object") return base;
  for (const f of ROSTER) {
    const parsed = parseWeightRaw(input[f.id]);
    if (parsed !== null) {
      base[f.id] = parsed;
    }
  }
  return base;
}

/**
 * Ensure all built-in profiles exist (immutable weights), then custom profiles.
 * Reserved built-in ids cannot be claimed by user profiles.
 */
export function ensureBuiltInProfiles(profiles: WeightProfile[]): WeightProfile[] {
  const reserved = new Set<string>(BUILTIN_PROFILE_IDS);
  const rest = profiles
    .filter((p) => !reserved.has(p.id))
    .map((p) => ({
      ...p,
      weights: normalizeWeights(p.weights as Record<string, number | string>),
    }));
  return [...listBuiltInProfiles(), ...rest];
}

/** @deprecated use ensureBuiltInProfiles */
export function ensureDefaultProfile(profiles: WeightProfile[]): WeightProfile[] {
  return ensureBuiltInProfiles(profiles);
}

export function createProfile(name: string, weights?: WeightMap): WeightProfile {
  return {
    id: createId(),
    name: name.trim() || "Untitled",
    weights: normalizeWeights(weights ?? defaultWeights()),
    updatedAt: Date.now(),
  };
}

export function cloneProfile(profile: WeightProfile, name?: string): WeightProfile {
  const builtin = makeBuiltInProfile(profile.id);
  return {
    id: createId(),
    name: name?.trim() || `${profile.name} copy`,
    weights: builtin
      ? { ...builtin.weights }
      : normalizeWeights(profile.weights),
    updatedAt: Date.now(),
  };
}

export function profileEligibleCount(weights: WeightMap): number {
  return ROSTER.filter((f) => getWeightValue(weights, f.id) > 0).length;
}

export function profileStats(weights: WeightMap): {
  never: number;
  rare: number;
  normal: number;
  often: number;
  favorite: number;
  custom: number;
} {
  const counts = {
    never: 0,
    rare: 0,
    normal: 0,
    often: 0,
    favorite: 0,
    custom: 0,
  };
  for (const f of ROSTER) {
    const level = resolveWeightLevel(getWeightValue(weights, f.id));
    counts[level] += 1;
  }
  return counts;
}

export function buildExportPayload(profiles: WeightProfile[]): ProfilesExportPayload {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profiles: profiles.map((p) => {
      const builtin = makeBuiltInProfile(p.id);
      if (builtin) return builtin;
      return {
        id: p.id,
        name: p.name,
        weights: normalizeWeights(p.weights),
        updatedAt: p.updatedAt,
      };
    }),
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function slugifyFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "profile"
  );
}

export function parseImportPayload(raw: unknown): WeightProfile[] {
  if (raw == null || typeof raw !== "object") {
    throw new Error("Invalid file: expected a JSON object.");
  }
  const obj = raw as Record<string, unknown>;

  if (obj.format === EXPORT_FORMAT || Array.isArray(obj.profiles)) {
    if (!Array.isArray(obj.profiles) || obj.profiles.length === 0) {
      throw new Error("No profiles found in this file.");
    }
    const ver = typeof obj.version === "number" ? obj.version : 2;
    const profiles = obj.profiles.map((p, i) => normalizeImportedProfile(p, i));
    if (ver < 3) {
      return profiles.map((p) => ({
        ...p,
        weights: remapLegacyWeightMap(p.weights),
      }));
    }
    return profiles;
  }

  if (obj.weights && typeof obj.weights === "object") {
    const profile = normalizeImportedProfile(obj, 0);
    return [{ ...profile, weights: remapLegacyWeightMap(profile.weights) }];
  }

  if (looksLikeWeightMap(obj)) {
    return [
      createProfile(
        "Imported",
        remapLegacyWeightMap(
          normalizeWeights(obj as Record<string, number | string>),
        ),
      ),
    ];
  }

  throw new Error(
    "Unrecognized format. Export a profile from this app, or import { name, weights } JSON.",
  );
}

function looksLikeWeightMap(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj);
  if (keys.length < 5) return false;
  const sample = keys.slice(0, 12);
  return sample.every((k) => parseWeightRaw(obj[k]) !== null);
}

function normalizeImportedProfile(raw: unknown, index: number): WeightProfile {
  if (raw == null || typeof raw !== "object") {
    throw new Error(`Profile #${index + 1} is invalid.`);
  }
  const p = raw as Record<string, unknown>;
  // Never import over reserved built-in ids
  if (typeof p.id === "string" && isBuiltInProfileId(p.id)) {
    const builtin = makeBuiltInProfile(p.id)!;
    return createProfile(
      typeof p.name === "string" &&
        p.name.trim() &&
        p.name.trim() !== builtin.name
        ? p.name.trim()
        : `Imported ${builtin.name}`,
      normalizeWeights(
        p.weights && typeof p.weights === "object"
          ? (p.weights as Record<string, number | string>)
          : null,
      ),
    );
  }
  const name =
    typeof p.name === "string" && p.name.trim()
      ? p.name.trim()
      : `Imported ${index + 1}`;
  const weights = normalizeWeights(
    (p.weights && typeof p.weights === "object"
      ? (p.weights as Record<string, number | string>)
      : looksLikeWeightMap(p)
        ? (p as Record<string, number | string>)
        : null) ?? null,
  );
  return {
    id: createId(),
    name,
    weights,
    updatedAt: Date.now(),
  };
}

export function uniqueProfileName(base: string, existing: string[]): string {
  const names = new Set(existing.map((n) => n.toLowerCase()));
  if (!names.has(base.toLowerCase())) return base;
  let i = 2;
  while (names.has(`${base} (${i})`.toLowerCase())) i += 1;
  return `${base} (${i})`;
}
