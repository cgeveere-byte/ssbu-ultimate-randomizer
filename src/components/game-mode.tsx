import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban, Dices, Minus, Plus, X } from "lucide-react";
import { FighterMonogram } from "@/components/fighter-tile";
import {
  type Fighter,
  ROSTER,
} from "@/lib/roster";
import { profileEligibleCount } from "@/lib/profiles";
import { playerBadgeFg, playerColor } from "@/lib/player-colors";
import { type PlayerPick, useRandomizerStore } from "@/lib/store";
import { cn } from "@/lib/cn";

/**
 * Full-screen party mode: big hit targets, no weight/profile editing.
 * Settings stay whatever was configured in the main UI.
 */
export function GameMode({ onExit }: { onExit: () => void }) {
  const playerCount = useRandomizerStore((s) => s.playerCount);
  const setPlayerCount = useRandomizerStore((s) => s.setPlayerCount);
  const uniqueOnly = useRandomizerStore((s) => s.uniqueOnly);
  const setUniqueOnly = useRandomizerStore((s) => s.setUniqueOnly);
  const isSpinning = useRandomizerStore((s) => s.isSpinning);
  const setSpinning = useRandomizerStore((s) => s.setSpinning);
  const lastPicks = useRandomizerStore((s) => s.lastPicks);
  const setLastPicks = useRandomizerStore((s) => s.setLastPicks);
  const pushHistory = useRandomizerStore((s) => s.pushHistory);
  const roll = useRandomizerStore((s) => s.roll);
  const profiles = useRandomizerStore((s) => s.profiles);
  const activeProfileId = useRandomizerStore((s) => s.activeProfileId);
  const perPlayerProfiles = useRandomizerStore((s) => s.perPlayerProfiles);
  const playerProfileIds = useRandomizerStore((s) => s.playerProfileIds);

  const [displayPicks, setDisplayPicks] = useState<PlayerPick[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [reelKey, setReelKey] = useState(0);
  const timers = useRef<number[]>([]);

  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const getProfile = useCallback(
    (id: string | null | undefined) => {
      if (!id) return active;
      return profiles.find((p) => p.id === id) ?? active;
    },
    [profiles, active],
  );

  const getPlayerProfileId = useCallback(
    (playerIndex: number) => {
      if (!perPlayerProfiles) return activeProfileId;
      return playerProfileIds[playerIndex] ?? activeProfileId;
    },
    [perPlayerProfiles, playerProfileIds, activeProfileId],
  );

  const canRoll = useMemo(() => {
    for (let i = 0; i < playerCount; i++) {
      const pid = getPlayerProfileId(i);
      const profile = getProfile(pid);
      if (profileEligibleCount(profile.weights) === 0) return false;
    }
    return playerCount > 0;
  }, [playerCount, getPlayerProfileId, getProfile]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // Lock body scroll while game mode is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const flashPool = useCallback((): Fighter[] => {
    const s = useRandomizerStore.getState();
    const ids = new Set<string>();
    const list: Fighter[] = [];
    for (let i = 0; i < s.playerCount; i++) {
      const pid = s.getPlayerProfileId(i);
      for (const p of s.getPool(pid)) {
        if (p.weight > 0 && !ids.has(p.fighter.id)) {
          ids.add(p.fighter.id);
          list.push(p.fighter);
        }
      }
    }
    if (list.length === 0) return ROSTER.slice();
    return list;
  }, []);

  const spin = useCallback(() => {
    if (isSpinning) return;
    if (!canRoll) return;

    clearTimers();
    setSpinning(true);
    setRevealed(false);

    const final = roll();
    if (final.length === 0) {
      setSpinning(false);
      return;
    }

    const pool = flashPool();
    const duration = 1600;
    const start = performance.now();
    let lastTick = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const interval = 40 + progress * 180;
      if (now - lastTick >= interval) {
        lastTick = now;
        const n = final.length;
        const flash: PlayerPick[] = [];
        for (let i = 0; i < n; i++) {
          const f = pool[Math.floor(Math.random() * pool.length)] ?? final[i].fighter;
          flash.push({
            fighter: f,
            profileId: final[i].profileId,
            profileName: final[i].profileName,
          });
        }
        setDisplayPicks(flash);
        setReelKey((k) => k + 1);
      }
      if (progress < 1) {
        const id = window.setTimeout(() => {
          requestAnimationFrame(tick);
        }, 16);
        timers.current.push(id);
      } else {
        setDisplayPicks(final);
        setLastPicks(final);
        pushHistory(final);
        setRevealed(true);
        setSpinning(false);
      }
    };

    setDisplayPicks(
      Array.from({ length: final.length }, (_, i) => ({
        fighter: pool[Math.floor(Math.random() * pool.length)]!,
        profileId: final[i].profileId,
        profileName: final[i].profileName,
      })),
    );
    requestAnimationFrame(tick);
  }, [
    canRoll,
    flashPool,
    isSpinning,
    pushHistory,
    roll,
    setLastPicks,
    setSpinning,
  ]);

  const shown = displayPicks.length > 0 ? displayPicks : lastPicks;
  const cols = Math.min(shown.length || playerCount, 4);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-bg text-fg"
      role="dialog"
      aria-modal="true"
      aria-label="Game mode"
    >
      {/* Top bar — exit is deliberately small and away from the big Randomize button */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onExit}
          disabled={isSpinning}
          className="flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-40"
          aria-label="Exit game mode"
        >
          <X className="h-4 w-4" strokeWidth={2} />
          Exit
        </button>
        <div className="min-w-0 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-fg-subtle">
            Game mode
          </p>
          <p className="truncate text-sm text-fg-muted">
            {perPlayerProfiles
              ? "Per-player profiles · read-only"
              : `Profile · ${active.name}`}
          </p>
        </div>
        <div className="w-[4.5rem] sm:w-[5.5rem]" aria-hidden />
      </div>

      {/* Results — large selection boxes */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[var(--radius-xl)] border border-border bg-bg-elevated text-fg-subtle">
              <Dices className="h-12 w-12" strokeWidth={1.4} />
            </div>
            <p className="max-w-xs text-base text-fg-muted">
              Tap Randomize for a full-screen pick. No weight editing here.
            </p>
          </div>
        ) : (
          <div
            key={
              revealed
                ? `final-${shown.map((s) => s.fighter.id).join()}`
                : `reel-${reelKey}`
            }
            className={cn(
              "grid w-full max-w-5xl gap-3 sm:gap-4",
              isSpinning && "animate-reel",
              revealed && "animate-result-in",
            )}
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {shown.map((pick, i) => {
              const pc = playerColor(i);
              return (
                <div
                  key={`game-slot-${i}`}
                  className="flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border-2 px-3 py-5 sm:min-h-[14rem] sm:gap-4 sm:px-4 sm:py-6"
                  style={{
                    borderColor: pc.hex,
                    background: `linear-gradient(180deg, ${pc.soft}, transparent 65%)`,
                    boxShadow: `0 0 0 1px ${pc.soft}`,
                  }}
                >
                  <span
                    className="inline-flex h-8 items-center rounded-full px-3 text-sm font-bold uppercase tracking-wider sm:h-9 sm:px-4 sm:text-base"
                    style={{ background: pc.hex, color: playerBadgeFg(i) }}
                  >
                    P{i + 1}
                  </span>
                  <FighterMonogram
                    fighter={pick.fighter}
                    size="xl"
                    className="!h-20 !w-20 !text-3xl sm:!h-28 sm:!w-28 sm:!text-4xl"
                  />
                  <div className="w-full text-center">
                    <p className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-fg sm:text-2xl">
                      {pick.fighter.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-fg-subtle sm:text-base">
                      {pick.fighter.seriesLabel}
                    </p>
                    {(perPlayerProfiles || playerCount > 1) && (
                      <p className="mt-1 truncate text-xs text-fg-muted sm:text-sm">
                        {pick.profileName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom controls — big, hard to miss, away from Exit */}
      <div className="shrink-0 border-t border-border bg-bg-elevated px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {/* Player count — large taps */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={playerCount <= 1 || isSpinning}
              onClick={() => setPlayerCount(playerCount - 1)}
              className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-bg text-fg hover:bg-bg-subtle disabled:opacity-30"
              aria-label="Fewer players"
            >
              <Minus className="h-6 w-6" strokeWidth={2.25} />
            </button>
            <div className="flex min-w-[7rem] flex-col items-center">
              <span className="text-xs uppercase tracking-wide text-fg-subtle">
                Players
              </span>
              <span
                className="tabular text-3xl font-bold leading-none"
                style={{ color: playerColor(playerCount - 1).hex }}
              >
                {playerCount}
              </span>
            </div>
            <button
              type="button"
              disabled={playerCount >= 8 || isSpinning}
              onClick={() => setPlayerCount(playerCount + 1)}
              className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-bg text-fg hover:bg-bg-subtle disabled:opacity-30"
              aria-label="More players"
            >
              <Plus className="h-6 w-6" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setUniqueOnly(!uniqueOnly)}
              className={cn(
                "ml-1 flex h-14 items-center rounded-[var(--radius-lg)] border px-4 text-sm font-semibold transition-colors",
                uniqueOnly
                  ? "border-border-strong bg-bg-subtle text-fg"
                  : "border-border bg-bg text-fg-muted",
              )}
            >
              {uniqueOnly ? "Unique" : "Dupes OK"}
            </button>
          </div>

          {/* Primary action */}
          <button
            type="button"
            onClick={spin}
            disabled={isSpinning || !canRoll}
            className={cn(
              "flex h-16 w-full items-center justify-center gap-3 rounded-[var(--radius-xl)] text-xl font-bold tracking-tight transition-[opacity,transform] duration-150 active:scale-[0.99] sm:h-20 sm:text-2xl",
              "bg-accent text-accent-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30",
              "disabled:pointer-events-none disabled:opacity-45",
            )}
          >
            {isSpinning ? (
              "Spinning…"
            ) : !canRoll ? (
              <>
                <Ban className="h-7 w-7" />
                No fighters available
              </>
            ) : (
              <>
                <Dices className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
                Randomize
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
