import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban, Dices, Loader2, Minus, Plus, Settings, Undo2, Users, X } from "lucide-react";
import { FighterMonogram } from "@/components/fighter-tile";
import { UniqueDupesToggle } from "@/components/unique-dupes-toggle";
import { RollSfxToggle } from "@/components/roll-sfx-toggle";
import { QuickRollsToggle, rollDurationMs } from "@/components/quick-rolls-toggle";
import { MatchupSheet, SetScoreButton } from "@/components/stock-session-panel";
import { FaceOffHalf, FaceOffSettings } from "@/components/face-off-half";
import { type Fighter, ROSTER } from "@/lib/roster";
import { playerBadgeFg, playerColor } from "@/lib/player-colors";
import { type PlayerPick, useRandomizerStore } from "@/lib/store";
import { playRollLock, playRollTick, unlockRollSound } from "@/lib/roll-sound";
import { cn } from "@/lib/cn";

export function GameMode({ onExit, startFaceOff = false }: { onExit: () => void; startFaceOff?: boolean }) {
  const playerCount = useRandomizerStore((s) => s.playerCount);
  const setPlayerCount = useRandomizerStore((s) => s.setPlayerCount);
  const uniqueOnly = useRandomizerStore((s) => s.uniqueOnly);
  const setUniqueOnly = useRandomizerStore((s) => s.setUniqueOnly);
  const quickRolls = useRandomizerStore((s) => s.quickRolls);
  const setQuickRolls = useRandomizerStore((s) => s.setQuickRolls);
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

  const [displayPicks, setDisplayPicks] = useState<PlayerPick[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [reelKey, setReelKey] = useState(0);
  const [faceOff, setFaceOff] = useState(startFaceOff);
  const [p1Stocks, setP1Stocks] = useState<number | null>(null);
  const [p2Stocks, setP2Stocks] = useState<number | null>(null);
  const [showMatchups, setShowMatchups] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [p1View, setP1View] = useState<"portrait" | "css">("css");
  const [p2View, setP2View] = useState<"portrait" | "css">("css");
  const timers = useRef<number[]>([]);

  const stockGames = useRandomizerStore((s) => s.stockGames);
  const recordStockGame = useRandomizerStore((s) => s.recordStockGame);
  const clearStockSession = useRandomizerStore((s) => s.clearStockSession);
  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const canRoll = useRandomizerStore((s) => s.canRoll());

  useEffect(() => { if (faceOff && playerCount !== 2) setFaceOff(false); }, [faceOff, playerCount]);
  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);
  useEffect(() => { const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, []);

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };

  const saveStockResult = useCallback(() => {
    const a = displayPicks.length > 0 ? displayPicks : lastPicks;
    const p1 = a[0]; const p2 = a[1];
    if (!p1 || !p2 || p1Stocks == null || p2Stocks == null) return false;
    recordStockGame({ p1FighterId: p1.fighter.id, p2FighterId: p2.fighter.id, p1Stocks, p2Stocks, timedOut: false });
    setP1Stocks(null); setP2Stocks(null); return true;
  }, [displayPicks, lastPicks, p1Stocks, p2Stocks, recordStockGame]);

  const selectP1Stocks = (n: number) => { setP1Stocks(n); if (n > 0) setP2Stocks((prev) => (prev == null ? 0 : prev)); };
  const selectP2Stocks = (n: number) => { setP2Stocks(n); if (n > 0) setP1Stocks((prev) => (prev == null ? 0 : prev)); };

  const flashPool = useCallback((): Fighter[] => {
    const s = useRandomizerStore.getState();
    const ids = new Set<string>(); const list: Fighter[] = [];
    for (let i = 0; i < s.playerCount; i++) {
      const pid = s.getPlayerProfileId(i);
      for (const p of s.getPool(pid)) {
        if (p.weight > 0 && !ids.has(p.fighter.id)) { ids.add(p.fighter.id); list.push(p.fighter); }
      }
    }
    return list.length === 0 ? ROSTER.slice() : list;
  }, []);

  const spin = useCallback(() => {
    if (isSpinning || !canRoll) return;
    saveStockResult(); setShowSettings(false); setShowMatchups(false);
    clearTimers(); unlockRollSound(); setSpinning(true); setRevealed(false); setP1Stocks(null); setP2Stocks(null);
    const final = roll();
    if (final.length === 0) { setSpinning(false); return; }
    const pool = flashPool(); const duration = rollDurationMs(quickRolls); const start = performance.now(); let lastTick = 0;
    const tick = (now: number) => {
      const elapsed = now - start; const progress = Math.min(1, elapsed / duration); const interval = 40 + progress * 180;
      if (now - lastTick >= interval) {
        lastTick = now;
        const flash: PlayerPick[] = [];
        for (let i = 0; i < final.length; i++) {
          const f = pool[Math.floor(Math.random() * pool.length)] ?? final[i].fighter;
          flash.push({ fighter: f, profileId: final[i].profileId, profileName: final[i].profileName });
        }
        setDisplayPicks(flash); setReelKey((k) => k + 1); playRollTick(progress);
      }
      if (progress < 1) {
        const id = window.setTimeout(() => { requestAnimationFrame(tick); }, 16);
        timers.current.push(id);
      } else {
        setDisplayPicks(final); setLastPicks(final); pushHistory(final); setRevealed(true); setSpinning(false); playRollLock();
      }
    };
    setDisplayPicks(Array.from({ length: final.length }, (_, i) => ({ fighter: pool[Math.floor(Math.random() * pool.length)]!, profileId: final[i].profileId, profileName: final[i].profileName })));
    requestAnimationFrame(tick);
  }, [canRoll, flashPool, isSpinning, pushHistory, quickRolls, roll, saveStockResult, setLastPicks, setSpinning]);

  const shown = displayPicks.length > 0 ? displayPicks : lastPicks;
  const cols = Math.min(shown.length || playerCount, 4);
  const uniqueExhausted = uniqueOnly && !canRoll && usedFighterIds.slice(0, playerCount).some((ids) => ids.length > 0);

  if (faceOff && playerCount === 2) {
    const p1 = shown[0] ?? null; const p2 = shown[1] ?? null;
    const canSave = p1 != null && p2 != null && p1Stocks != null && p2Stocks != null;
    const p1Wins = stockGames.filter((g) => g.p1Stocks > g.p2Stocks).length;
    const p2Wins = stockGames.filter((g) => g.p2Stocks > g.p1Stocks).length;
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-bg text-fg" role="dialog" aria-modal="true" aria-label="Game mode face-off">
        <div className="relative min-h-0 flex-1 overflow-hidden" style={{ transform: "rotate(180deg)" }}>
          <FaceOffHalf pick={p2} playerIndex={1} isSpinning={isSpinning} revealed={revealed} reelKey={reelKey} perPlayerProfiles={perPlayerProfiles} emptyHint="Waiting\u2026" stocks={p2Stocks} onSelectStocks={selectP2Stocks} wins={p2Wins} losses={p1Wins} view={p2View} onToggleView={() => setP2View((v) => (v === "css" ? "portrait" : "css"))} usedIds={usedFighterIds[1] ?? []} opponentId={p1?.fighter.id ?? null} />
        </div>
        <div className="relative z-40 shrink-0 border-y border-border bg-bg-elevated/95 px-2 py-1 backdrop-blur-sm">
          <div className="relative w-full">
            <div className="flex min-h-12 flex-wrap items-center justify-start gap-1">
              <div className="flex min-w-0 items-center gap-1">
                <button type="button" onClick={onExit} disabled={isSpinning} className="flex h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-bg px-2.5 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-40" aria-label="Exit game mode"><X className="h-3.5 w-3.5" strokeWidth={2} />Exit</button>
                <button type="button" disabled={isSpinning} onClick={() => setFaceOff(false)} className="flex h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-bg px-2.5 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-40" title="Standard layout"><Undo2 className="h-3.5 w-3.5" strokeWidth={2} />Standard</button>
                <SetScoreButton games={stockGames} onClick={() => { setShowSettings(false); setShowMatchups((v) => !v); }} />
              </div>
              <button type="button" onClick={spin} disabled={isSpinning || !canRoll} className={cn("roll-gold flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-[opacity,transform] duration-150 active:scale-[0.97]", "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/30", "disabled:pointer-events-none disabled:opacity-45")} aria-label={uniqueExhausted ? "Reset unique" : !canRoll ? "No fighters" : canSave ? `Save ${p1Stocks}\u2013${p2Stocks} and roll` : "Randomize"} title={uniqueExhausted ? "Reset unique" : canSave ? `Save ${p1Stocks}\u2013${p2Stocks} \u00b7 Roll` : "Randomize"}>
                {isSpinning ? <Loader2 className="h-6 w-6 animate-spin" /> : uniqueExhausted || !canRoll ? <Ban className="h-6 w-6" /> : <Dices className="h-6 w-6" strokeWidth={2} />}
              </button>
              <button type="button" onClick={() => { setShowMatchups(false); setShowSettings((v) => !v); }} className={cn("flex h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border bg-bg px-2.5 text-xs font-medium text-fg-muted hover:text-fg", showSettings ? "border-border-strong text-fg" : "border-border")} aria-pressed={showSettings} title="Sound, roll length, unique"><Settings className="h-3.5 w-3.5" strokeWidth={2} />Settings</button>
            </div>
            {showMatchups && (<><div className="absolute bottom-full left-1/2 z-30 mb-1.5 w-[min(100%,24rem)]" style={{ transform: "translateX(-50%) rotate(180deg)" }}><div className="max-h-[42vh] overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-3 shadow-soft"><MatchupSheet games={stockGames} onReset={() => { clearStockSession(); setShowMatchups(false); }} onClose={() => setShowMatchups(false)} /></div></div><div className="absolute top-full left-1/2 z-30 mt-1.5 w-[min(100%,24rem)] -translate-x-1/2"><div className="max-h-[42vh] overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-3 shadow-soft"><MatchupSheet games={stockGames} onReset={() => { clearStockSession(); setShowMatchups(false); }} onClose={() => setShowMatchups(false)} /></div></div></>)}
            {showSettings && (<><div className="absolute bottom-full left-1/2 z-20 mb-1.5 w-[min(100%,20rem)]" style={{ transform: "translateX(-50%) rotate(180deg)" }}><FaceOffSettings uniqueOnly={uniqueOnly} onUniqueOnly={setUniqueOnly} quickRolls={quickRolls} onQuickRolls={setQuickRolls} canResetUnique={uniqueOnly && usedFighterIds.slice(0, 2).some((ids) => ids.length > 0)} onResetUnique={resetUsedFighters} disabled={isSpinning} onClose={() => setShowSettings(false)} /></div><div className="absolute top-full left-1/2 z-20 mt-1.5 w-[min(100%,20rem)] -translate-x-1/2"><FaceOffSettings uniqueOnly={uniqueOnly} onUniqueOnly={setUniqueOnly} quickRolls={quickRolls} onQuickRolls={setQuickRolls} canResetUnique={uniqueOnly && usedFighterIds.slice(0, 2).some((ids) => ids.length > 0)} onResetUnique={resetUsedFighters} disabled={isSpinning} onClose={() => setShowSettings(false)} /></div></>)}
          </div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <FaceOffHalf pick={p1} playerIndex={0} isSpinning={isSpinning} revealed={revealed} reelKey={reelKey} perPlayerProfiles={perPlayerProfiles} emptyHint="Tap Randomize" stocks={p1Stocks} onSelectStocks={selectP1Stocks} wins={p1Wins} losses={p2Wins} view={p1View} onToggleView={() => setP1View((v) => (v === "css" ? "portrait" : "css"))} usedIds={usedFighterIds[0] ?? []} opponentId={p2?.fighter.id ?? null} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-bg text-fg" role="dialog" aria-modal="true" aria-label="Game mode">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <button type="button" onClick={onExit} disabled={isSpinning} className="flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-40" aria-label="Exit game mode"><X className="h-4 w-4" strokeWidth={2} />Exit</button>
        <div className="min-w-0 text-center"><p className="text-xs font-medium uppercase tracking-[0.14em] text-fg-subtle">Game mode</p><p className="truncate text-sm text-fg-muted">{perPlayerProfiles ? "Per-player profiles \u00b7 read-only" : `Profile \u00b7 ${active.name}`}</p></div>
        <div className="w-[4.5rem] sm:w-[5.5rem]" aria-hidden />
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[var(--radius-xl)] border border-border bg-bg-elevated text-fg-subtle"><Dices className="h-12 w-12" strokeWidth={1.4} /></div>
            <p className="max-w-xs text-base text-fg-muted">Tap Randomize for a full-screen pick. No weight editing here.</p>
          </div>
        ) : (
          <div key={revealed ? `final-${shown.map((s) => s.fighter.id).join()}` : `reel-${reelKey}`} className={cn("grid w-full max-w-5xl gap-3 sm:gap-4", isSpinning && "animate-reel", revealed && "animate-result-in")} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {shown.map((pick, i) => {
              const pc = playerColor(i);
              return (
                <div key={`game-slot-${i}`} className="flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border-2 px-3 py-5 sm:min-h-[14rem] sm:gap-4 sm:px-4 sm:py-6" style={{ borderColor: pc.hex, background: `linear-gradient(180deg, ${pc.soft}, transparent 65%)`, boxShadow: `0 0 0 1px ${pc.soft}` }}>
                  <span className="inline-flex h-8 items-center rounded-full px-3 text-sm font-bold uppercase tracking-wider sm:h-9 sm:px-4 sm:text-base" style={{ background: pc.hex, color: playerBadgeFg(i) }}>P{i + 1}</span>
                  <FighterMonogram fighter={pick.fighter} size="xl" className="!h-20 !w-20 !text-3xl sm:!h-28 sm:!w-28 sm:!text-4xl" />
                  <div className="w-full text-center">
                    <p className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-fg sm:text-2xl">{pick.fighter.name}</p>
                    <p className="mt-1 truncate text-sm text-fg-subtle sm:text-base">{pick.fighter.seriesLabel}</p>
                    {(perPlayerProfiles || playerCount > 1) && <p className="mt-1 truncate text-xs text-fg-muted sm:text-sm">{pick.profileName}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-border bg-bg-elevated px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button type="button" disabled={playerCount <= 1 || isSpinning} onClick={() => setPlayerCount(playerCount - 1)} className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-bg text-fg hover:bg-bg-subtle disabled:opacity-30" aria-label="Fewer players"><Minus className="h-6 w-6" strokeWidth={2.25} /></button>
            <div className="flex min-w-[5.5rem] flex-col items-center"><span className="text-xs uppercase tracking-wide text-fg-subtle">Players</span><span className="tabular text-3xl font-bold leading-none" style={{ color: playerColor(playerCount - 1).hex }}>{playerCount}</span></div>
            <button type="button" disabled={playerCount >= 8 || isSpinning} onClick={() => setPlayerCount(playerCount + 1)} className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-bg text-fg hover:bg-bg-subtle disabled:opacity-30" aria-label="More players"><Plus className="h-6 w-6" strokeWidth={2.25} /></button>
            <UniqueDupesToggle uniqueOnly={uniqueOnly} onChange={setUniqueOnly} disabled={isSpinning} size="lg" />
            <QuickRollsToggle quick={quickRolls} onChange={setQuickRolls} disabled={isSpinning} size="lg" />
            <RollSfxToggle size="lg" />
            {uniqueOnly && usedFighterIds.slice(0, playerCount).some((ids) => ids.length > 0) && (<button type="button" disabled={isSpinning} onClick={resetUsedFighters} className="flex h-14 items-center rounded-[var(--radius-lg)] border border-border bg-bg px-3 text-sm font-medium text-fg-muted hover:text-fg disabled:opacity-40" title="Allow previously rolled fighters again">Reset unique</button>)}
            <button type="button" disabled={isSpinning} onClick={() => { if (playerCount !== 2) setPlayerCount(2); setFaceOff(true); }} className={cn("flex h-14 items-center gap-1.5 rounded-[var(--radius-lg)] border px-3 text-sm font-semibold transition-colors sm:px-4", "border-border-strong bg-bg-subtle text-fg hover:bg-bg")} title="2-player face-off"><Users className="h-4 w-4" strokeWidth={2} />Face-off</button>
          </div>
          <button type="button" onClick={spin} disabled={isSpinning || !canRoll} className={cn("flex h-16 w-full items-center justify-center gap-3 rounded-[var(--radius-xl)] text-xl font-bold tracking-tight transition-[opacity,transform] duration-150 active:scale-[0.99] sm:h-20 sm:text-2xl", "bg-accent text-accent-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30", "disabled:pointer-events-none disabled:opacity-45")}>
            {isSpinning ? (<><Loader2 className="h-7 w-7 animate-spin" />Spinning\u2026</>) : uniqueExhausted ? (<><Ban className="h-7 w-7" />Reset unique pool</>) : !canRoll ? (<><Ban className="h-7 w-7" />No fighters available</>) : (<><Dices className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />Randomize</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
