import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dices, Users, Ban, Minus, Plus, Star, ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FighterMonogram } from "@/components/fighter-tile";
import { UniqueDupesToggle } from "@/components/unique-dupes-toggle";
import { RollSfxToggle } from "@/components/roll-sfx-toggle";
import {
  type Fighter,
  ROSTER,
  WEIGHT_PRESETS,
  WEIGHT_MAP,
  computeProbabilities,
  formatMultiplier,
  formatProbability,
  getWeightValue,
  resolveWeightLevel,
} from "@/lib/roster";
import { playerBadgeFg, playerColor } from "@/lib/player-colors";
import { type PlayerPick, useRandomizerStore } from "@/lib/store";
import { playRollLock, playRollTick, unlockRollSound } from "@/lib/roll-sound";
import { cn } from "@/lib/cn";

export function RandomizerStage({
  onEditProfiles,
}: {
  onEditProfiles?: () => void;
}) {
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
  const setPerPlayerProfiles = useRandomizerStore((s) => s.setPerPlayerProfiles);
  const playerProfileIds = useRandomizerStore((s) => s.playerProfileIds);
  const setPlayerProfile = useRandomizerStore((s) => s.setPlayerProfile);
  const applyActiveToPlayers = useRandomizerStore((s) => s.applyActiveToPlayers);

  const [displayPicks, setDisplayPicks] = useState<PlayerPick[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [reelKey, setReelKey] = useState(0);
  const timers = useRef<number[]>([]);

  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const odds = useMemo(() => computeProbabilities(active.weights), [active.weights]);

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
  const uniqueExhausted =
    uniqueOnly &&
    !canRoll &&
    usedFighterIds.slice(0, playerCount).some((ids) => ids.length > 0);

  const maxPlayers = 8;

  const topOdds = useMemo(() => {
    return ROSTER.map((f) => ({
      fighter: f,
      p: odds.byId[f.id] ?? 0,
      w: getWeightValue(active.weights, f.id),
    }))
      .filter((x) => x.p > 0)
      .sort((a, b) => b.p - a.p)
      .slice(0, 6);
  }, [odds, active.weights]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
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
    unlockRollSound();
    setSpinning(true);
    setRevealed(false);

    const final = roll();
    if (final.length === 0) {
      setSpinning(false);
      return;
    }

    const pool = flashPool();
    const duration = 3200;
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
        playRollTick(progress);
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
        playRollLock();
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

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-bg-elevated shadow-[var(--shadow-soft)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, var(--color-accent) 8%, transparent), transparent 70%)",
        }}
      />

      <div className="relative flex flex-col gap-4 p-5 sm:gap-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-fg-subtle">
              Character select
            </p>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              Random fighter
            </h2>
          </div>
          <Button
            size="lg"
            onClick={spin}
            disabled={isSpinning || !canRoll}
            className="w-full shrink-0 sm:w-auto sm:min-w-[11rem]"
          >
            {isSpinning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Spinning…
              </>
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
                <Dices className="h-5 w-5" />
                Randomize
              </>
            )}
          </Button>
        </div>

        {!perPlayerProfiles && topOdds.length > 0 && (
          <div className="rounded-[var(--radius-lg)] border border-border bg-bg px-3 py-3 sm:px-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-fg">
                Odds right now
                <span className="ml-1.5 font-normal text-fg-subtle">
                  single pick · {active.name} · includes custom weights
                </span>
              </p>
              <p className="tabular text-[11px] text-fg-subtle">
                Equal share ≈ {formatProbability(1 / Math.max(odds.eligible, 1))} if all ×1
              </p>
            </div>
            <ul className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1.5">
              {topOdds.map(({ fighter, p, w }) => (
                <li
                  key={fighter.id}
                  className="flex min-w-0 items-center gap-2 text-xs text-fg-muted"
                >
                  <span className="truncate font-medium text-fg">{fighter.name}</span>
                  <span className="tabular text-fg-subtle">{formatMultiplier(w)}</span>
                  <span className="tabular font-semibold text-fg">{formatProbability(p)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Results box */}
        <div
          className={cn(
            "flex min-h-[200px] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-border bg-bg px-4 py-8 sm:min-h-[240px]",
            revealed && "animate-pulse-ring",
          )}
        >
          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-bg-subtle text-fg-subtle">
                <Dices className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-fg-muted">Hit randomize to draw from your pool</p>
              {onEditProfiles && (
                <button
                  type="button"
                  onClick={onEditProfiles}
                  className="text-xs text-fg-subtle underline-offset-2 hover:text-fg hover:underline"
                >
                  Set up bans & favorites first
                </button>
              )}
            </div>
          ) : (
            <div
              key={
                revealed
                  ? `final-${shown.map((s) => s.fighter.id).join()}`
                  : `reel-${reelKey}`
              }
              className={cn(
                "grid w-full justify-center gap-2 sm:gap-3",
                isSpinning && "animate-reel",
                revealed && "animate-result-in",
              )}
              style={{
                gridTemplateColumns: `repeat(${Math.min(shown.length, 4)}, minmax(0, 7.25rem))`,
              }}
            >
              {shown.map((pick, i) => {
                const profile = getProfile(pick.profileId);
                const w = getWeightValue(profile.weights, pick.fighter.id);
                const level = resolveWeightLevel(w);
                const profileOdds = computeProbabilities(profile.weights);
                const p = profileOdds.byId[pick.fighter.id] ?? 0;
                const pc = playerColor(i);
                const isFav = w >= WEIGHT_MAP.favorite;
                const isRare = w > 0 && w < 1;
                const badgeVariant =
                  w <= 0
                    ? "never"
                    : isFav
                      ? "favorite"
                      : level === "often"
                        ? "often"
                        : level === "rare"
                          ? "rare"
                          : level === "custom"
                            ? "default"
                            : "normal";
                return (
                  <div
                    key={`slot-${i}`}
                    className="flex h-[11.5rem] w-full flex-col items-center gap-1.5 rounded-[var(--radius-md)] border px-2 py-2 sm:h-[12rem]"
                    style={{
                      borderColor: pc.ring,
                      background: `linear-gradient(180deg, ${pc.soft}, transparent 70%)`,
                    }}
                  >
                    <span
                      className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: pc.hex,
                        color: playerBadgeFg(i),
                      }}
                    >
                      P{i + 1}
                    </span>
                    <div className="relative">
                      <FighterMonogram fighter={pick.fighter} size="lg" className="!h-14 !w-14 !text-base" />
                      {isSpinning && (
                        <div className="pointer-events-none absolute -inset-1 rounded-full border-2 border-fg-subtle/25 border-t-fg animate-spin" />
                      )}
                    </div>
                    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-start text-center">
                      <p className="line-clamp-2 w-full text-xs font-semibold leading-tight tracking-tight text-fg sm:text-[13px]">
                        {pick.fighter.name}
                      </p>
                      <p className="mt-0.5 w-full truncate text-[10px] text-fg-subtle">
                        {pick.fighter.seriesLabel}
                      </p>
                      {(perPlayerProfiles || playerCount > 1) && (
                        <p className="mt-0.5 w-full truncate text-[10px] text-fg-muted">
                          {pick.profileName}
                        </p>
                      )}
                    </div>
                    {/* Fixed-height meta row so card size never jumps mid-spin */}
                    <div
                      className={cn(
                        "flex h-8 shrink-0 flex-col items-center justify-center gap-0.5",
                        isSpinning && "invisible",
                      )}
                    >
                      <Badge
                        variant={badgeVariant}
                        className={cn("!px-1.5 !py-0 !text-[10px]", (isFav || isRare) && "gap-0.5")}
                      >
                        {isFav && (
                          <Star
                            className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                            strokeWidth={0}
                            aria-hidden
                          />
                        )}
                        {isRare && !isFav && (
                          <ArrowDown className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                        )}
                        {isFav
                          ? "Fav"
                          : level === "custom"
                            ? "Custom"
                            : (WEIGHT_PRESETS.find((x) => x.id === level)?.label ?? "Normal")}
                      </Badge>
                      <p
                        className={cn(
                          "tabular text-[10px]",
                          isFav ? "text-amber-300" : "text-fg-muted",
                        )}
                      >
                        {formatMultiplier(w)}
                        <span className="mx-1 text-fg-subtle" aria-hidden>
                          ·
                        </span>
                        {formatProbability(p)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Player count + profile assignment below the result box */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-bg px-2 py-1.5">
              <Users className="ml-1 h-4 w-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
              <span className="text-xs text-fg-muted">Players</span>
              <div className="flex items-center gap-1 sm:hidden">
                <button
                  type="button"
                  disabled={playerCount <= 1 || isSpinning}
                  onClick={() => setPlayerCount(playerCount - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-bg-subtle hover:text-fg disabled:opacity-30"
                  aria-label="Fewer players"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span
                  className="tabular flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-sm)] px-1.5 text-center text-sm font-bold"
                  style={{
                    background: playerColor(playerCount - 1).hex,
                    color: playerBadgeFg(playerCount - 1),
                  }}
                >
                  {playerCount}
                </span>
                <button
                  type="button"
                  disabled={playerCount >= maxPlayers || isSpinning}
                  onClick={() => setPlayerCount(playerCount + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-bg-subtle hover:text-fg disabled:opacity-30"
                  aria-label="More players"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
                  const pc = playerColor(n - 1);
                  const activeSlot = playerCount === n;
                  const inRange = n <= playerCount;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={isSpinning}
                      onClick={() => setPlayerCount(n)}
                      title={`Player ${n} · ${pc.name}`}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-xs font-bold transition-[transform,box-shadow,opacity] duration-150",
                        activeSlot && "scale-105",
                      )}
                      style={{
                        background: inRange ? pc.hex : "transparent",
                        color: inRange ? playerBadgeFg(n - 1) : pc.hex,
                        boxShadow: activeSlot
                          ? `0 0 0 2px ${pc.hex}, 0 0 0 4px ${pc.soft}`
                          : inRange
                            ? undefined
                            : `inset 0 0 0 1.5px ${pc.hex}`,
                        opacity: inRange || activeSlot ? 1 : 0.55,
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <UniqueDupesToggle
              uniqueOnly={uniqueOnly}
              onChange={setUniqueOnly}
              disabled={isSpinning}
            />
            <RollSfxToggle />
            {uniqueOnly &&
              usedFighterIds.slice(0, playerCount).some((ids) => ids.length > 0) && (
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={resetUsedFighters}
                  className="flex h-11 items-center rounded-[var(--radius-md)] border border-border bg-bg px-3 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-40"
                  title="Allow previously rolled fighters again"
                >
                  Reset unique
                </button>
              )}

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setPerPlayerProfiles(!perPlayerProfiles)}
              className={cn(
                "flex h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-xs font-medium transition-colors duration-150",
                perPlayerProfiles
                  ? "border-border-strong bg-bg-subtle text-fg"
                  : "border-border bg-bg text-fg-muted hover:text-fg",
              )}
            >
              Per-player profiles
            </button>
          </div>

          {perPlayerProfiles && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-fg">Player profile assignment</p>
                <div className="flex flex-wrap items-center gap-1">
                  {onEditProfiles && (
                    <Button size="sm" variant="ghost" disabled={isSpinning} onClick={onEditProfiles}>
                      Manage profiles
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isSpinning}
                    onClick={applyActiveToPlayers}
                  >
                    Apply “{active.name}” to all
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: playerCount }, (_, i) => {
                  const assigned = playerProfileIds[i];
                  const effectiveId = getPlayerProfileId(i);
                  const profile = getProfile(effectiveId);
                  const pOdds = computeProbabilities(profile.weights);
                  const pc = playerColor(i);
                  return (
                    <label
                      key={i}
                      className="flex flex-col gap-1 rounded-[var(--radius-md)] border bg-bg-elevated px-2.5 py-2"
                      style={{
                        borderColor: pc.ring,
                        boxShadow: `inset 3px 0 0 ${pc.hex}`,
                        background: `linear-gradient(90deg, ${pc.soft}, transparent 40%)`,
                      }}
                    >
                      <span
                        className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                        style={{ background: pc.hex, color: playerBadgeFg(i) }}
                      >
                        P{i + 1}
                      </span>
                      <select
                        disabled={isSpinning}
                        value={assigned ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPlayerProfile(i, v === "" ? null : v);
                        }}
                        className="h-9 rounded-[var(--radius-sm)] border border-border bg-bg px-2 text-xs text-fg focus-visible:outline-none focus-visible:ring-2"
                        style={{ ["--tw-ring-color" as string]: pc.hex }}
                      >
                        <option value="">
                          Active (
                          {profiles.find((p) => p.id === activeProfileId)?.name ?? "Default"})
                        </option>
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-fg-subtle tabular">
                        {pOdds.eligible} available · top{" "}
                        {formatProbability(Math.max(0, ...Object.values(pOdds.byId)))}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
