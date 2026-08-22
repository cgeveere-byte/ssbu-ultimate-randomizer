import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban, Dices, Lock, Minus, Plus, RotateCcw, Star, Users, X } from "lucide-react";
import { FighterMonogram } from "@/components/fighter-tile";
import { UniqueDupesToggle } from "@/components/unique-dupes-toggle";
import { MatchupSheet, SetScoreButton } from "@/components/stock-session-panel";
import {
  type Fighter,
  ROSTER,
  computeProbabilities,
  fighterPortraitUrl,
  fighterTileStyle,
  formatMultiplier,
  formatProbability,
  getWeightValue,
  initials,
} from "@/lib/roster";
import { isBuiltInProfileId } from "@/lib/profiles";
import { playerBadgeFg, playerColor } from "@/lib/player-colors";
import { type PlayerPick, useRandomizerStore } from "@/lib/store";
import { STOCKS_PER_GAME } from "@/lib/stock-session";
import { cn } from "@/lib/cn";

const PREF_STEP = 0.5;
const PREF_MAX = 10;

/**
 * Full-screen party mode: big hit targets.
 * Face-off (chess-clock): one side upright, the other rotated 180°.
 * Preference − / + on each half edits that player's profile (built-ins are copied first).
 */
export function GameMode({ onExit }: { onExit: () => void }) {
  const playerCount = useRandomizerStore((s) => s.playerCount);
  const setPlayerCount = useRandomizerStore((s) => s.setPlayerCount);
  const uniqueOnly = useRandomizerStore((s) => s.uniqueOnly);
  const setUniqueOnly = useRandomizerStore((s) => s.setUniqueOnly);
  const usedFighterIds = useRandomizerStore((s) => s.usedFighterIds);
  const resetUsedFighters = useRandomizerStore((s) => s.resetUsedFighters);
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
  const [faceOff, setFaceOff] = useState(false);
  const [p1Stocks, setP1Stocks] = useState<number | null>(null);
  const [p2Stocks, setP2Stocks] = useState<number | null>(null);
  const [showMatchups, setShowMatchups] = useState(false);
  const timers = useRef<number[]>([]);

  const stockGames = useRandomizerStore((s) => s.stockGames);
  const recordStockGame = useRandomizerStore((s) => s.recordStockGame);
  const clearStockSession = useRandomizerStore((s) => s.clearStockSession);

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

  const canRoll = useRandomizerStore((s) => s.canRoll());

  // Face-off only makes sense with exactly 2 players
  useEffect(() => {
    if (faceOff && playerCount !== 2) {
      setFaceOff(false);
    }
  }, [faceOff, playerCount]);

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

  const saveStockResult = () => {
    const a = displayPicks.length > 0 ? displayPicks : lastPicks;
    const p1 = a[0];
    const p2 = a[1];
    if (!p1 || !p2 || p1Stocks == null || p2Stocks == null) return;
    recordStockGame({
      p1FighterId: p1.fighter.id,
      p2FighterId: p2.fighter.id,
      p1Stocks,
      p2Stocks,
      timedOut: false,
    });
    setP1Stocks(null);
    setP2Stocks(null);
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
    setP1Stocks(null);
    setP2Stocks(null);

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

  const enableFaceOff = () => {
    if (playerCount !== 2) setPlayerCount(2);
    setFaceOff(true);
  };

  const disableFaceOff = () => setFaceOff(false);

  const shown = displayPicks.length > 0 ? displayPicks : lastPicks;
  const cols = Math.min(shown.length || playerCount, 4);
  const uniqueExhausted =
    uniqueOnly &&
    !canRoll &&
    usedFighterIds.slice(0, playerCount).some((ids) => ids.length > 0);

  // ── Face-off (chess-clock) layout ──────────────────────────────────────
  if (faceOff && playerCount === 2) {
    const p1 = shown[0] ?? null;
    const p2 = shown[1] ?? null;
    const canSave =
      p1 != null &&
      p2 != null &&
      p1Stocks != null &&
      p2Stocks != null;
    const p1Wins = stockGames.filter((g) => g.p1Stocks > g.p2Stocks).length;
    const p2Wins = stockGames.filter((g) => g.p2Stocks > g.p1Stocks).length;

    return (
      <div
        className="fixed inset-0 z-[80] flex flex-col bg-bg text-fg"
        role="dialog"
        aria-modal="true"
        aria-label="Game mode face-off"
      >
        {/* Opponent half — rotated 180° so it faces them across the table */}
        <div
          className="relative min-h-0 flex-1 overflow-hidden"
          style={{ transform: "rotate(180deg)" }}
        >
          <FaceOffHalf
            pick={p2}
            playerIndex={1}
            isSpinning={isSpinning}
            revealed={revealed}
            reelKey={reelKey}
            perPlayerProfiles={perPlayerProfiles}
            emptyHint="Waiting…"
            stocks={p2Stocks}
            onSelectStocks={setP2Stocks}
            wins={p2Wins}
            losses={p1Wins}
          />
        </div>

        {/* Shared control strip in the middle (readable from either side) */}
        <div className="relative z-10 shrink-0 border-y border-border bg-bg-elevated/95 px-2 py-1.5 backdrop-blur-sm sm:px-3">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-1.5">
            {showMatchups ? (
              <MatchupSheet
                games={stockGames}
                onReset={() => {
                  clearStockSession();
                  setShowMatchups(false);
                }}
                onClose={() => setShowMatchups(false)}
              />
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onExit}
                    disabled={isSpinning}
                    className="flex h-10 items-center gap-1 rounded-[var(--radius-md)] border border-border bg-bg px-2 text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-40"
                    aria-label="Exit game mode"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                    Exit
                  </button>

                  <button
                    type="button"
                    disabled={isSpinning}
                    onClick={disableFaceOff}
                    className="flex h-10 items-center gap-1 rounded-[var(--radius-md)] border border-border bg-bg px-2 text-xs font-medium text-fg-muted"
                    title="Switch back to standard layout"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                    Standard
                  </button>

                  <div className="flex-1" />

                  <SetScoreButton
                    games={stockGames}
                    onClick={() => setShowMatchups(true)}
                  />

                  <UniqueDupesToggle
                    uniqueOnly={uniqueOnly}
                    onChange={setUniqueOnly}
                    disabled={isSpinning}
                  />
                  {uniqueOnly &&
                    usedFighterIds.slice(0, 2).some((ids) => ids.length > 0) && (
                      <button
                        type="button"
                        disabled={isSpinning}
                        onClick={resetUsedFighters}
                        className="flex h-10 items-center rounded-[var(--radius-md)] border border-border bg-bg px-2 text-xs font-medium text-fg-muted"
                        title="Allow previously rolled fighters again"
                      >
                        Reset
                      </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={saveStockResult}
                    disabled={!canSave || isSpinning}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold",
                      canSave
                        ? "bg-accent text-accent-fg"
                        : "border border-border bg-bg text-fg-muted",
                    )}
                  >
                    {canSave ? `Save ${p1Stocks}–${p2Stocks}` : "Tap stocks left"}
                  </button>

                  <button
                    type="button"
                    onClick={spin}
                    disabled={isSpinning || !canRoll}
                    className={cn(
                      "flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-[var(--radius-md)] text-base font-bold tracking-tight transition-[opacity,transform] duration-150 active:scale-[0.99]",
                      "bg-accent text-accent-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30",
                      "disabled:pointer-events-none disabled:opacity-45",
                    )}
                  >
                    {isSpinning ? (
                      "Spinning…"
                    ) : uniqueExhausted ? (
                      <>
                        <Ban className="h-5 w-5" />
                        Reset unique
                      </>
                    ) : !canRoll ? (
                      <>
                        <Ban className="h-5 w-5" />
                        No fighters
                      </>
                    ) : (
                      <>
                        <Dices className="h-5 w-5" strokeWidth={2} />
                        Randomize
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Your half — normal orientation */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <FaceOffHalf
            pick={p1}
            playerIndex={0}
            isSpinning={isSpinning}
            revealed={revealed}
            reelKey={reelKey}
            perPlayerProfiles={perPlayerProfiles}
            emptyHint="Tap Randomize"
            stocks={p1Stocks}
            onSelectStocks={setP1Stocks}
            wins={p1Wins}
            losses={p2Wins}
          />
        </div>
      </div>
    );
  }

  // ── Standard multi-player layout ───────────────────────────────────────
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
          {/* Player count + face-off toggle */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={playerCount <= 1 || isSpinning}
              onClick={() => setPlayerCount(playerCount - 1)}
              className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-bg text-fg hover:bg-bg-subtle disabled:opacity-30"
              aria-label="Fewer players"
            >
              <Minus className="h-6 w-6" strokeWidth={2.25} />
            </button>
            <div className="flex min-w-[5.5rem] flex-col items-center">
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
            <UniqueDupesToggle
              uniqueOnly={uniqueOnly}
              onChange={setUniqueOnly}
              disabled={isSpinning}
              size="lg"
            />
            {uniqueOnly &&
              usedFighterIds.slice(0, playerCount).some((ids) => ids.length > 0) && (
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={resetUsedFighters}
                  className="flex h-14 items-center rounded-[var(--radius-lg)] border border-border bg-bg px-3 text-sm font-medium text-fg-muted hover:text-fg disabled:opacity-40"
                  title="Allow previously rolled fighters again"
                >
                  Reset unique
                </button>
              )}
            <button
              type="button"
              disabled={isSpinning}
              onClick={enableFaceOff}
              className={cn(
                "flex h-14 items-center gap-1.5 rounded-[var(--radius-lg)] border px-3 text-sm font-semibold transition-colors sm:px-4",
                "border-border-strong bg-bg-subtle text-fg hover:bg-bg",
              )}
              title="2-player face-off: one side faces you, the other faces your opponent (chess-clock style)"
            >
              <Users className="h-4 w-4" strokeWidth={2} />
              Face-off
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
            ) : uniqueExhausted ? (
              <>
                <Ban className="h-7 w-7" />
                Reset unique pool
              </>
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

/** One half of the face-off (chess-clock) screen — portrait fills the pane. */
function FaceOffHalf({
  pick,
  playerIndex,
  isSpinning,
  revealed,
  reelKey,
  perPlayerProfiles,
  emptyHint,
  stocks,
  onSelectStocks,
  wins,
  losses,
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
}) {
  const pc = playerColor(playerIndex);
  const profiles = useRandomizerStore((s) => s.profiles);
  const activeProfileId = useRandomizerStore((s) => s.activeProfileId);
  const playerProfileIds = useRandomizerStore((s) => s.playerProfileIds);
  const perPlayer = useRandomizerStore((s) => s.perPlayerProfiles);
  const nudge = useRandomizerStore((s) => s.nudgePlayerFighterWeight);

  const liveProfileId = !perPlayer
    ? activeProfileId
    : (playerProfileIds[playerIndex] ?? activeProfileId);
  const liveProfile =
    profiles.find((p) => p.id === liveProfileId) ?? profiles[0];

  const weight = pick
    ? getWeightValue(liveProfile.weights, pick.fighter.id)
    : 0;
  const odds = useMemo(
    () => computeProbabilities(liveProfile.weights),
    [liveProfile.weights],
  );
  const chance = pick ? (odds.byId[pick.fighter.id] ?? 0) : 0;
  const isFav = weight >= 2;
  const locked = isBuiltInProfileId(liveProfile.id);
  const canNudge = Boolean(pick) && !isSpinning;
  const atMin = weight <= 0;
  const atMax = weight >= PREF_MAX;

  const portrait = pick ? fighterPortraitUrl(pick.fighter.id) : null;
  const tile = pick ? fighterTileStyle(pick.fighter.id) : undefined;

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden bg-bg"
      style={{ boxShadow: `inset 0 0 0 3px ${pc.hex}` }}
    >
      {pick ? (
        <div
          key={
            revealed
              ? `final-${pick.fighter.id}`
              : `reel-${reelKey}-${playerIndex}`
          }
          className={cn(
            "absolute inset-0",
            isSpinning && "animate-reel",
            revealed && "animate-result-in",
          )}
        >
          {portrait ? (
            <img
              src={portrait}
              alt=""
              draggable={false}
              className={cn(
                "h-full w-full object-cover object-center",
              )}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-7xl font-semibold tracking-tight text-fg"
              style={tile}
              aria-hidden
            >
              {initials(pick.fighter.name)}
            </div>
          )}
        </div>
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{
            background: `linear-gradient(180deg, ${pc.soft} 0%, transparent 55%)`,
          }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-bg-elevated text-fg-subtle">
            <Dices className="h-8 w-8" strokeWidth={1.4} />
          </div>
          <p className="text-sm text-fg-muted">{emptyHint}</p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/50 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between px-3 pt-2.5">
        <span
          className="inline-flex h-7 items-center rounded-full px-3 text-sm font-bold uppercase tracking-wider shadow-sm"
          style={{ background: pc.hex, color: playerBadgeFg(playerIndex) }}
        >
          P{playerIndex + 1}
        </span>
        <span className="tabular text-sm font-bold text-white drop-shadow-md">
          {wins}–{losses}
        </span>
      </div>

      {pick && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 px-3 pb-2.5 pt-8">
          <div className="w-full text-center">
            <p
              className="line-clamp-2 text-[1.65rem] font-bold leading-[1.05] tracking-tight text-white sm:text-4xl"
              style={{ textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}
            >
              {pick.fighter.name}
            </p>
            {perPlayerProfiles && (
              <p className="mt-0.5 truncate text-[11px] text-white/70">
                {liveProfile.name}
              </p>
            )}
          </div>

          <div
            className={cn(
              "flex w-full max-w-sm items-center justify-center gap-2",
              isSpinning && "invisible h-0 overflow-hidden",
            )}
          >
            <button
              type="button"
              disabled={!canNudge || atMin}
              onClick={() => nudge(playerIndex, pick.fighter.id, -PREF_STEP)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-white/25 bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 active:scale-95 disabled:opacity-30"
              aria-label={`Decrease preference for ${pick.fighter.name}`}
            >
              <Minus className="h-5 w-5" strokeWidth={2.4} />
            </button>

            <div className="flex min-w-0 flex-1 flex-col items-center leading-tight">
              <span
                className={cn(
                  "tabular text-lg font-bold tracking-tight",
                  isFav ? "text-amber-300" : "text-white",
                )}
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
              >
                {isFav && (
                  <Star
                    className="mr-1 inline h-4 w-4 fill-amber-400 text-amber-400 align-[-2px]"
                    strokeWidth={0}
                    aria-hidden
                  />
                )}
                {formatMultiplier(weight)}
              </span>
              <span className="tabular text-sm font-semibold text-white/90">
                {formatProbability(chance)}
              </span>
              {locked && (
                <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide text-white/55">
                  <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                  copies on edit
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={!canNudge || atMax}
              onClick={() => nudge(playerIndex, pick.fighter.id, PREF_STEP)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-white/25 bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 active:scale-95 disabled:opacity-30"
              aria-label={`Increase preference for ${pick.fighter.name}`}
            >
              <Plus className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>

          {!isSpinning && (
            <div className="w-full max-w-sm">
              <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-white/60">
                Stocks left
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: STOCKS_PER_GAME + 1 }, (_, n) => {
                  const selected = stocks === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onSelectStocks(n)}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-[var(--radius-md)] text-lg font-bold tabular backdrop-blur-sm",
                        selected
                          ? "text-bg"
                          : "border border-white/25 bg-black/40 text-white hover:bg-black/55",
                      )}
                      style={
                        selected
                          ? { background: pc.hex, color: playerBadgeFg(playerIndex) }
                          : undefined
                      }
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
