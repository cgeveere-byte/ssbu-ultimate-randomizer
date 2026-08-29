import {
  type Fighter,
  CSS_COLUMNS,
  cssRosterRows,
  fighterPortraitUrl,
  fighterTileStyle,
  initials,
} from "@/lib/roster";
import { usePortraitFocusY } from "@/lib/portrait-focus";
import { cn } from "@/lib/cn";
import { useMemo } from "react";

export type CssMark = { id: string; color: string; label: string };

export function CssRosterBoard({
  used,
  highlightId,
  pulse = false,
  pulseKey,
  className,
  onSelect,
  fill = false,
  dimOthers = false,
  markId = null,
  markColor,
  markLabel,
  marks,
  zeroIds,
}: {
  used?: ReadonlySet<string>;
  highlightId?: string | null;
  pulse?: boolean;
  pulseKey?: number | string;
  className?: string;
  onSelect?: (id: string) => void;
  fill?: boolean;
  dimOthers?: boolean;
  markId?: string | null;
  markColor?: string;
  markLabel?: string;
  marks?: CssMark[];
  zeroIds?: ReadonlySet<string>;
}) {
  const rows = useMemo(() => cssRosterRows(), []);
  const usedSet = used ?? EMPTY;
  const zeroSet = zeroIds ?? EMPTY;
  const allMarks = useMemo(() => {
    const list = marks ? marks.slice() : [];
    if (markId && markColor && !list.some((m) => m.id === markId)) {
      list.push({ id: markId, color: markColor, label: markLabel ?? "" });
    }
    return list;
  }, [marks, markId, markColor, markLabel]);
  const liveIds = useMemo(() => {
    const s = new Set(allMarks.map((m) => m.id));
    if (highlightId) s.add(highlightId);
    return s;
  }, [allMarks, highlightId]);

  return (
    <div
      className={cn(
        "grid gap-[2px] bg-black p-[2px] isolate overflow-visible",
        fill && "h-full min-h-0",
        className,
      )}
      style={
        fill
          ? { gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {rows.map((row, rowIndex) => {
        const rowHasPulse = Boolean(
          pulse && highlightId && row.some((f) => f.id === highlightId),
        );
        return (
        <ul
          key={rowIndex}
          className={cn(
            "relative grid gap-[2px] overflow-visible",
            fill && "min-h-0 h-full",
            rowHasPulse ? "z-50" : "z-0",
          )}
          style={{ gridTemplateColumns: `repeat(${CSS_COLUMNS}, minmax(0, 1fr))` }}
        >
          {row.length === CSS_COLUMNS
            ? row.map((fighter) => (
                <li
                  key={fighter.id}
                  id={`css-tile-${fighter.id}`}
                  className={cn(
                    fill && "min-h-0 h-full",
                    pulse && highlightId === fighter.id && "relative z-50 overflow-visible",
                  )}
                >
                  <CssTile
                    key={
                      pulse && highlightId === fighter.id
                        ? `pulse-${fighter.id}-${pulseKey}`
                        : fighter.id
                    }
                    fighter={fighter}
                    used={usedSet.has(fighter.id) && !liveIds.has(fighter.id) && !zeroSet.has(fighter.id)}
                    zeroed={zeroSet.has(fighter.id) && !liveIds.has(fighter.id)}
                    highlight={highlightId === fighter.id}
                    pulse={pulse && highlightId === fighter.id}
                    dimmed={dimOthers && !liveIds.has(fighter.id) && !zeroSet.has(fighter.id)}
                    tileMarks={allMarks.filter((m) => m.id === fighter.id)}
                    fill={fill}
                    onSelect={onSelect}
                  />
                </li>
              ))
            : Array.from({ length: CSS_COLUMNS }, (_, col) => {
                const offset = Math.floor((CSS_COLUMNS - row.length) / 2);
                const fighter = row[col - offset];
                if (!fighter) {
                  return (
                    <li
                      key={`pad-${col}`}
                      aria-hidden
                      className={fill ? "min-h-0 h-full" : undefined}
                    />
                  );
                }
                return (
                  <li
                  key={fighter.id}
                  id={`css-tile-${fighter.id}`}
                  className={cn(
                    fill && "min-h-0 h-full",
                    pulse && highlightId === fighter.id && "relative z-50 overflow-visible",
                  )}
                >
                    <CssTile
                      key={
                        pulse && highlightId === fighter.id
                          ? `pulse-${fighter.id}-${pulseKey}`
                          : fighter.id
                      }
                      fighter={fighter}
                      used={usedSet.has(fighter.id) && !liveIds.has(fighter.id) && !zeroSet.has(fighter.id)}
                      zeroed={zeroSet.has(fighter.id)}
                      highlight={highlightId === fighter.id}
                      pulse={pulse && highlightId === fighter.id}
                      dimmed={dimOthers && !liveIds.has(fighter.id) && !zeroSet.has(fighter.id)}
                      tileMarks={allMarks.filter((m) => m.id === fighter.id)}
                      fill={fill}
                      onSelect={onSelect}
                    />
                  </li>
                );
              })}
        </ul>
        );
      })}
    </div>
  );
}

const EMPTY = new Set<string>();

function CssTile({
  fighter,
  used,
  zeroed,
  highlight,
  pulse,
  dimmed,
  tileMarks,
  fill,
  onSelect,
}: {
  fighter: Fighter;
  used: boolean;
  zeroed?: boolean;
  highlight: boolean;
  pulse?: boolean;
  dimmed?: boolean;
  tileMarks: CssMark[];
  fill?: boolean;
  onSelect?: (id: string) => void;
}) {
  const src = fighterPortraitUrl(fighter.id);
  const tile = fighterTileStyle(fighter.id);
  const focusY = usePortraitFocusY(fighter.id);
  const title = zeroed
    ? `${fighter.name} · 0%`
    : used
      ? `${fighter.name} · already used`
      : tileMarks.length > 0
        ? `${fighter.name} · ${tileMarks.map((m) => m.label).join(", ")}`
        : fighter.name;
  const Tag = onSelect ? "button" : "div";
  const marked = tileMarks.length > 0;

  return (
    <Tag
      type={onSelect ? "button" : undefined}
      onClick={onSelect ? () => onSelect(fighter.id) : undefined}
      className={cn(
        "relative overflow-hidden rounded-[2px] bg-bg-elevated",
        fill ? "h-full w-full" : "aspect-square",
        highlight && !pulse && "z-[1] outline outline-2 outline-offset-[-1px] outline-white",
        pulse && "css-flash-tile",
        onSelect && "cursor-pointer transition-transform hover:z-[1] hover:brightness-110 active:scale-95",
      )}
      title={title}
      aria-label={onSelect ? fighter.name : undefined}
    >
      {src ? (
        <img
          src={src}
          alt={fighter.name}
          draggable={false}
          className={cn(
            "portrait-eyes h-full w-full transition-[filter,opacity] duration-300",
            used && "grayscale opacity-40",
            zeroed && "grayscale opacity-50",
            !used && !zeroed && dimmed && "saturate-[.4] brightness-[.82] contrast-[.95]",
            (highlight || pulse || marked) && "brightness-110",
          )}
          style={{ objectPosition: `50% ${focusY}%` }}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-[7px] font-semibold text-fg sm:text-[9px]",
            used && "grayscale opacity-40",
            zeroed && "grayscale opacity-50",
            !used && !zeroed && dimmed && "saturate-[.4] brightness-[.82]",
          )}
          style={tile}
          aria-hidden
        >
          {initials(fighter.name)}
        </div>
      )}

      {pulse && (
        <>
          <span className="css-flash-wash" />
          <span className="css-flash-shimmer" />
          <span className="css-flash-radial" />
          <span className="css-flash-radial css-flash-radial-delayed" />
        </>
      )}

      {marked &&
        tileMarks.map((m, i) => {
          if (i > 1) return null;
          const left = i === 1;
          return (
            <span
              key={m.label}
              className={cn(
                "pointer-events-none absolute top-0 z-[2] h-0 w-0",
                left ? "left-0" : "right-0",
              )}
              style={
                left
                  ? { borderTop: `9px solid ${m.color}`, borderRight: "9px solid transparent" }
                  : { borderTop: `9px solid ${m.color}`, borderLeft: "9px solid transparent" }
              }
              title={`${m.label} pick`}
            />
          );
        })}
      {marked && tileMarks.length === 1 && (
        <span
          className="pointer-events-none absolute inset-0 z-[1] rounded-[2px]"
          style={{ boxShadow: `inset 0 0 0 1.5px ${tileMarks[0].color}` }}
        />
      )}
      {marked && tileMarks.length > 1 && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex h-[3px]">
          {tileMarks.map((m) => (
            <span
              key={m.label}
              className="min-w-0 flex-1"
              style={{ background: m.color }}
            />
          ))}
        </span>
      )}
      {used && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute h-[78%] w-[2px] rotate-45 rounded-full bg-white/80" />
          <span className="absolute h-[78%] w-[2px] -rotate-45 rounded-full bg-white/80" />
        </div>
      )}
      {zeroed && (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center bg-black/20">
          <span className="text-[11px] font-black tabular leading-none text-white sm:text-sm" style={{ textShadow: "0 1px 3px #000" }}>
            0%
          </span>
        </div>
      )}
    </Tag>
  );
}