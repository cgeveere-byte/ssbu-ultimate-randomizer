import {
  type Fighter,
  CSS_COLUMNS,
  cssRosterRows,
  fighterPortraitUrl,
  fighterTileStyle,
  initials,
} from "@/lib/roster";
import { cn } from "@/lib/cn";
import { useMemo } from "react";

export function CssRosterBoard({
  used,
  highlightId,
  pulse = false,
  pulseKey,
  className,
  onSelect,
  fill = false,
  dimOthers = false,
}: {
  used?: ReadonlySet<string>;
  highlightId?: string | null;
  pulse?: boolean;
  pulseKey?: number | string;
  className?: string;
  onSelect?: (id: string) => void;
  fill?: boolean;
  dimOthers?: boolean;
}) {
  const rows = useMemo(() => cssRosterRows(), []);
  const usedSet = used ?? EMPTY;

  return (
    <div
      className={cn(
        "grid gap-[2px] bg-black p-[2px]",
        fill && "h-full min-h-0",
        className,
      )}
      style={
        fill
          ? { gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {rows.map((row, rowIndex) => (
        <ul
          key={rowIndex}
          className={cn("grid gap-[2px]", fill && "min-h-0 h-full")}
          style={{ gridTemplateColumns: `repeat(${CSS_COLUMNS}, minmax(0, 1fr))` }}
        >
          {row.length === CSS_COLUMNS
            ? row.map((fighter) => (
                <li
                  key={fighter.id}
                  id={`css-tile-${fighter.id}`}
                  className={fill ? "min-h-0 h-full" : undefined}
                >
                  <CssTile
                    key={
                      pulse && highlightId === fighter.id
                        ? `pulse-${fighter.id}-${pulseKey}`
                        : fighter.id
                    }
                    fighter={fighter}
                    used={usedSet.has(fighter.id) && fighter.id !== highlightId}
                    highlight={highlightId === fighter.id}
                    pulse={pulse && highlightId === fighter.id}
                    dimmed={dimOthers && fighter.id !== highlightId}
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
                  className={fill ? "min-h-0 h-full" : undefined}
                >
                    <CssTile
                      key={
                        pulse && highlightId === fighter.id
                          ? `pulse-${fighter.id}-${pulseKey}`
                          : fighter.id
                      }
                      fighter={fighter}
                      used={usedSet.has(fighter.id) && fighter.id !== highlightId}
                      highlight={highlightId === fighter.id}
                      pulse={pulse && highlightId === fighter.id}
                      dimmed={dimOthers && fighter.id !== highlightId}
                      fill={fill}
                      onSelect={onSelect}
                    />
                  </li>
                );
              })}
        </ul>
      ))}
    </div>
  );
}

const EMPTY = new Set<string>();

function CssTile({
  fighter,
  used,
  highlight,
  pulse,
  dimmed,
  fill,
  onSelect,
}: {
  fighter: Fighter;
  used: boolean;
  highlight: boolean;
  pulse?: boolean;
  dimmed?: boolean;
  fill?: boolean;
  onSelect?: (id: string) => void;
}) {
  const src = fighterPortraitUrl(fighter.id);
  const tile = fighterTileStyle(fighter.id);
  const title = used ? `${fighter.name} · already used` : fighter.name;
  const Tag = onSelect ? "button" : "div";

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
            "h-full w-full object-cover object-center transition-[filter,opacity] duration-300",
            used && "grayscale opacity-40",
            !used && dimmed && "saturate-[.4] brightness-[.82] contrast-[.95]",
            (highlight || pulse) && "brightness-110",
          )}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-[7px] font-semibold text-fg sm:text-[9px]",
            used && "grayscale opacity-40",
            !used && dimmed && "saturate-[.4] brightness-[.82]",
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

      {used && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute h-[78%] w-[2px] rotate-45 rounded-full bg-white/80" />
          <span className="absolute h-[78%] w-[2px] -rotate-45 rounded-full bg-white/80" />
        </div>
      )}
    </Tag>
  );
}
