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
  className,
}: {
  used?: ReadonlySet<string>;
  highlightId?: string | null;
  className?: string;
}) {
  const rows = useMemo(() => cssRosterRows(), []);
  const usedSet = used ?? EMPTY;

  return (
    <div className={cn("flex flex-col gap-[2px] bg-black p-[2px]", className)}>
      {rows.map((row, rowIndex) => (
        <ul
          key={rowIndex}
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${CSS_COLUMNS}, minmax(0, 1fr))` }}
        >
          {row.length === CSS_COLUMNS
            ? row.map((fighter) => (
                <li key={fighter.id}>
                  <CssTile
                    fighter={fighter}
                    used={usedSet.has(fighter.id) && fighter.id !== highlightId}
                    highlight={highlightId === fighter.id}
                  />
                </li>
              ))
            : Array.from({ length: CSS_COLUMNS }, (_, col) => {
                const offset = Math.floor((CSS_COLUMNS - row.length) / 2);
                const fighter = row[col - offset];
                if (!fighter) return <li key={`pad-${col}`} aria-hidden />;
                return (
                  <li key={fighter.id}>
                    <CssTile
                      fighter={fighter}
                      used={usedSet.has(fighter.id) && fighter.id !== highlightId}
                      highlight={highlightId === fighter.id}
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
}: {
  fighter: Fighter;
  used: boolean;
  highlight: boolean;
}) {
  const src = fighterPortraitUrl(fighter.id);
  const tile = fighterTileStyle(fighter.id);
  const title = used ? `${fighter.name} · already used` : fighter.name;

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-[2px] bg-bg-elevated",
        highlight && "z-[1] outline outline-2 outline-offset-[-1px] outline-white",
      )}
      title={title}
    >
      {src ? (
        <img
          src={src}
          alt={fighter.name}
          draggable={false}
          className={cn(
            "h-full w-full object-cover object-center",
            used && "grayscale opacity-40",
            highlight && "brightness-110",
          )}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-[7px] font-semibold text-fg sm:text-[9px]",
            used && "grayscale opacity-40",
          )}
          style={tile}
          aria-hidden
        >
          {initials(fighter.name)}
        </div>
      )}

      {used && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute h-[78%] w-[2px] rotate-45 rounded-full bg-white/80" />
          <span className="absolute h-[78%] w-[2px] -rotate-45 rounded-full bg-white/80" />
        </div>
      )}
    </div>
  );
}
