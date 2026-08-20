import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Fighter,
  type WeightPreset,
  ROSTER,
  WEIGHT_MAP,
  clampWeight,
  cyclePresetValue,
  getWeightValue,
  pickWeighted,
} from "./roster";
import {
  type WeightMap,
  type WeightProfile,
  DEFAULT_PROFILE_ID,
  BUILTIN_PROFILE_IDS,
  cloneProfile,
  createProfile,
  defaultWeights,
  ensureBuiltInProfiles,
  isBuiltInProfileId,
  isDefaultProfileId,
  makeBuiltInProfile,
  makeDefaultProfile,
  makeSmash64Profile,
  normalizeWeights,
  profileEligibleCount,
  smash64Weights,
  uniqueProfileName,
} from "./profiles";

export interface PickRecord {
  id: string;
  fighterIds: string[];
  profileNames: string[];
  at: number;
}

export interface PlayerPick {
  fighter: Fighter;
  profileId: string;
  profileName: string;
}

export { DEFAULT_PROFILE_ID, isBuiltInProfileId, isDefaultProfileId, makeDefaultProfile, makeSmash64Profile };

function emptyPlayerProfiles(): (string | null)[] {
  return Array.from({ length: 8 }, () => null);
}

function poolFromWeights(weights: WeightMap): { fighter: Fighter; weight: number }[] {
  return ROSTER.map((fighter) => ({
    fighter,
    weight: getWeightValue(weights, fighter.id),
  }));
}

function normalizeProfiles(profiles: WeightProfile[]): WeightProfile[] {
  return ensureBuiltInProfiles(profiles);
}

interface RandomizerState {
  profiles: WeightProfile[];
  activeProfileId: string;
  perPlayerProfiles: boolean;
  playerProfileIds: (string | null)[];
  playerCount: number;
  uniqueOnly: boolean;
  search: string;
  seriesFilter: string | "all";
  showBanned: boolean;
  lastPicks: PlayerPick[];
  history: PickRecord[];
  isSpinning: boolean;

  getActiveProfile: () => WeightProfile;
  getProfile: (id: string | null | undefined) => WeightProfile;
  getWeights: () => WeightMap;
  getPool: (profileId?: string | null) => { fighter: Fighter; weight: number }[];
  getEligibleCount: (profileId?: string | null) => number;
  getPlayerProfileId: (playerIndex: number) => string;
  canRoll: () => boolean;
  isActiveReadOnly: () => boolean;

  setActiveProfileId: (id: string) => void;
  createProfile: (name?: string) => string;
  duplicateProfile: (id: string) => string | null;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
  setPerPlayerProfiles: (v: boolean) => void;
  setPlayerProfile: (playerIndex: number, profileId: string | null) => void;
  applyActiveToPlayers: () => void;

  setWeightValue: (id: string, value: number) => void;
  setWeightPreset: (id: string, preset: WeightPreset) => void;
  setAllWeightValues: (value: number, predicate?: (f: Fighter) => boolean) => void;
  setAllWeightPresets: (preset: WeightPreset, predicate?: (f: Fighter) => boolean) => void;
  cycleWeight: (id: string) => void;
  resetWeights: () => void;

  setPlayerCount: (n: number) => void;
  setUniqueOnly: (v: boolean) => void;
  setSearch: (q: string) => void;
  setSeriesFilter: (s: string | "all") => void;
  setShowBanned: (v: boolean) => void;
  setSpinning: (v: boolean) => void;
  setLastPicks: (picks: PlayerPick[]) => void;
  pushHistory: (picks: PlayerPick[]) => void;
  clearHistory: () => void;

  roll: () => PlayerPick[];
  importProfiles: (incoming: WeightProfile[], mode: "merge" | "replace") => number;
  getProfilesForExport: (ids?: string[]) => WeightProfile[];
}

function updateActiveProfile(
  state: RandomizerState,
  updater: (weights: WeightMap) => WeightMap,
): Partial<RandomizerState> {
  // Built-in profiles are immutable
  if (isBuiltInProfileId(state.activeProfileId)) {
    return {};
  }
  const profiles = state.profiles.map((p) => {
    if (p.id !== state.activeProfileId) return p;
    const builtin = makeBuiltInProfile(p.id);
    if (builtin) return builtin;
    return {
      ...p,
      weights: updater(p.weights),
      updatedAt: Date.now(),
    };
  });
  return { profiles: ensureBuiltInProfiles(profiles) };
}

export const useRandomizerStore = create<RandomizerState>()(
  persist(
    (set, get) => ({
      profiles: ensureBuiltInProfiles([]),
      activeProfileId: DEFAULT_PROFILE_ID,
      perPlayerProfiles: true,
      playerProfileIds: emptyPlayerProfiles(),
      playerCount: 2,
      uniqueOnly: true,
      search: "",
      seriesFilter: "all",
      showBanned: true,
      lastPicks: [],
      history: [],
      isSpinning: false,

      getActiveProfile: () => {
        const s = get();
        const found = s.profiles.find((p) => p.id === s.activeProfileId);
        if (found) {
          const builtin = makeBuiltInProfile(found.id);
          return builtin ?? found;
        }
        return makeDefaultProfile();
      },

      getProfile: (id) => {
        const s = get();
        if (!id) return makeDefaultProfile();
        const builtin = makeBuiltInProfile(id);
        if (builtin) return builtin;
        return s.profiles.find((p) => p.id === id) ?? makeDefaultProfile();
      },

      getWeights: () => get().getActiveProfile().weights,

      getPool: (profileId) => {
        const profile = get().getProfile(profileId);
        return poolFromWeights(profile.weights);
      },

      getEligibleCount: (profileId) => {
        const profile = get().getProfile(profileId);
        return profileEligibleCount(profile.weights);
      },

      getPlayerProfileId: (playerIndex) => {
        const s = get();
        if (!s.perPlayerProfiles) return s.activeProfileId;
        return s.playerProfileIds[playerIndex] ?? s.activeProfileId;
      },

      canRoll: () => {
        const s = get();
        for (let i = 0; i < s.playerCount; i++) {
          const pid = s.getPlayerProfileId(i);
          if (s.getEligibleCount(pid) === 0) return false;
        }
        return s.playerCount > 0;
      },

      isActiveReadOnly: () => isBuiltInProfileId(get().activeProfileId),

      setActiveProfileId: (id) => {
        const exists = get().profiles.some((p) => p.id === id);
        if (exists) set({ activeProfileId: id });
      },

      createProfile: (name) => {
        const s = get();
        const finalName = uniqueProfileName(
          name?.trim() || `Profile ${s.profiles.filter((p) => !isBuiltInProfileId(p.id)).length + 1}`,
          s.profiles.map((p) => p.name),
        );
        const profile = createProfile(finalName, defaultWeights());
        set({
          profiles: ensureBuiltInProfiles([...s.profiles, profile]),
          activeProfileId: profile.id,
        });
        return profile.id;
      },

      duplicateProfile: (id) => {
        const s = get();
        const builtin = makeBuiltInProfile(id);
        const source = builtin ?? s.profiles.find((p) => p.id === id);
        if (!source) return null;
        const name = uniqueProfileName(
          builtin ? `${source.name} custom` : `${source.name} copy`,
          s.profiles.map((p) => p.name),
        );
        const copy = cloneProfile(source, name);
        set({
          profiles: ensureBuiltInProfiles([...s.profiles, copy]),
          activeProfileId: copy.id,
        });
        return copy.id;
      },

      renameProfile: (id, name) => {
        if (isBuiltInProfileId(id)) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          profiles: ensureBuiltInProfiles(
            s.profiles.map((p) =>
              p.id === id ? { ...p, name: trimmed, updatedAt: Date.now() } : p,
            ),
          ),
        }));
      },

      deleteProfile: (id) => {
        if (isBuiltInProfileId(id)) return;
        const s = get();
        const next = ensureBuiltInProfiles(s.profiles.filter((p) => p.id !== id));
        const activeProfileId =
          s.activeProfileId === id ? DEFAULT_PROFILE_ID : s.activeProfileId;
        const playerProfileIds = s.playerProfileIds.map((pid) =>
          pid === id ? null : pid,
        );
        set({ profiles: next, activeProfileId, playerProfileIds });
      },

      setPerPlayerProfiles: (v) => set({ perPlayerProfiles: v }),

      setPlayerProfile: (playerIndex, profileId) =>
        set((s) => {
          if (playerIndex < 0 || playerIndex > 7) return s;
          const playerProfileIds = [...s.playerProfileIds];
          playerProfileIds[playerIndex] = profileId;
          return { playerProfileIds };
        }),

      applyActiveToPlayers: () =>
        set((s) => ({
          playerProfileIds: s.playerProfileIds.map(() => s.activeProfileId),
          perPlayerProfiles: true,
        })),

      setWeightValue: (id, value) =>
        set((s) =>
          updateActiveProfile(s, (weights) => ({
            ...weights,
            [id]: clampWeight(value),
          })),
        ),

      setWeightPreset: (id, preset) =>
        set((s) =>
          updateActiveProfile(s, (weights) => ({
            ...weights,
            [id]: WEIGHT_MAP[preset],
          })),
        ),

      setAllWeightValues: (value, predicate) =>
        set((s) =>
          updateActiveProfile(s, (weights) => {
            const next = { ...weights };
            const v = clampWeight(value);
            for (const f of ROSTER) {
              if (!predicate || predicate(f)) next[f.id] = v;
            }
            return next;
          }),
        ),

      setAllWeightPresets: (preset, predicate) => {
        get().setAllWeightValues(WEIGHT_MAP[preset], predicate);
      },

      cycleWeight: (id) =>
        set((s) =>
          updateActiveProfile(s, (weights) => {
            const cur = getWeightValue(weights, id);
            return { ...weights, [id]: cyclePresetValue(cur) };
          }),
        ),

      resetWeights: () => {
        if (isBuiltInProfileId(get().activeProfileId)) return;
        set((s) => updateActiveProfile(s, () => defaultWeights()));
      },

      setPlayerCount: (n) => set({ playerCount: Math.min(8, Math.max(1, n)) }),
      setUniqueOnly: (v) => set({ uniqueOnly: v }),
      setSearch: (q) => set({ search: q }),
      setSeriesFilter: (series) => set({ seriesFilter: series }),
      setShowBanned: (v) => set({ showBanned: v }),
      setSpinning: (v) => set({ isSpinning: v }),
      setLastPicks: (picks) => set({ lastPicks: picks }),

      pushHistory: (picks) =>
        set((s) => ({
          history: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              fighterIds: picks.map((p) => p.fighter.id),
              profileNames: picks.map((p) => p.profileName),
              at: Date.now(),
            },
            ...s.history,
          ].slice(0, 24),
        })),

      clearHistory: () => set({ history: [] }),

      roll: () => {
        const s = get();
        const results: PlayerPick[] = [];
        const used = new Set<string>();

        for (let i = 0; i < s.playerCount; i++) {
          const profileId = s.getPlayerProfileId(i);
          const profile = s.getProfile(profileId);
          let pool = poolFromWeights(profile.weights);
          if (s.uniqueOnly && used.size > 0) {
            pool = pool.map((p) =>
              used.has(p.fighter.id) ? { ...p, weight: 0 } : p,
            );
          }
          const fighter = pickWeighted(pool);
          if (!fighter) continue;
          if (s.uniqueOnly) used.add(fighter.id);
          results.push({
            fighter,
            profileId: profile.id,
            profileName: profile.name,
          });
        }
        return results;
      },

      importProfiles: (incoming, mode) => {
        if (incoming.length === 0) return 0;
        // Strip built-in ids from import — built-ins always recreated
        const cleaned = incoming
          .filter((p) => !isBuiltInProfileId(p.id))
          .map((p) => ({
            ...p,
            weights: normalizeWeights(p.weights),
            updatedAt: Date.now(),
          }));

        if (mode === "replace") {
          const seen = new Set<string>(BUILTIN_PROFILE_IDS);
          const fixed = cleaned.map((p) => {
            let id = p.id;
            while (seen.has(id) || isBuiltInProfileId(id)) {
              id = createProfile(p.name).id;
            }
            seen.add(id);
            return { ...p, id };
          });
          const profiles = ensureBuiltInProfiles(fixed);
          set({
            profiles,
            activeProfileId: DEFAULT_PROFILE_ID,
            playerProfileIds: emptyPlayerProfiles(),
          });
          return fixed.length;
        }

        const s = get();
        const existingNames = s.profiles.map((p) => p.name);
        const added: WeightProfile[] = [];
        for (const p of cleaned) {
          const name = uniqueProfileName(p.name, [
            ...existingNames,
            ...added.map((a) => a.name),
          ]);
          added.push({
            id: createProfile(name).id,
            name,
            weights: normalizeWeights(p.weights),
            updatedAt: Date.now(),
          });
        }
        set({
          profiles: ensureBuiltInProfiles([...s.profiles, ...added]),
          activeProfileId: added[0]?.id ?? s.activeProfileId,
        });
        return added.length;
      },

      getProfilesForExport: (ids) => {
        const s = get();
        if (!ids || ids.length === 0) return ensureBuiltInProfiles(s.profiles);
        return s.profiles.filter((p) => ids.includes(p.id));
      },
    }),
    {
      name: "ssbu-randomizer-v2",
      version: 5,
      migrate: (persisted) => {
        const p = persisted as Record<string, unknown> | null;
        if (!p || typeof p !== "object") {
          return {
            profiles: ensureBuiltInProfiles([]),
            activeProfileId: DEFAULT_PROFILE_ID,
          };
        }
        if (!Array.isArray(p.profiles) && p.weights && typeof p.weights === "object") {
          const custom = createProfile(
            "Migrated",
            normalizeWeights(p.weights as Record<string, number | string>),
          );
          return {
            ...p,
            profiles: ensureBuiltInProfiles([custom]),
            activeProfileId: custom.id,
            perPlayerProfiles: false,
            playerProfileIds: emptyPlayerProfiles(),
            weights: undefined,
          };
        }
        if (Array.isArray(p.profiles)) {
          const profiles = ensureBuiltInProfiles(p.profiles as WeightProfile[]);
          return {
            ...p,
            profiles,
            activeProfileId:
              typeof p.activeProfileId === "string" &&
              profiles.some((x) => x.id === p.activeProfileId)
                ? p.activeProfileId
                : DEFAULT_PROFILE_ID,
          };
        }
        return {
          ...p,
          profiles: ensureBuiltInProfiles([]),
          activeProfileId: DEFAULT_PROFILE_ID,
        };
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<RandomizerState>;
        const profiles = ensureBuiltInProfiles(
          Array.isArray(p.profiles) ? p.profiles : current.profiles,
        );
        const activeProfileId =
          typeof p.activeProfileId === "string" &&
          profiles.some((x) => x.id === p.activeProfileId)
            ? p.activeProfileId
            : DEFAULT_PROFILE_ID;
        return {
          ...current,
          ...p,
          profiles,
          activeProfileId,
        };
      },
      partialize: (s) => ({
        profiles: ensureBuiltInProfiles(s.profiles),
        activeProfileId: s.activeProfileId,
        perPlayerProfiles: s.perPlayerProfiles,
        playerProfileIds: s.playerProfileIds,
        playerCount: s.playerCount,
        uniqueOnly: s.uniqueOnly,
        showBanned: s.showBanned,
        history: s.history,
      }),
    },
  ),
);

export function filterRoster(
  fighters: Fighter[],
  opts: {
    search: string;
    seriesFilter: string | "all";
    showBanned: boolean;
    weights: WeightMap;
  },
): Fighter[] {
  const q = opts.search.trim().toLowerCase();
  return fighters.filter((f) => {
    if (opts.seriesFilter !== "all" && f.series !== opts.seriesFilter) return false;
    const w = getWeightValue(opts.weights, f.id);
    if (!opts.showBanned && w <= 0) return false;
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      f.seriesLabel.toLowerCase().includes(q) ||
      String(f.number).includes(q)
    );
  });
}
