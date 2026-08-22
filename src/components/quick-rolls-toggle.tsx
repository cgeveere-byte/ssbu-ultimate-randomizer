import { cn } from "@/lib/cn";

export function QuickRollsToggle({
  quick,
  onChange,
  disabled,
  size = "md",
}: {
  quick: boolean;
  onChange: (quick: boolean) => void;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const tall = size === "lg";
  return (
    <div
      role="radiogroup"
      aria-label="Roll length"
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-bg p-0.5",
        tall ? "h-14" : "h-11",
        disabled && "opacity-40",
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={quick}
        disabled={disabled}
        onClick={() => onChange(true)}
        title="Every roll is 1.6 seconds"
        className={cn(
          "flex items-center justify-center px-2.5 font-semibold transition-colors sm:px-3",
          tall ? "text-sm" : "text-xs",
          quick
            ? "rounded-[calc(var(--radius-lg)-2px)] bg-accent text-accent-fg"
            : "text-fg-muted hover:text-fg",
        )}
      >
        Quick
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!quick}
        disabled={disabled}
        onClick={() => onChange(false)}
        title="Rolls last a random 3.2–5 seconds"
        className={cn(
          "flex items-center justify-center px-2.5 font-semibold transition-colors sm:px-3",
          tall ? "text-sm" : "text-xs",
          !quick
            ? "rounded-[calc(var(--radius-lg)-2px)] bg-accent text-accent-fg"
            : "text-fg-muted hover:text-fg",
        )}
      >
        Long
      </button>
    </div>
  );
}

export function rollDurationMs(quick: boolean): number {
  if (quick) return 1600;
  return 3200 + Math.random() * 1800;
}
