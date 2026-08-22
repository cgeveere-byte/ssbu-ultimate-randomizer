import { cn } from "@/lib/cn";

/** Two-option control — selected side is filled so Unique vs Dupes is obvious. */
export function UniqueDupesToggle({
  uniqueOnly,
  onChange,
  disabled,
  size = "md",
}: {
  uniqueOnly: boolean;
  onChange: (uniqueOnly: boolean) => void;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const tall = size === "lg";
  return (
    <div
      role="radiogroup"
      aria-label="Repeat fighters in a session"
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-bg p-0.5",
        tall ? "h-14" : "h-11",
        disabled && "opacity-40",
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={uniqueOnly}
        disabled={disabled}
        onClick={() => onChange(true)}
        title="A player won't get the same fighter twice until you reset the session. Both players can still get the same pick on one roll."
        className={cn(
          "flex items-center justify-center px-2.5 font-semibold transition-colors sm:px-3",
          tall ? "text-sm" : "text-xs",
          uniqueOnly
            ? "rounded-[calc(var(--radius-lg)-2px)] bg-accent text-accent-fg"
            : "text-fg-muted hover:text-fg",
        )}
      >
        Unique
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!uniqueOnly}
        disabled={disabled}
        onClick={() => onChange(false)}
        title="Same fighter can come up again, even for the same player"
        className={cn(
          "flex items-center justify-center px-2.5 font-semibold transition-colors sm:px-3",
          tall ? "text-sm" : "text-xs",
          !uniqueOnly
            ? "rounded-[calc(var(--radius-lg)-2px)] bg-warn text-bg"
            : "text-fg-muted hover:text-fg",
        )}
      >
        Dupes
      </button>
    </div>
  );
}
