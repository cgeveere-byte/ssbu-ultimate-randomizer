import { useMemo, useState } from "react";
import { ROSTER, fighterPortraitUrl, fighterTileStyle, initials } from "@/lib/roster";
import { cn } from "@/lib/cn";

type GallerySort = "number" | "name";

export function GalleryPanel() {
  const [sort, setSort] = useState<GallerySort>("number");

  const fighters = useMemo(() => {
    const list = ROSTER.slice();
    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "en"));
    } else {
      list.sort((a, b) => a.number - b.number);
    }
    return list;
  }, [sort]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
            Gallery
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            All {ROSTER.length} fighters — just the art.
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
            aria-checked={sort === "number"}
            onClick={() => setSort("number")}
            className={cn(
              "flex items-center justify-center px-3 text-xs font-semibold transition-colors sm:px-3.5",
              sort === "number"
                ? "rounded-[calc(var(--radius-lg)-2px)] bg-accent text-accent-fg"
                : "text-fg-muted hover:text-fg",
            )}
          >
            Fighter #
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

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {fighters.map((fighter) => {
          const src = fighterPortraitUrl(fighter.id);
          const tile = fighterTileStyle(fighter.id);
          return (
            <li key={fighter.id}>
              <figure className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated">
                <div className="relative aspect-square">
                  {src ? (
                    <img
                      src={src}
                      alt=""
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
