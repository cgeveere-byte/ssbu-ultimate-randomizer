import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "border-border bg-bg-subtle text-fg-muted",
        accent: "border-accent/20 bg-favorite-bg text-fg",
        never: "border-danger/25 bg-danger-bg text-danger",
        rare: "border-border bg-rare-bg text-rare",
        normal: "border-border bg-bg-subtle text-fg-muted",
        often: "border-often/30 bg-often-bg text-often",
        favorite: "border-amber-400/50 bg-amber-400/15 text-amber-300",
        dlc: "border-warn/30 bg-warn-bg text-warn",
        echo: "border-border-strong bg-bg-elevated text-fg-subtle",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
