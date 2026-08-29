import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { type Fighter, ROSTER, fighterPortraitUrl, fighterTileStyle, initials } from "@/lib/roster";
import { CssRosterBoard } from "@/components/css-roster-board";
import {
  formatPortraitFocusDump,
  getPortraitFocusOverrides,
  hasCustomPortraitFocus,
  portraitObjectPosition,
  resetPortraitFocusY,
  setPortraitFocusY,
  usePortraitFocusEpoch,
  usePortraitFocusY,
} from "@/lib/portrait-focus";
import { cn } from "@/lib/cn";

type GalleryTab = "css" | "name" | "eyes";

const TABS: { id: GalleryTab; label: string }[] = [
  { id: "css", label: "CSS" },
  { id: "name", label: "A–Z" },
  { id: "eyes", label: "Eye line" },
];

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Couldn’t copy — select the dump below instead");
  }
}

function setYFromPointer(id: string, el: HTMLElement, clientY: number) {
  const rect = el.getBoundingClientRect();
  if (rect.height <= 0) return;
  const pct = ((clientY - rect.top) / rect.height) * 100;
  setPortraitFocusY(id, pct);
}

function EyeLineEditor({
  fighter,
  index,
  total,
  onPrev,
  onNext,
}: {
  fighter: Fighter;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const y = usePortraitFocusY(fighter.id);
  const epoch = usePortraitFocusEpoch();
  const src = fighterPortraitUrl(fighter.id);
  const custom = hasCustomPortraitFocus(fighter.id);
  const overrides = useMemo(() => getPortraitFocusOverrides(), [epoch]);
  const overrideCount = Object.keys(overrides).length;
  const dump = useMemo(() => formatPortraitFocusDump(), [epoch]);

  return (
    <section className="sticky top-2 z-20 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-3 shadow-[var(--shadow-soft)] sm:p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-[var(--radius-md)] border border-border px-2.5 text-xs font-medium text-fg-muted hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          Previous
        </button>
        <p className="min-w-0 flex-1 text-center text-[11px] tabular text-fg-subtle">
          {index + 1} / {total}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-[var(--radius-md)] border border-border px-2.5 text-xs font-medium text-fg-muted hover:text-fg"
        >
          Next
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-fg">{fighter.name}</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            Drag the line onto the eyes. 0% is the top of the art, 100% the bottom.
            Wide CSS tiles lock that point in the middle of the crop.
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

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex shrink-0 items-stretch gap-2">
          <div
            className="relative aspect-square w-36 cursor-ns-resize touch-none overflow-hidden rounded-[var(--radius-md)] border border-border bg-black select-none sm:w-44"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setYFromPointer(fighter.id, e.currentTarget, e.clientY);
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              setYFromPointer(fighter.id, e.currentTarget, e.clientY);
            }}
          >
            {src ? (
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-cover object-center"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-fg"
                style={fighterTileStyle(fighter.id)}
              >
                {initials(fighter.name)}
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-x-0 z-10"
              style={{ top: `${y}%` }}
            >
              <div className="h-0.5 w-full bg-amber-300 shadow-[0_0_0_1px_rgba(0,0,0,0.55)]" />
              <p className="absolute right-1 top-1 -translate-y-full rounded bg-black/70 px-1 text-[10px] font-medium tabular text-amber-200">
                {y}%
              </p>
            </div>
          </div>

          <label className="flex flex-col items-center justify-between py-0.5">
            <span className="text-[10px] uppercase tracking-wide text-fg-subtle">Face</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={y}
              onChange={(e) => setPortraitFocusY(fighter.id, Number(e.target.value))}
              className="portrait-focus-y"
              aria-label={`Eye line for ${fighter.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={y}
              aria-valuetext={`${y} percent from the top`}
            />
            <span className="tabular text-[11px] font-medium text-fg-muted">{y}%</span>
            <span className="text-[10px] uppercase tracking-wide text-fg-subtle">Chest</span>
          </label>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-fg-subtle">
            Wide CSS crop
          </p>
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-black">
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
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-amber-300/80" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copyText(`${fighter.name} eye line`, `${fighter.id} ${y}`)}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-2.5 text-xs font-medium text-fg-muted hover:text-fg"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy this
        </button>
        <button
          type="button"
          disabled={overrideCount === 0}
          onClick={() => copyText("Eye lines", dump)}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-2.5 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-40"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy all{overrideCount ? ` (${overrideCount})` : ""}
        </button>
        <p className="text-[11px] text-fg-subtle">
          Paste the dump in chat later to hard-code these.
        </p>
      </div>

      {overrideCount > 0 ? (
        <pre className="mt-2 max-h-28 overflow-auto rounded-[var(--radius-md)] border border-border bg-bg px-2.5 py-2 font-mono text-[11px] leading-relaxed text-fg-muted">
          {dump}
        </pre>
      ) : null}
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

function galleryBlurb(tab: GalleryTab): string {
  if (tab === "css") return `All ${ROSTER.length} fighters in character-select order. Tap one to edit its eye line.`;
  if (tab === "name") return `All ${ROSTER.length} fighters — A–Z. Tap one to edit its eye line.`;
  return "Set each fighter’s CSS crop. Previous / Next walk the roster in CSS order.";
}

export function GalleryPanel() {
  const [tab, setTab] = useState<GalleryTab>("css");
  const [focusId, setFocusId] = useState<string>(ROSTER[0]?.id ?? "mario");
  const [pulseKey, setPulseKey] = useState(0);

  const azFighters = useMemo(() => {
    return ROSTER.slice().sort((a, b) => a.name.localeCompare(b.name, "en"));
  }, []);
  const focusIndex = Math.max(0, ROSTER.findIndex((f) => f.id === focusId));
  const focused = ROSTER[focusIndex] ?? ROSTER[0];

  const openEyes = (id: string) => {
    setFocusId(id);
    setPulseKey((k) => k + 1);
    setTab("eyes");
  };

  const stepFighter = (dir: -1 | 1) => {
    const next = (focusIndex + dir + ROSTER.length) % ROSTER.length;
    setFocusId(ROSTER[next].id);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
            Gallery
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{galleryBlurb(tab)}</p>
        </div>

        <div
          role="radiogroup"
          aria-label="Gallery view"
          className="inline-flex h-11 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-bg p-0.5"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center justify-center px-3 text-xs font-semibold transition-colors sm:px-3.5",
                tab === t.id
                  ? "rounded-[calc(var(--radius-lg)-2px)] bg-accent text-accent-fg"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "eyes" && focused ? (
        <EyeLineEditor
          fighter={focused}
          index={focusIndex}
          total={ROSTER.length}
          onPrev={() => stepFighter(-1)}
          onNext={() => stepFighter(1)}
        />
      ) : null}

      {tab === "css" ? (
        <CssRosterBoard
          className="overflow-hidden rounded-[var(--radius-lg)]"
          highlightId={focusId}
          pulse
          pulseKey={pulseKey}
          onSelect={openEyes}
        />
      ) : tab === "name" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {azFighters.map((fighter) => (
            <li key={fighter.id}>
              <PortraitTile
                fighter={fighter}
                focused={focusId === fighter.id}
                onSelect={() => openEyes(fighter.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <CssRosterBoard
          className="overflow-hidden rounded-[var(--radius-lg)]"
          highlightId={focused?.id}
          pulse
          pulseKey={pulseKey}
          onSelect={(id) => {
            setFocusId(id);
            setPulseKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
