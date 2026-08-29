import { Link } from "@tanstack/react-router";
import { Cloud } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

/** FuelKit-style Google/X login via the Grok auth broker + per-account profile sync. */
export function GrokBrokerSync() {
  const { isPending } = useCurrentUserState();

  return (
    <section
      aria-labelledby="grok-broker-sync-heading"
      className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-bg">
          <Cloud className="h-5 w-5 text-fg-muted" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="grok-broker-sync-heading" className="text-sm font-semibold tracking-tight text-fg">
            Grok Broker Sync
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            Continue with Google or X through xAI’s shared auth broker — no OAuth apps to set
            up. After sign-in, profiles, weights, and matchup scores save to your account.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isPending ? (
          <div className="h-10 w-28 animate-pulse rounded-[var(--radius-md)] bg-bg-subtle" />
        ) : (
          <>
            <SignedOut>
              <Link
                to="/login"
                className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                Sign in
              </Link>
              <p className="text-xs text-fg-subtle">Signed out, data stays in this browser only.</p>
            </SignedOut>
            <SignedIn>
              <UserButton />
              <span className="text-xs font-medium text-success">Synced to your account</span>
            </SignedIn>
          </>
        )}
      </div>
    </section>
  );
}
