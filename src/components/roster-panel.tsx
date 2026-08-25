import { useMemo, useState } from "react";
import {
  Ban,
  RotateCcw,
  Search,
  Star,
  Eye,
  EyeOff,
  TrendingUp,
  Equal,
  ArrowDownAZ,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FighterCard } from "@/components/fighter-tile";
import {
  ROSTER,
  SERIES_LIST,
  WEIGHT_PRESETS,
  type Fighter,
  type WeightPreset,
  computeProbabilities,
  getWeightValue,
} from "@/lib/roster";
import { isBuiltInProfileId, isDefaultProfileId, isSmash64ProfileId } from "@/lib/profiles";

import { filterRoster, useRandomizerStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type SortMode = "number" | "name-asc" | "name-desc" | "prob-desc";

function sortFighters(
  list: Fighter[],
  mode: SortMode,
  probs: Record<string, number>,
): Fighter[] {
  const copy = [...list];
  if (mode === "name-asc") {
    copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  } else if (mode === "name-desc") {
    copy.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
  } else if (mode === "prob-desc") {
    copy.sort((a, b) => (probs[b.id] ?? 0) - (probs[a.id] ?? 0));
  } else {
    copy.sort((a, b) => a.number - b.number);
  }
  return copy;
}

export function RosterPanel() {
  const profiles = useRandomizerStore((s) => s.profiles);
  const activeProfileId = useRandomizerStore((s) => s.activeProfileId);
  const search = useRandomizerStore((s) => s.search);
  const setSearch = useRandomizerStore((s) => s.setSearch);
  const seriesFilter = useRandomizerStore((s) => s.seriesFilter);
  const setSeriesFilter = useRandomizerStore((s) => s.setSeriesFilter);
  const showBanned = useRandomizerStore((s) => s.showBanned);
  const setShowBanned = useRandomizerStore((s) => s.setShowBanned);
  const setWeightValue = useRandomizerStore((s) => s.setWeightValue);

  const setAllWeightPresets = useRandomizerStore((s) => s.setAllWeightPresets);
  const resetWeights = useRandomizerStore((s) => s.resetWeights);
  const isSpinning = useRandomizerStore((s) => s.isSpinning);

  const [sortMode, setSortMode] = useState<SortMode>("number");

  const active =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const readOnly = isBuiltInProfileId(active.id);
  const weights = active.weights;
  const locked = readOnly || isSpinning;


  // Recompute whenever the weights object changes (including custom numbers)
  const odds = useMemo(() => computeProbabilities(weights), [weights]);

  const filtered = useMemo(() => {
    const list = filterRoster(ROSTER, { search, seriesFilter, showBanned, weights });
    return sortFighters(list, sortMode, odds.byId);
  }, [search, seriesFilter, showBanned, weights, sortMode, odds]);

  const applyPresetToVisible = (preset: WeightPreset) => {
    const ids = new Set(filtered.map((f) => f.id));
    setAllWeightPresets(preset, (f) => ids.has(f.id));
  };

  const cycleSort = () => {
    setSortMode((m) =>
      m === "number"
        ? "name-asc"
        : m === "name-asc"
          ? "name-desc"
          : m === "name-desc"
            ? "prob-desc"
            : "number",
    );
  };

  const sortLabel =
    sortMode === "number"
      ? "Fighter #"
      : sortMode === "name-asc"
        ? "A → Z"
        : sortMode === "name-desc"
          ? "Z → A"
          : "Most likely";

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-fg">
          Roster weights
          <span className="ml-2 text-sm font-normal text-fg-muted">· {active.name}</span>
        </h2>
        <p className="text-sm text-fg-muted">
          {isDefaultProfileId(active.id) ? (
            <>
              <span className="font-medium text-fg">Default</span> is a built-in equal-weight pool
              (every fighter ×1). It can’t be edited or deleted — duplicate it to make a custom
              setup.
            </>
          ) : isSmash64ProfileId(active.id) ? (
            <>
              <span className="font-medium text-fg">Smash 64</span> is a built-in pool with only
              the original 12 Super Smash Bros. (N64) fighters. Read-only — duplicate to
              customize.
            </>
          ) : isBuiltInProfileId(active.id) ? (
            <>
              <span className="font-medium text-fg">{active.name}</span> is a starter profile.
              Read-only — duplicate it to customize.
            </>
          ) : (
            <>
              Presets: Never ×0 · Rare ×0.25 · Normal ×1 · Often ×2 · Favorite ×5. Type any custom
              multiplier — % is the live chance on the next single roll.
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {WEIGHT_PRESETS.map((w) => (
          <div
            key={w.id}
            className="flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs text-fg-muted"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                w.id === "never" && "bg-danger",
                w.id === "rare" && "bg-rare",
                w.id === "normal" && "bg-fg-muted",
                w.id === "often" && "bg-often",
                w.id === "favorite" && "bg-accent",
              )}
            />
            <span className="font-medium text-fg">{w.label}</span>
            <span className="text-fg-subtle">×{w.multiplier}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs text-fg-muted">
          <span className="font-medium text-fg">Pool</span>
          <span className="tabular text-fg-subtle">
            {odds.eligible} fighters · total weight{" "}
            {Number.isInteger(odds.total) ? odds.total : odds.total.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fighters or series…"
              className="pl-9"
              aria-label="Search fighters"
            />
          </div>
          <select
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value as typeof seriesFilter)}
            className="h-11 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:w-48"
            aria-label="Filter by series"
          >
            <option value="all">All series</option>
            {SERIES_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="h-11 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:w-44"
            aria-label="Sort fighters"
          >
            <option value="number">Sort: Fighter #</option>
            <option value="name-asc">Sort: A → Z</option>
            <option value="name-desc">Sort: Z → A</option>
            <option value="prob-desc">Sort: Most likely</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={locked || filtered.length === 0}
            onClick={() => applyPresetToVisible("never")}
          >
            <Ban className="h-3.5 w-3.5" />
            Ban visible
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={locked || filtered.length === 0}
            onClick={() => applyPresetToVisible("normal")}
          >
            <Equal className="h-3.5 w-3.5" />
            Reset visible
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={locked || filtered.length === 0}
            onClick={() => applyPresetToVisible("often")}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Boost visible
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={locked || filtered.length === 0}
            onClick={() => applyPresetToVisible("favorite")}
          >
            <Star className="h-3.5 w-3.5" />
            Favorite visible
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isSpinning}
            onClick={() => setShowBanned(!showBanned)}
          >
            {showBanned ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide banned
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Show banned
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost" disabled={locked} onClick={resetWeights}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset profile
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={locked}
            onClick={() => setAllWeightPresets("never", (f) => !!f.dlc)}
          >
            Ban DLC
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={locked}
            onClick={() => setAllWeightPresets("never", (f) => f.series === "mii")}
          >
            Ban Miis
          </Button>
          <Button size="sm" variant="ghost" disabled={isSpinning} onClick={cycleSort}>
            {sortMode === "number" ? (
              <Hash className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownAZ className="h-3.5 w-3.5" />
            )}
            {sortLabel}
          </Button>
        </div>

        <p className="text-xs text-fg-subtle">
          Showing {filtered.length} of {ROSTER.length} fighters on “{active.name}” · {sortLabel}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-dashed border-border bg-bg-elevated px-6 py-16 text-center">
          <p className="text-sm font-medium text-fg">No fighters match</p>
          <p className="text-sm text-fg-muted">Try clearing search or showing banned fighters.</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => {
              setSearch("");
              setSeriesFilter("all");
              setShowBanned(true);
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          {filtered.map((fighter) => (
            <FighterCard
              key={fighter.id}
              fighter={fighter}
              weight={getWeightValue(weights, fighter.id)}
              weights={weights}
              onSetWeight={(v) => setWeightValue(fighter.id, v)}
              disabled={isSpinning}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-fg-subtle">
        Probability = fighter weight ÷ total pool weight (custom values included).
      </p>
    </section>
  );
}
