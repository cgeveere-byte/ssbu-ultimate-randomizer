import { useEffect, useMemo, useState } from "react";
import { Swords, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FighterMonogram } from "@/components/fighter-tile";
import {
  applyChoice,
  createQuizState,
  quizClarity,
  quizTierCounts,
  rankedQuizFighters,
  ratingsToWeights,
  type QuizState,
} from "@/lib/preference-quiz";
import { ROSTER, fighterPortraitUrl, WEIGHT_MAP } from "@/lib/roster";
import { useRandomizerStore } from "@/lib/store";
import { cn } from "@/lib/cn";

const BY_ID = new Map(ROSTER.map((f) => [f.id, f]));

export function PreferenceQuiz({ onClose }: { onClose: () => void }) {
  const createProfile = useRandomizerStore((s) => s.createProfile);
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<QuizState>(() => createQuizState());
  const [undo, setUndo] = useState<QuizState[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("Quiz profile");
  const [leaving, setLeaving] = useState(false);

  const left = state.pair ? BY_ID.get(state.pair.left) : null;
  const right = state.pair ? BY_ID.get(state.pair.right) : null;
  const clarity = quizClarity(state);
  const weights = useMemo(() => ratingsToWeights(state), [state]);
  const tiers = quizTierCounts(weights);
  const top = rankedQuizFighters(state)
    .filter((r) => r.rating.games > 0 && (weights[r.id] ?? 0) >= WEIGHT_MAP.often)
    .slice(0, 8);

  const pick = (choice: "left" | "right" | "neither" | "skip") => {
    if (!state.pair) return;
    setUndo((u) => [...u.slice(-19), state]);
    setState(applyChoice(state, choice));
  };

  const requestClose = () => {
    if (started && state.matchups > 0 && !naming) {
      setLeaving(true);
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (!started || naming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") pick("left");
      else if (e.key === "ArrowRight") pick("right");
      else if (e.key === "Escape") requestClose();
      else if (e.key === "Backspace") {
        e.preventDefault();
        if (undo.length) {
          const prev = undo[undo.length - 1]!;
          setUndo((u) => u.slice(0, -1));
          setState(prev);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, naming, state, undo]);

  const save = () => {
    const id = createProfile(name.trim() || "Quiz profile", weights);
    if (id) {
      toast.success(`Created ${name.trim() || "Quiz profile"}`);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-bg text-fg"
      role="dialog"
      aria-modal="true"
      aria-label="Preference quiz"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-5">
        <button
          type="button"
          onClick={requestClose}
          className="flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm font-medium text-fg-muted hover:text-fg"
          aria-label="Close quiz"
        >
          <X className="h-4 w-4" strokeWidth={2} />
          Exit
        </button>
        <div className="min-w-0 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-fg-subtle">
            This or that
          </p>
          <p className="truncate text-sm text-fg-muted">
            {started
              ? `${state.matchups} pick${state.matchups === 1 ? "" : "s"} · ${Math.round(clarity * 100)}% clear`
              : "Build a profile from matchups"}
          </p>
        </div>
        {started && !naming ? (
          <Button
            size="sm"
            disabled={state.matchups < 5}
            onClick={() => setNaming(true)}
            title={state.matchups < 5 ? "Make a few picks first" : "Save as a profile"}
          >
            Done
          </Button>
        ) : (
          <div className="w-[4.5rem]" aria-hidden />
        )}
      </div>

      {started && !naming && (
        <div className="h-1.5 w-full shrink-0 bg-bg-subtle">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${Math.round(clarity * 100)}%` }}
          />
        </div>
      )}

      {!started ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] border border-border bg-bg-elevated text-fg">
            <Swords className="h-8 w-8" strokeWidth={1.6} />
          </div>
          <div className="max-w-sm">
            <h2 className="text-xl font-semibold tracking-tight">Who would you rather play?</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Two fighters at a time. The winner stays and faces someone new, so your favorites
              climb. Stop whenever the ranking feels right — unseen fighters stay Normal.
            </p>
          </div>
          <Button size="lg" onClick={() => setStarted(true)}>
            Start quiz
          </Button>
        </div>
      ) : naming ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-5 py-6">
          <div className="w-full max-w-md">
            <h2 className="text-lg font-semibold tracking-tight">Save this ranking</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {state.matchups} matchups · {Math.round(clarity * 100)}% clear
            </p>
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
                Profile name
              </span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                }}
              />
            </label>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-fg-muted sm:grid-cols-5">
              <li>Fav {tiers.favorite}</li>
              <li>Often {tiers.often}</li>
              <li>Norm {tiers.normal}</li>
              <li>Rare {tiers.rare}</li>
              <li>Off {tiers.never}</li>
            </ul>
            {top.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {top.map((row) => {
                  const f = BY_ID.get(row.id);
                  if (!f) return null;
                  return (
                    <span
                      key={row.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated py-1 pl-1 pr-2.5 text-xs font-medium"
                    >
                      <FighterMonogram fighter={f} size="sm" />
                      {f.name}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setNaming(false)}>
                Keep picking
              </Button>
              <Button className="flex-1" onClick={save}>
                Create profile
              </Button>
            </div>
          </div>
        </div>
      ) : !left || !right ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-fg-muted">That’s every useful matchup. Save the profile.</p>
          <Button onClick={() => setNaming(true)}>Review & save</Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 p-1.5 sm:gap-3 sm:p-3">
            <QuizCard
              fighterId={left.id}
              name={left.name}
              series={left.seriesLabel}
              onPick={() => pick("left")}
              side="left"
            />
            <QuizCard
              fighterId={right.id}
              name={right.name}
              series={right.seriesLabel}
              onPick={() => pick("right")}
              side="right"
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={undo.length === 0}
              onClick={() => {
                const prev = undo[undo.length - 1];
                if (!prev) return;
                setUndo((u) => u.slice(0, -1));
                setState(prev);
              }}
              className="flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-bg px-3 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-30"
            >
              <Undo2 className="h-3.5 w-3.5" strokeWidth={2} />
              Undo
            </button>
            <button
              type="button"
              onClick={() => pick("neither")}
              className="flex h-11 items-center rounded-[var(--radius-md)] border border-border bg-bg px-3 text-xs font-medium text-fg-muted hover:text-fg"
            >
              Neither
            </button>
            <button
              type="button"
              onClick={() => pick("skip")}
              className="flex h-11 items-center rounded-[var(--radius-md)] border border-border bg-bg px-3 text-xs font-medium text-fg-muted hover:text-fg"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {leaving && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 shadow-soft">
            <p className="text-sm font-semibold">Leave without saving?</p>
            <p className="mt-1 text-sm text-fg-muted">
              {state.matchups} pick{state.matchups === 1 ? "" : "s"} will be lost.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setLeaving(false)}>
                Stay
              </Button>
              <Button variant="danger" className="flex-1" onClick={onClose}>
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizCard({
  fighterId,
  name,
  series,
  onPick,
  side,
}: {
  fighterId: string;
  name: string;
  series: string;
  onPick: () => void;
  side: "left" | "right";
}) {
  const src = fighterPortraitUrl(fighterId);
  const fighter = BY_ID.get(fighterId)!;
  return (
    <button
      type="button"
      onClick={onPick}
      className="group relative flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-black text-left transition-[transform,box-shadow] duration-150 hover:border-border-strong active:scale-[0.99]"
      aria-label={`Pick ${name}`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          className="h-full min-h-0 w-full flex-1 object-cover object-center"
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-bg-elevated">
          <FighterMonogram fighter={fighter} size="xl" className="!h-28 !w-28 !text-4xl" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-16">
        <p className="text-lg font-bold leading-tight tracking-tight text-white sm:text-2xl">{name}</p>
        <p className="mt-0.5 truncate text-xs text-white/65 sm:text-sm">{series}</p>
      </div>
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
        {side === "left" ? "Left" : "Right"}
      </span>
    </button>
  );
}
