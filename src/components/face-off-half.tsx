import { useMemo } from "react";
import { Dices, LayoutGrid, Lock, Maximize2, Minus, Plus, Star, X } from "lucide-react";
import { UniqueDupesToggle } from "@/components/unique-dupes-toggle";
import { RollSfxToggle } from "@/components/roll-sfx-toggle";
import { QuickRollsToggle } from "@/components/quick-rolls-toggle";
import { CssRosterBoard } from "@/components/css-roster-board";
import {
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
        <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
          Settings
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-fg-muted hover:text-fg"
          aria-label="Close settings"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <UniqueDupesToggle
          uniqueOnly={uniqueOnly}
          onChange={onUniqueOnly}
          disabled={disabled}
        />
        <QuickRollsToggle
          quick={quickRolls}
          onChange={onQuickRolls}
          disabled={disabled}
        />
        <RollSfxToggle />
        {canResetUnique && (
          <button
            type="button"
            disabled={disabled}
            onClick={onResetUnique}
            className="flex h-11 items-center rounded-[var(--radius-md)] border border-border bg-bg px-2.5 text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-40"
          >
            Reset unique
          </button>
        )}
      </div>
    </div>
  );
}
