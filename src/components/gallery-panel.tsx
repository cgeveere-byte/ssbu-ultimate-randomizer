import { useMemo, useState } from "react";
import { type Fighter, ROSTER, fighterPortraitUrl, fighterTileStyle, initials } from "@/lib/roster";
import { CssRosterBoard } from "@/components/css-roster-board";
import {
  DEFAULT_PORTRAIT_FOCUS_Y,
  portraitObjectPosition,
  resetPortraitFocusY,
  setPortraitFocusY,
  usePortraitFocusY,
} from "@/lib/portrait-focus";
import { cn } from "@/lib/cn";

type GallerySort = "css" | "name";

function EyeLineEditor({ fighter }: { fighter: Fighter }) {
  const y = usePortraitFocusY(fighter.id);
  const src = fighterPortraitUrl(fighter.id);
  const custom = y !== DEFAULT_PORTRAIT_FOCUS_Y;

  return (
    <section className="sticky top-2 z-20 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-3 shadow-[var(--shadow-soft)] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-fg">{fighter.name}</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            Eye line for wide CSS tiles. Doesn’t edit the picture — only the crop.
          </p>
        </div>
        <button
          type="button"
          disabled={!custom}
          onClick={() => resetPortraitFocusY(fighter.id)}
          className="h-9 shrink-0 rounded-[var(--radius-md)] border border-border px-2.5 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-40"
        >
          Reset
        </button>
      </div>
      <div className="mt-3 overflow-hidden rounded-[var(--radius-md)] border border-border bg-black">
        <div className="relative aspect-[2.4/1] w-full">
          {src ? (
            <img
              src={src}
              alt=""
              draggable={false}
              className="portrait-eyes h-full w-full"
              style={{ objectPosition: portraitObjectPosition(fighter.id) }}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-fg"
              style={fighterTileStyle(fighter.id)}
            >
              {initials(fighter.name)}
            </div>
          )}
        </div>
      </div>
      <label className="mt-3 flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span>More face</span>
          <span className="tabular font-medium text-fg-muted">{y}%</span>
          <span>More chest</span>
        </span>
        <input
          type="range"
          min={0}
          max={50}
          step={1}
          value={y}
          onChange={(e) => setPortraitFocusY(fighter.id, Number(e.target.value))}
          className="w-full accent-amber-300"
          aria-label={`Eye line for ${fighter.name}`}
        />
      </label>
    </section>
  );
}

function PortraitTile({
  fighter,
  focused,
  onSelect,
}: {
  fighter: Fighter;
  focused?: boolean;
  onSelect?: () => void;
}) {
  const src = fighterPortraitUrl(fighter.id);
  const tile = fighterTileStyle(fighter.id);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left"
    >
      <figure
        id={`gallery-${fighter.id}`}
        className={cn(
          "overflow-hidden rounded-[var(--radius-lg)] border bg-bg-elevated scroll-mt-24 transition-[border-color,box-shadow] hover:border-border-strong",
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
    </button>
  );
}

export function GalleryPanel() {
  const [sort, setSort] = useState<GallerySort>("css");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  const azFighters = useMemo(() => {
    return ROSTER.slice().sort((a, b) => a.name.localeCompare(b.name, "en"));
  }, []);
  const focused = focusId ? ROSTER.find((f) => f.id === focusId) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
            Gallery
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            All {ROSTER.length} fighters
            {sort === "css" ? " in character-select order." : " — A–Z."} Tap one to set its CSS eye line.
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

      {focused ? <EyeLineEditor fighter={focused} /> : null}

      {sort === "css" ? (
        <CssRosterBoard
          className="overflow-hidden rounded-[var(--radius-lg)]"
          highlightId={focusId}
          pulse
          pulseKey={pulseKey}
          onSelect={(id) => {
            setFocusId(id);
            setPulseKey((k) => k + 1);
          }}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {azFighters.map((fighter) => (
            <li key={fighter.id}>
              <PortraitTile
                fighter={fighter}
                focused={focusId === fighter.id}
                onSelect={() => {
                  setFocusId(fighter.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
