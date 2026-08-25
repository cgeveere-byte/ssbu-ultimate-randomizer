import { useEffect, useMemo, useState } from "react";
import { type Fighter, ROSTER, fighterPortraitUrl, fighterTileStyle, initials } from "@/lib/roster";
import { CssRosterBoard } from "@/components/css-roster-board";
import { cn } from "@/lib/cn";

type GallerySort = "css" | "name";

function PortraitTile({ fighter, focused }: { fighter: Fighter; focused?: boolean }) {
  const src = fighterPortraitUrl(fighter.id);
  const tile = fighterTileStyle(fighter.id);
  return (
    <figure
      id={`gallery-${fighter.id}`}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border bg-bg-elevated scroll-mt-24",
        focused ? "border-accent ring-2 ring-accent/50" : "border-border",
      )}
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
            className="flex h-full w-full items-center justify-center text-3xl font-semibold tracking-tight text-fg"
            style={tile}
            aria-hidden
          >
            {initials(fighter.name)}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-2 pb-2 pt-10">
          <figcaption className="truncate text-center text-sm font-semibold tracking-tight text-white">
            {fighter.name}
          </figcaption>
        </div>
      </div>
    </figure>
  );
}

export function GalleryPanel() {
  const [sort, setSort] = useState<GallerySort>("css");
  const [focusId, setFocusId] = useState<string | null>(null);

  const azFighters = useMemo(() => {
    return ROSTER.slice().sort((a, b) => a.name.localeCompare(b.name, "en"));
  }, []);

  useEffect(() => {
    if (sort !== "name" || !focusId) return;
    const el = document.getElementById(`gallery-${focusId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sort, focusId]);

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
        <CssRosterBoard
          className="overflow-hidden rounded-[var(--radius-lg)]"
          onSelect={(id) => {
            setFocusId(id);
            setSort("name");
          }}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {azFighters.map((fighter) => (
            <li key={fighter.id}>
              <PortraitTile fighter={fighter} focused={focusId === fighter.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
