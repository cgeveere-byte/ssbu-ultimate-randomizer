import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Lock, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  type Fighter,
  type WeightLevel,
  WEIGHT_PRESETS,
  clampWeight,
  fighterTileStyle,
  formatMultiplier,
  formatProbability,
  initials,
  probabilityWithOverride,
  resolveWeightLevel,
} from "@/lib/roster";
import type { WeightMap } from "@/lib/profiles";
import { Badge } from "@/components/ui/badge";

const weightVariant: Record<
  WeightLevel,
  "never" | "rare" | "normal" | "often" | "favorite" | "default"
> = {
  never: "never",
  rare: "rare",
  normal: "normal",
  often: "often",
  favorite: "favorite",
  custom: "default",
};

export function FighterMonogram({
  fighter,
  size = "md",
  dimmed,
  className,
}: {
  fighter: Fighter;
  size?: "sm" | "md" | "lg" | "xl";
  dimmed?: boolean;
  className?: string;
}) {
  const tile = fighterTileStyle(fighter.id);
  const sizes = {
    sm: "h-10 w-10 text-xs rounded-[var(--radius-sm)]",
    md: "h-11 w-11 text-sm rounded-[var(--radius-md)] sm:h-12 sm:w-12 sm:rounded-[var(--radius-md)]",
    lg: "h-16 w-16 text-lg rounded-[var(--radius-md)]",
    xl: "h-24 w-24 text-2xl rounded-[var(--radius-lg)]",
  };
  const cornerBadge =
    size === "sm"
      ? "h-3.5 min-w-3.5 px-0.5 text-[7px]"
      : size === "xl"
        ? "h-5 min-w-5 px-1 text-[9px]"
        : "h-4 min-w-4 px-0.5 text-[8px]";
  const cornerOffset =
    size === "sm" ? "-right-0.5 -top-0.5" : size === "xl" ? "-right-1 -top-1" : "-right-1 -top-1";
  const bottomOffset =
    size === "sm"
      ? "-right-0.5 -bottom-0.5"
      : size === "xl"
        ? "-right-1 -bottom-1"
        : "-right-1 -bottom-1";
  return (
    <div className={cn("relative shrink-0", sizes[size], className)}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-[inherit] font-semibold tracking-tight text-fg",
          dimmed && "opacity-40 grayscale",
        )}
        style={tile}
        aria-hidden
      >
        {initials(fighter.name)}
      </div>
      {fighter.dlc && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full border-2 border-[#f97316] bg-black font-bold leading-none text-white shadow-sm",
            cornerBadge,
            cornerOffset,
          )}
          title="DLC fighter"
          aria-label="DLC fighter"
        >
          +
        </span>
      )}
      {fighter.echo && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full border-2 border-[#a855f7] bg-black font-bold uppercase leading-none tracking-wide text-white shadow-sm",
            cornerBadge,
            fighter.dlc ? bottomOffset : cornerOffset,
          )}
          title="Echo fighter"
          aria-label="Echo fighter"
        >
          E
        </span>
      )}
    </div>
  );
}

export function FighterCard({
  fighter,
  weight,
  weights,
  onCycle,
  onSetWeight,
  disabled,
  readOnly,
  readOnlyLabel = "Locked",
}: {
  fighter: Fighter;
  weight: number;
  /** Full profile weight map — used so live draft odds stay accurate for custom values. */
  weights: WeightMap;
  onCycle: () => void;
  onSetWeight: (value: number) => void;
  disabled?: boolean;
  /** Built-in profile — show lock UI even when not spinning. */
  readOnly?: boolean;
  readOnlyLabel?: string;
}) {
  const [draft, setDraft] = useState(String(weight));
  const locked = Boolean(disabled || readOnly);

  useEffect(() => {
    setDraft(String(weight));
  }, [weight]);

  const draftNumber = useMemo(() => {
    if (draft.trim() === "") return null;
    const n = Number(draft);
    return Number.isFinite(n) ? clampWeight(n) : null;
  }, [draft]);

  // Prefer live draft while typing so custom values update % immediately
  const effectiveWeight = !readOnly && draftNumber !== null ? draftNumber : weight;
  const probability = useMemo(
    () => probabilityWithOverride(weights, fighter.id, effectiveWeight),
    [weights, fighter.id, effectiveWeight],
  );

  const level = resolveWeightLevel(effectiveWeight);
  const presetMeta = WEIGHT_PRESETS.find((w) => w.id === level);
  const banned = effectiveWeight <= 0;
  const isFav = effectiveWeight >= 2;
  const isRare = effectiveWeight > 0 && effectiveWeight < 1;
  const label = isFav
    ? "Fav"
    : level === "custom"
      ? "Custom"
      : (presetMeta?.short ?? "Norm");
  const badgeVariant = isFav
    ? "favorite"
    : weightVariant[level];

  const commitDraft = (raw: string) => {
    if (locked) return;
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setDraft(String(weight));
      return;
    }
    onSetWeight(n);
  };

  return (
    <div
      className={cn(
        "group relative flex min-h-[7.5rem] flex-col gap-2 rounded-[var(--radius-lg)] border bg-bg-elevated p-2.5 text-left transition-[border-color,background-color,opacity] duration-150 sm:min-h-0 sm:gap-2.5 sm:rounded-[var(--radius-xl)] sm:p-3",
        banned && !readOnly && "opacity-55 border-danger/20",
        !banned && !readOnly && "border-border",
        readOnly && "border-border/80 bg-bg-elevated/70",
      )}
      title={
        readOnly
          ? `${fighter.name} — built-in profile, weights can’t be changed. Duplicate the profile to edit.`
          : undefined
      }
    >
      {readOnly && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
          <span className="tabular text-[10px] text-fg-subtle sm:text-[11px]">
            #{Number.isInteger(fighter.number) ? fighter.number : fighter.number.toFixed(1)}
          </span>
          <div className="flex items-center gap-1 rounded-full border border-border bg-bg/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-fg-subtle backdrop-blur-sm">
            <Lock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
            <span className="hidden sm:inline">{readOnlyLabel}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onCycle}
        disabled={locked}
        title={
          readOnly
            ? `${fighter.name} — locked on built-in profile`
            : `${fighter.name} — ${formatMultiplier(effectiveWeight)} · ${formatProbability(probability)}. Click to cycle preset.`
        }
        className={cn(
          "flex items-start gap-2 text-left sm:gap-3",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 rounded-[var(--radius-sm)]",
          !locked && "active:scale-[0.99] transition-transform duration-150",
          locked && "cursor-not-allowed",
        )}
      >
        <FighterMonogram fighter={fighter} dimmed={banned} />
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "flex items-start justify-between gap-1.5",
              readOnly && "pr-16 sm:pr-24",
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold tracking-tight text-fg sm:text-sm">
                {fighter.name}
              </p>
              <p className="truncate text-[11px] text-fg-subtle sm:text-xs">
                {fighter.seriesLabel}
              </p>
            </div>
            {!readOnly && (
              <span className="tabular shrink-0 text-[10px] text-fg-subtle sm:text-[11px]">
                #{Number.isInteger(fighter.number) ? fighter.number : fighter.number.toFixed(1)}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:mt-2 sm:gap-1.5">
            <Badge
              variant={badgeVariant}
              className={cn((isFav || isRare) && "gap-0.5")}
            >
              {isFav && (
                <Star
                  className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                  strokeWidth={0}
                  aria-hidden
                />
              )}
              {isRare && !isFav && (
                <ArrowDown className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
              )}
              {label}
            </Badge>
            <span
              className={cn(
                "tabular text-[11px] font-medium",
                isFav ? "text-amber-300" : "text-fg-muted",
              )}
            >
              {formatMultiplier(effectiveWeight)}
            </span>
            <span className="text-[11px] text-fg-subtle" aria-hidden>
              ·
            </span>
            <span
              className={cn(
                "tabular text-[11px] font-semibold",
                banned
                  ? "text-fg-subtle"
                  : isFav
                    ? "text-amber-300"
                    : "text-fg",
              )}
              title="Chance if you roll right now with this profile"
            >
              {formatProbability(probability)}
            </span>
          </div>
        </div>
      </button>

      <div
        className={cn(
          "mt-auto flex items-center gap-2",
          readOnly && "pointer-events-none opacity-45",
        )}
      >
        <div className="flex flex-1 gap-1" aria-hidden>
          {WEIGHT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={locked}
              title={
                readOnly
                  ? "Locked — switch to a custom profile to edit"
                  : `${preset.label} (×${preset.multiplier})`
              }
              onClick={() => onSetWeight(preset.multiplier)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-150",
                level === preset.id
                  ? preset.id === "never"
                    ? "bg-danger"
                    : preset.id === "favorite"
                      ? "bg-amber-400"
                      : preset.id === "often"
                        ? "bg-often"
                        : preset.id === "rare"
                          ? "bg-rare"
                          : "bg-fg-muted"
                  : readOnly
                    ? "bg-bg-hover"
                    : "bg-bg-hover hover:bg-fg-subtle/40",
              )}
            />
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-1">
          <span className="sr-only">
            {readOnly
              ? `Weight for ${fighter.name} (locked)`
              : `Custom weight for ${fighter.name}`}
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="any"
            disabled={locked}
            readOnly={readOnly}
            value={draft}
            onChange={(e) => {
              if (locked) return;
              const v = e.target.value;
              setDraft(v);
              if (v.trim() !== "" && Number.isFinite(Number(v))) {
                onSetWeight(Number(v));
              }
            }}
            onBlur={() => commitDraft(draft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "tabular h-7 w-14 rounded-[var(--radius-sm)] border border-border bg-bg px-1.5 text-center text-xs text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              locked && "cursor-not-allowed text-fg-muted",
            )}
          />
        </label>
      </div>
    </div>
  );
}
