import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import { setRollSfxEnabled, useRollSfxEnabled } from "@/lib/roll-sound";

export function RollSfxToggle({
  size = "md",
}: {
  size?: "md" | "lg";
}) {
  const on = useRollSfxEnabled();
  const tall = size === "lg";
  return (
    <button
      type="button"
      onClick={() => setRollSfxEnabled(!on)}
      title={on ? "Mute roll sound" : "Unmute roll sound"}
      aria-pressed={on}
      aria-label={on ? "Mute roll sound" : "Unmute roll sound"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-bg text-fg-muted hover:text-fg",
        tall ? "h-14 w-14" : "h-11 w-11",
      )}
    >
      {on ? (
        <Volume2 className={tall ? "h-5 w-5" : "h-4 w-4"} strokeWidth={1.75} />
      ) : (
        <VolumeX className={tall ? "h-5 w-5" : "h-4 w-4"} strokeWidth={1.75} />
      )}
    </button>
  );
}
