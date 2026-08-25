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
import { playerColor } from "@/lib/player-colors";
import { cn } from "@/lib/cn";

export function CssRosterBoard({
  used,
  className,
}: {
  used?: ReadonlySet<string>;
  className?: string;
}) {
  const rows = useMemo(() => cssRosterRows(), []);
  const usedSet = used ?? EMPTY;

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
                  <CssTile fighter={fighter} used={usedSet.has(fighter.id)} />
                </li>
              ))
            : Array.from({ length: CSS_COLUMNS }, (_, col) => {
                const offset = Math.floor((CSS_COLUMNS - row.length) / 2);
                const fighter = row[col - offset];
                if (!fighter) return <li key={`pad-${col}`} aria-hidden />;
                return (
                  <li key={fighter.id}>
                    <CssTile fighter={fighter} used={usedSet.has(fighter.id)} />
                  </li>
                );
              })}
        </ul>
      ))}
    </div>
  );
}

const EMPTY = new Set<string>();

function CssTile({ fighter, used }: { fighter: Fighter; used: boolean }) {
  const src = fighterPortraitUrl(fighter.id);
  const tile = fighterTileStyle(fighter.id);
  const title = used ? `${fighter.name} · already used` : fighter.name;

  return (
    <div className="relative aspect-square overflow-hidden rounded-[2px] bg-bg-elevated" title={title}>
      {src ? (
        <img
          src={src}
          alt={fighter.name}
          draggable={false}
          className={cn(
            "h-full w-full object-cover object-center",
            used && "grayscale opacity-40",
          )}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-[7px] font-semibold text-fg sm:text-[9px]",
            used && "grayscale opacity-40",
          )}
          style={tile}
          aria-hidden
        >
          {initials(fighter.name)}
        </div>
      )}

      {used && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute h-[78%] w-[2px] rotate-45 rounded-full bg-white/80" />
          <span className="absolute h-[78%] w-[2px] -rotate-45 rounded-full bg-white/80" />
        </div>
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
        <CssRosterBoard used={p2Set} className="min-h-0 w-full flex-1" />
        <UsedBoardHeader
          label="P2 used"
          count={p2Set.size}
          color={p2c.hex}
          onClose={onClose}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
        <UsedBoardHeader
          label="P1 used"
          count={p1Set.size}
          color={p1c.hex}
          onClose={onClose}
        />
        <CssRosterBoard used={p1Set} className="min-h-0 w-full flex-1" />
      </div>
    </div>
  );
}

function UsedBoardHeader({
  label,
  count,
  color,
  onClose,
}: {
  label: string;
  count: number;
  color: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
        {label}
      </p>
      <span className="tabular text-xs font-bold text-white/80">{count}</span>
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
