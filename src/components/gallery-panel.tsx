import { useMemo, useState } from "react";
import {
  type Fighter,
  CSS_COLUMNS,
  ROSTER,
  cssRosterRows,
  fighterPortraitUrl,
  fighterTileStyle,
  initials,
} from "@/lib/roster";
import { cn } from "@/lib/cn";

type GallerySort = "css" | "name";

function PortraitTile({ fighter, compact }: { fighter: Fighter; compact?: boolean }) {
  const src = fighterPortraitUrl(fighter.id);
  const tile = fighterTileStyle(fighter.id);
  return (
    <figure
      className={cn(
        "overflow-hidden bg-bg-elevated",
        compact
          ? "rounded-[3px]"
          : "rounded-[var(--radius-lg)] border border-border",
      )}
      title={fighter.name}
    >
      <div className="relative aspect-square">
        {src ? (
          <img
            src={src}
            alt={fighter.name}
            draggable={false}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center font-semibold tracking-tight text-fg",
              compact ? "text-[8px] sm:text-[10px]" : "text-3xl",
            )}
            style={tile}
            aria-hidden
          >
            {initials(fighter.name)}
          </div>
        )}
        {!compact && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-2 pb-2 pt-10">
            <figcaption className="truncate text-center text-sm font-semibold tracking-tight text-white">
              {fighter.name}
            </figcaption>
          </div>
        )}
      </div>
    </figure>
  );
}

export function GalleryPanel() {
  const [sort, setSort] = useState<GallerySort>("css");

  const azFighters = useMemo(() => {
    return ROSTER.slice().sort((a, b) => a.name.localeCompare(b.name, "en"));
  }, []);

  const rows = useMemo(() => cssRosterRows(), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
            Gallery
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            All {ROSTER.length} fighters
            {sort === "css" ? " in character-select order." : " — A–Z."}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Sort gallery"
          className="inline-flex h-11 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-bg p-0.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={sort === "css"}
            onClick={() => setSort("css")}
            className={cn(
              "flex items-center justify-center px-3 text-xs font-semibold transition-colors sm:px-3.5",
              sort === "css"
                ? "rounded-[calc(var(--radius-lg)-2px)] bg-accent text-accent-fg"
                : "text-fg-muted hover:text-fg",
            )}
          >
            CSS
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={sort === "name"}
            onClick={() => setSort("name")}
            className={cn(
              "flex items-center justify-center px-3 text-xs font-semibold transition-colors sm:px-3.5",
              sort === "name"
                ? "rounded-[calc(var(--radius-lg)-2px)] bg-accent text-accent-fg"
                : "text-fg-muted hover:text-fg",
            )}
          >
            A–Z
          </button>
        </div>
      </div>

      {sort === "css" ? (
        <div className="flex flex-col gap-[3px] overflow-x-auto rounded-[var(--radius-lg)] bg-black p-[3px]">
          {rows.map((row, rowIndex) => (
            <ul
              key={rowIndex}
              className={cn(
                "grid gap-[3px]",
                row.length === CSS_COLUMNS
                  ? "grid-cols-13"
                  : "grid-cols-13 justify-items-center",
              )}
              style={
                row.length === CSS_COLUMNS
                  ? { gridTemplateColumns: `repeat(${CSS_COLUMNS}, minmax(0, 1fr))` }
                  : {
                      gridTemplateColumns: `repeat(${CSS_COLUMNS}, minmax(0, 1fr))`,
                    }
              }
            >
              {row.length === CSS_COLUMNS
                ? row.map((fighter) => (
                    <li key={fighter.id}>
                      <PortraitTile fighter={fighter} compact />
                    </li>
                  ))
                : Array.from({ length: CSS_COLUMNS }, (_, col) => {
                    const offset = Math.floor((CSS_COLUMNS - row.length) / 2);
                    const fighter = row[col - offset];
                    if (!fighter) {
                      return <li key={`pad-${col}`} aria-hidden />;
                    }
                    return (
                      <li key={fighter.id}>
                        <PortraitTile fighter={fighter} compact />
                      </li>
                    );
                  })}
            </ul>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {azFighters.map((fighter) => (
            <li key={fighter.id}>
              <PortraitTile fighter={fighter} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
