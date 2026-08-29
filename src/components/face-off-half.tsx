import { useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from "react";
import { Dices, LayoutGrid, Lock, Maximize2, Minus, Plus, Star, X } from "lucide-react";
import { UniqueDupesToggle } from "@/components/unique-dupes-toggle";
import { RollSfxToggle } from "@/components/roll-sfx-toggle";
import { QuickRollsToggle } from "@/components/quick-rolls-toggle";
import { CssRosterBoard } from "@/components/css-roster-board";
import {
  ROSTER,
  computeProbabilities,
  fighterPortraitUrl,
  fighterTileStyle,
  formatMultiplier,
  formatProbability,
  getWeightValue,
  WEIGHT_MAP,
  initials,
} from "@/lib/roster";
import { isBuiltInProfileId } from "@/lib/profiles";
import { playerBadgeFg, playerColor } from "@/lib/player-colors";
import { type PlayerPick, useRandomizerStore } from "@/lib/store";
import { STOCKS_PER_GAME } from "@/lib/stock-session";
import { cn } from "@/lib/cn";

const PREF_STEP = 0.5;
const PREF_MAX = 10;

function clickWasOnControl(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("button, a, input, textarea, select, [role='button']"));
}

function offsetInAncestor(el: HTMLElement, ancestor: HTMLElement) {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    left += node.offsetLeft;
    top += node.offsetTop;
    const next = node.offsetParent as HTMLElement | null;
    node = next === ancestor || (next && ancestor.contains(next)) ? next : node.parentElement;
  }
  return { left, top, width: el.offsetWidth, height: el.offsetHeight };
}

function CssHeroShrink({
  fighterId,
  name,
  playKey,
  containerRef,
  onDone,
}: {
  fighterId: string;
  name: string;
  playKey: string;
  containerRef: RefObject<HTMLDivElement | null>;
  onDone: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const portrait = fighterPortraitUrl(fighterId);
  const tile = fighterTileStyle(fighterId);

  useEffect(() => {
    const overlay = overlayRef.current;
    const root = containerRef.current;
    if (!overlay || !root) {
      onDoneRef.current();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDoneRef.current();
      return;
    }

    let anim: Animation | null = null;
    const hold = window.setTimeout(() => {
      const tileEl = root.querySelector<HTMLElement>(`#css-tile-${fighterId}`);
      if (!tileEl) {
        onDoneRef.current();
        return;
      }
      const dest = offsetInAncestor(tileEl, root);
      overlay.style.right = "auto";
      overlay.style.bottom = "auto";
      anim = overlay.animate(
        [
          {
            top: "0px",
            left: "0px",
            width: `${root.offsetWidth}px`,
            height: `${root.offsetHeight}px`,
            borderRadius: "0px",
          },
          {
            top: `${dest.top}px`,
            left: `${dest.left}px`,
            width: `${Math.max(dest.width, 1)}px`,
            height: `${Math.max(dest.height, 1)}px`,
            borderRadius: "2px",
          },
        ],
        { duration: 780, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
      );
      anim.onfinish = () => onDoneRef.current();
    }, 1000);

    return () => {
      window.clearTimeout(hold);
      anim?.cancel();
    };
  }, [containerRef, fighterId, playKey]);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute top-0 left-0 z-20 h-full w-full overflow-hidden bg-black shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
      aria-hidden
    >
      {portrait ? (
        <img src={portrait} alt="" draggable={false} className="h-full w-full object-cover object-center" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-7xl font-semibold tracking-tight text-fg" style={tile}>
          {initials(name)}
        </div>
      )}
    </div>
  );
}

export function FaceOffSettings({
  uniqueOnly,
  onUniqueOnly,
  quickRolls,
  onQuickRolls,
  canResetUnique,
  onResetUnique,
  disabled,
  onClose,
}: {
  uniqueOnly: boolean;
  onUniqueOnly: (v: boolean) => void;
  quickRolls: boolean;
  onQuickRolls: (v: boolean) => void;
  canResetUnique: boolean;
  onResetUnique: () => void;
  disabled?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-2.5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Settings</p>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-fg-muted hover:text-fg" aria-label="Close settings">
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <UniqueDupesToggle uniqueOnly={uniqueOnly} onChange={onUniqueOnly} disabled={disabled} />
        <QuickRollsToggle quick={quickRolls} onChange={onQuickRolls} disabled={disabled} />
        <RollSfxToggle />
        {canResetUnique && (
          <button type="button" disabled={disabled} onClick={onResetUnique} className="flex h-11 items-center rounded-[var(--radius-md)] border border-border bg-bg px-2.5 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-40">
            New session
          </button>
        )}
      </div>
    </div>
  );
}

export function FaceOffHalf({
  pick, playerIndex, isSpinning, revealed, reelKey, perPlayerProfiles, emptyHint, stocks, onSelectStocks, wins, losses, view, onToggleView, usedIds, opponentId,
}: {
  pick: PlayerPick | null;
  playerIndex: number;
  isSpinning: boolean;
  revealed: boolean;
  reelKey: number;
  perPlayerProfiles: boolean;
  emptyHint: string;
  stocks: number | null;
  onSelectStocks: (n: number) => void;
  wins: number;
  losses: number;
  view: "portrait" | "css";
  onToggleView: () => void;
  usedIds: readonly string[];
  opponentId?: string | null;
}) {
  const pc = playerColor(playerIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const [heroDone, setHeroDone] = useState(true);
  const heroActive = view === "css" && Boolean(pick) && revealed && !isSpinning;
  const heroKey = `${reelKey}-${pick?.fighter.id ?? ""}`;

  useEffect(() => {
    if (heroActive) setHeroDone(false);
    else setHeroDone(true);
  }, [heroActive, heroKey]);
  const profiles = useRandomizerStore((s) => s.profiles);
  const nudge = useRandomizerStore((s) => s.nudgePlayerFighterWeight);
  const liveProfileId = useRandomizerStore((s) => s.getPlayerProfileId(playerIndex));
  const liveProfile = profiles.find((p) => p.id === liveProfileId) ?? profiles[0];
  const weight = pick ? getWeightValue(liveProfile.weights, pick.fighter.id) : 0;
  const odds = useMemo(() => computeProbabilities(liveProfile.weights), [liveProfile.weights]);
  const chance = pick ? (odds.byId[pick.fighter.id] ?? 0) : 0;
  const isFav = weight >= WEIGHT_MAP.favorite;
  const locked = isBuiltInProfileId(liveProfile.id);
  const canNudge = Boolean(pick) && !isSpinning;
  const atMin = weight <= 0;
  const atMax = weight >= PREF_MAX;
  const portrait = pick ? fighterPortraitUrl(pick.fighter.id) : null;
  const tile = pick ? fighterTileStyle(pick.fighter.id) : undefined;
  const usedSet = useMemo(() => new Set(usedIds), [usedIds]);
  const zeroIds = useMemo(() => {
    const s = new Set<string>();
    for (const f of ROSTER) {
      if (getWeightValue(liveProfile.weights, f.id) <= 0) s.add(f.id);
    }
    return s;
  }, [liveProfile.weights]);
  const foeIndex = playerIndex === 0 ? 1 : 0;
  const foeColor = playerColor(foeIndex);
  const showFoe = Boolean(opponentId) && revealed && !isSpinning;

  const viewToggle = (
    <button type="button" onClick={onToggleView} title={view === "css" ? "Large portrait" : "Character select"} className="flex h-7 items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm hover:bg-black/55">
      {view === "css" ? <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} /> : <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />}
      {view === "css" ? "Face" : "CSS"}
    </button>
  );

  const topBar = (
    <div className="flex h-9 items-center gap-2 px-3">
      <span className="inline-flex h-7 shrink-0 items-center rounded-full px-3 text-sm font-bold uppercase tracking-wider shadow-sm" style={{ background: pc.hex, color: playerBadgeFg(playerIndex) }}>
        P{playerIndex + 1}
      </span>
      <div className="min-w-0">{viewToggle}</div>
      <span className="ml-auto shrink-0 tabular text-sm font-bold text-white drop-shadow-md">
        {wins}–{losses}
      </span>
    </div>
  );

  const stocksRow = !isSpinning && (
    <div className="w-full max-w-sm">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-white/60">Stocks left</p>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: STOCKS_PER_GAME + 1 }, (_, n) => {
          const selected = stocks === n;
          return (
            <button key={n} type="button" onClick={() => onSelectStocks(n)} className={cn("flex h-11 items-center justify-center rounded-[var(--radius-md)] text-lg font-bold tabular backdrop-blur-sm", selected ? "text-bg" : "border border-white/25 bg-black/40 text-white hover:bg-black/55")} style={selected ? { background: pc.hex, color: playerBadgeFg(playerIndex) } : undefined}>
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (view === "css") {
    return (
      <div
        ref={rootRef}
        className="relative flex h-full min-h-0 w-full cursor-pointer flex-col overflow-hidden bg-black"
        style={{ boxShadow: `inset 0 0 0 3px ${pc.hex}` }}
        onClick={(e) => {
          if (clickWasOnControl(e.target)) return;
          onToggleView();
        }}
        title="Show large portrait"
      >
        {heroActive && pick && !heroDone && (
          <CssHeroShrink
            fighterId={pick.fighter.id}
            name={pick.fighter.name}
            playKey={heroKey}
            containerRef={rootRef}
            onDone={() => setHeroDone(true)}
          />
        )}
        <div className="relative z-30 shrink-0">{topBar}</div>
        <div className="min-h-0 flex-1 px-[2px]">
          <CssRosterBoard
            used={usedSet}
            zeroIds={zeroIds}
            highlightId={pick?.fighter.id ?? null}
            pulse={Boolean(pick) && revealed && !isSpinning && heroDone}
            pulseKey={`${reelKey}-${pick?.fighter.id ?? ""}`}
            dimOthers={Boolean(pick) && revealed && !isSpinning}
            markId={showFoe ? opponentId ?? null : null}
            markColor={foeColor.hex}
            markLabel={`P${foeIndex + 1}`}
            fill
            className="h-full"
          />
        </div>
        <div className="relative z-30 flex shrink-0 items-center gap-2 px-2.5 py-1.5">
          <p className="min-w-0 flex-1 truncate text-left text-sm font-bold tracking-tight text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
            {pick ? pick.fighter.name : emptyHint}
          </p>
          <div className={cn("flex shrink-0 gap-1", isSpinning && "invisible")}>
            {Array.from({ length: STOCKS_PER_GAME + 1 }, (_, n) => {
              const selected = stocks === n;
              return (
                <button key={n} type="button" onClick={() => onSelectStocks(n)} disabled={isSpinning} className={cn("flex h-8 w-8 items-center justify-center rounded-[6px] text-sm font-bold tabular", selected ? "text-bg" : "border border-white/25 bg-black/40 text-white hover:bg-black/55")} style={selected ? { background: pc.hex, color: playerBadgeFg(playerIndex) } : undefined} aria-label={`${n} stocks left`}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const onFaceSurfaceClick = (e: MouseEvent<HTMLDivElement>) => {
    if (clickWasOnControl(e.target)) return;
    onToggleView();
  };

  return (
    <div
      className="relative h-full min-h-0 w-full cursor-pointer overflow-hidden bg-bg"
      style={{ boxShadow: `inset 0 0 0 3px ${pc.hex}` }}
      onClick={onFaceSurfaceClick}
      title="Show character select"
    >
      {pick ? (
        <div key={revealed ? `final-${pick.fighter.id}` : `reel-${reelKey}-${playerIndex}`} className={cn("absolute inset-0", isSpinning && "animate-reel", revealed && "animate-result-in")}>
          {portrait ? (
            <img src={portrait} alt="" draggable={false} className="h-full w-full object-cover object-center" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl font-semibold tracking-tight text-fg" style={tile} aria-hidden>
              {initials(pick.fighter.name)}
            </div>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: `linear-gradient(180deg, ${pc.soft} 0%, transparent 55%)` }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-bg-elevated text-fg-subtle">
            <Dices className="h-8 w-8" strokeWidth={1.4} />
          </div>
          <p className="text-sm text-fg-muted">{emptyHint}</p>
        </div>
      )}
      {isSpinning && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
      <div className="absolute inset-x-0 top-0 z-10">{topBar}</div>
      {pick && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 px-3 pb-2.5 pt-8">
          <div className="w-full text-center">
            <p className="line-clamp-2 text-[1.65rem] font-bold leading-[1.05] tracking-tight text-white sm:text-4xl" style={{ textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>
              {pick.fighter.name}
            </p>
            {perPlayerProfiles && <p className="mt-0.5 truncate text-[11px] text-white/70">{liveProfile.name}</p>}
          </div>
          <div className={cn("flex w-full max-w-sm items-center justify-center gap-2", isSpinning && "invisible h-0 overflow-hidden")}>
            <button type="button" disabled={!canNudge || atMin} onClick={() => nudge(playerIndex, pick.fighter.id, -PREF_STEP)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-white/25 bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 active:scale-95 disabled:opacity-30" aria-label={`Decrease preference for ${pick.fighter.name}`}>
              <Minus className="h-5 w-5" strokeWidth={2.4} />
            </button>
            <div className="flex min-w-0 flex-1 flex-col items-center leading-tight">
              <span className={cn("tabular text-lg font-bold tracking-tight", isFav ? "text-amber-300" : "text-white")} style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
                {isFav && <Star className="mr-1 inline h-4 w-4 fill-amber-400 text-amber-400 align-[-2px]" strokeWidth={0} aria-hidden />}
                {formatMultiplier(weight)}
              </span>
              <span className="tabular text-sm font-semibold text-white/90">{formatProbability(chance)}</span>
              {locked && (
                <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide text-white/55">
                  <Lock className="h-2.5 w-2.5" strokeWidth={2.5} /> copies on edit
                </span>
              )}
            </div>
            <button type="button" disabled={!canNudge || atMax} onClick={() => nudge(playerIndex, pick.fighter.id, PREF_STEP)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-white/25 bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 active:scale-95 disabled:opacity-30" aria-label={`Increase preference for ${pick.fighter.name}`}>
              <Plus className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>
          {stocksRow}
        </div>
      )}
    </div>
  );
}
