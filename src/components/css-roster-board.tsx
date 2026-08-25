import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import {
  type Fighter,
  CSS_COLUMNS,
  cssRosterRows,
  fighterPortraitUrl,
  fighterTileStyle,
  initials,
} from "@/lib/roster";
import { playerBadgeFg, playerColor } from "@/lib/player-colors";
import { cn } from "@/lib/cn";

export function CssRosterBoard({
  p1Used,
  p2Used,
  className,
}: {
  p1Used?: ReadonlySet<string>;
  p2Used?: ReadonlySet<string>;
  className?: string;
}) {
  const rows = useMemo(() => cssRosterRows(), []);
  const p1 = p1Used ?? EMPTY;
  const p2 = p2Used ?? EMPTY;

  return (
    <div className={cn("flex flex-col gap-[2px] bg-black p-[2px]", className)}>
      {rows.map((row, rowIndex) => (
        <ul
          key={rowIndex}
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${CSS_COLUMNS}, minmax(0, 1fr))` }}
        >
          {row.length === CSS_COLUMNS
            ? row.map((fighter) => (
                <li key={fighter.id}>
                  <CssTile fighter={fighter} p1={p1.has(fighter.id)} p2={p2.has(fighter.id)} />
                </li>
              ))
            : Array.from({ length: CSS_COLUMNS }, (_, col) => {
                const offset = Math.floor((CSS_COLUMNS - row.length) / 2);
                const fighter = row[col - offset];
                if (!fighter) return <li key={`pad-${col}`} aria-hidden />;
                return (
                  <li key={fighter.id}>
                    <CssTile fighter={fighter} p1={p1.has(fighter.id)} p2={p2.has(fighter.id)} />
                  </li>
                );
              })}
        </ul>
      ))}
    </div>
  );
}

const EMPTY = new Set<string>();

function CssTile({
  fighter,
  p1,
  p2,
}: {
  fighter: Fighter;
  p1: boolean;
  p2: boolean;
}) {
  const src = fighterPortraitUrl(fighter.id);
  const tile = fighterTileStyle(fighter.id);
  const both = p1 && p2;
  const used = p1 || p2;
  const p1c = playerColor(0);
  const p2c = playerColor(1);
  const title = [
    fighter.name,
    p1 && p2 ? "used by P1 and P2" : p1 ? "used by P1" : p2 ? "used by P2" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative aspect-square overflow-hidden rounded-[2px] bg-bg-elevated" title={title}>
      {src ? (
        <img
          src={src}
          alt={fighter.name}
          draggable={false}
          className={cn(
            "h-full w-full object-cover object-center",
            both && "grayscale opacity-45",
            used && !both && "opacity-90",
          )}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-[7px] font-semibold text-fg sm:text-[9px]",
            both && "grayscale opacity-45",
          )}
          style={tile}
          aria-hidden
        >
          {initials(fighter.name)}
        </div>
      )}

      {both && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute h-[78%] w-[2px] rotate-45 rounded-full bg-white/85" />
          <span className="absolute h-[78%] w-[2px] -rotate-45 rounded-full bg-white/85" />
        </div>
      )}

      {p1 && (
        <span
          className="absolute left-0 top-0 flex h-[42%] min-h-[10px] min-w-[10px] items-center justify-center rounded-br-[3px] px-[2px] text-[7px] font-black leading-none sm:text-[8px]"
          style={{ background: p1c.hex, color: playerBadgeFg(0) }}
        >
          1
        </span>
      )}
      {p2 && (
        <span
          className="absolute right-0 top-0 flex h-[42%] min-h-[10px] min-w-[10px] items-center justify-center rounded-bl-[3px] px-[2px] text-[7px] font-black leading-none sm:text-[8px]"
          style={{ background: p2c.hex, color: playerBadgeFg(1) }}
        >
          2
        </span>
      )}
    </div>
  );
}

export function UsedRosterOverlay({
  p1Used,
  p2Used,
  onClose,
}: {
  p1Used: readonly string[];
  p2Used: readonly string[];
  onClose: () => void;
}) {
  const p1Set = useMemo(() => new Set(p1Used), [p1Used]);
  const p2Set = useMemo(() => new Set(p2Used), [p2Used]);
  const p1c = playerColor(0);
  const p2c = playerColor(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-black"
      role="dialog"
      aria-label="Used fighters"
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden p-2"
        style={{ transform: "rotate(180deg)" }}
      >
        <CssRosterBoard p1Used={p1Set} p2Used={p2Set} className="min-h-0 w-full flex-1" />
        <UsedBoardHeader
          p1Count={p1Set.size}
          p2Count={p2Set.size}
          p1c={p1c.hex}
          p2c={p2c.hex}
          onClose={onClose}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
        <UsedBoardHeader
          p1Count={p1Set.size}
          p2Count={p2Set.size}
          p1c={p1c.hex}
          p2c={p2c.hex}
          onClose={onClose}
        />
        <CssRosterBoard p1Used={p1Set} p2Used={p2Set} className="min-h-0 w-full flex-1" />
      </div>
    </div>
  );
}

function UsedBoardHeader({
  p1Count,
  p2Count,
  p1c,
  p2c,
  onClose,
}: {
  p1Count: number;
  p2Count: number;
  p1c: string;
  p2c: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
        Used
      </p>
      <span className="tabular text-xs font-bold" style={{ color: p1c }}>
        P1 {p1Count}
      </span>
      <span className="tabular text-xs font-bold" style={{ color: p2c }}>
        P2 {p2Count}
      </span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 items-center gap-1 rounded-[var(--radius-md)] bg-white/10 px-2.5 text-xs font-semibold text-white hover:bg-white/20"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
        Close
      </button>
    </div>
  );
}
