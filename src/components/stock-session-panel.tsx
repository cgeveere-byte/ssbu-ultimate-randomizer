import { Trophy, RotateCcw } from "lucide-react";
import { playerColor } from "@/lib/player-colors";
import {
  ROSTER,
  fighterPortraitUrl,
  fighterTileStyle,
  initials,
} from "@/lib/roster";
import {
  type MatchupStat,
  type StockGame,
  bestAndWorst,
  formatMatchupRecord,
  setScore,
  winnerOf,
} from "@/lib/stock-session";
import { cn } from "@/lib/cn";

function TinyPortrait({ id }: { id: string }) {
  const fighter = ROSTER.find((f) => f.id === id);
  const src = fighterPortraitUrl(id);
  const tile = fighterTileStyle(id);
  const name = fighter?.name ?? id;
  return (
    <span
      className="inline-block h-7 w-7 shrink-0 overflow-hidden rounded-[5px] bg-bg-subtle ring-1 ring-black/30"
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          draggable={false}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-fg"
          style={tile}
          aria-hidden
        >
          {fighter ? initials(fighter.name) : "?"}
        </span>
      )}
    </span>
  );
}

function VsPair({ a, b }: { a: string; b: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <TinyPortrait id={a} />
      <span className="text-[10px] font-medium text-fg-subtle">vs</span>
      <TinyPortrait id={b} />
    </span>
  );
}

function MatchupLine({
  label,
  stat,
  tone,
}: {
  label: string;
  stat: MatchupStat | null;
  tone: "best" | "worst";
}) {
  if (!stat) {
    return (
      <p className="text-xs text-fg-subtle">
        {label}: play a game first
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs leading-snug text-fg">
      <span
        className={cn(
          "w-10 shrink-0 font-semibold uppercase tracking-wide",
          tone === "best" ? "text-success" : "text-danger",
        )}
      >
        {label}
      </span>
      <VsPair a={stat.myFighterId} b={stat.theirFighterId} />
      <span className="text-fg-muted">· {formatMatchupRecord(stat)}</span>
    </div>
  );
}

export function MatchupSheet({
  games,
  onReset,
  onClose,
}: {
  games: StockGame[];
  onReset: () => void;
  onClose: () => void;
}) {
  const score = setScore(games);
  const p1 = bestAndWorst(games, 0);
  const p2 = bestAndWorst(games, 1);
  const p1c = playerColor(0);
  const p2c = playerColor(1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
            Session
          </p>
          <p className="tabular text-lg font-bold tracking-tight">
            <span style={{ color: p1c.hex }}>{score.p1}</span>
            <span className="mx-1.5 text-fg-muted">–</span>
            <span style={{ color: p2c.hex }}>{score.p2}</span>
            {score.draws > 0 && (
              <span className="ml-2 text-xs font-medium text-fg-muted">
                {score.draws} draw{score.draws === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-fg-muted hover:text-fg"
        >
          Close
        </button>
      </div>

      <div
        className="rounded-[var(--radius-md)] border px-3 py-2"
        style={{ borderColor: p1c.ring, background: p1c.soft }}
      >
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: p1c.hex }}>
          P1 matchups
        </p>
        <MatchupLine label="Best" stat={p1.best} tone="best" />
        {p1.worst && p1.best !== p1.worst && (
          <MatchupLine label="Worst" stat={p1.worst} tone="worst" />
        )}
      </div>

      <div
        className="rounded-[var(--radius-md)] border px-3 py-2"
        style={{ borderColor: p2c.ring, background: p2c.soft }}
      >
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: p2c.hex }}>
          P2 matchups
        </p>
        <MatchupLine label="Best" stat={p2.best} tone="best" />
        {p2.worst && p2.best !== p2.worst && (
          <MatchupLine label="Worst" stat={p2.worst} tone="worst" />
        )}
      </div>

      {games.length > 0 && (
        <ul className="max-h-32 overflow-y-auto text-xs text-fg-muted">
          {games.slice(0, 8).map((g) => {
            const w = winnerOf(g);
            return (
              <li key={g.id} className="flex items-center justify-between gap-2 py-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <VsPair a={g.p1FighterId} b={g.p2FighterId} />
                  {g.timedOut ? (
                    <span className="text-[10px] text-fg-subtle">time</span>
                  ) : null}
                </span>
                <span className="tabular shrink-0 font-semibold text-fg">
                  {g.p1Stocks}–{g.p2Stocks}
                  {w === 0 ? " P1" : w === 1 ? " P2" : " draw"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onReset}
        disabled={games.length === 0}
        className="flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-border text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-30"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
        New session
      </button>
    </div>
  );
}

export function SetScoreButton({
  games,
  onClick,
}: {
  games: StockGame[];
  onClick: () => void;
}) {
  const score = setScore(games);
  const p1c = playerColor(0);
  const p2c = playerColor(1);
  return (
    <button
      type="button"
      onClick={onClick}
      title="Set score and matchups"
      className="flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-border-strong bg-bg px-2.5"
    >
      <Trophy className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={2} />
      <span className="tabular text-sm font-bold" style={{ color: p1c.hex }}>
        {score.p1}
      </span>
      <span className="text-fg-muted">–</span>
      <span className="tabular text-sm font-bold" style={{ color: p2c.hex }}>
        {score.p2}
      </span>
    </button>
  );
}
