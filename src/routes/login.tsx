import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Dices } from "lucide-react";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async (providerId: string) => {
    setError(null);
    setBusy(providerId);
    try {
      await signIn(providerId, { callbackURL: "/", errorCallbackURL: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <Link
            to="/"
            className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm font-medium text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-6 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-bg">
              <Dices className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
              <p className="text-xs text-fg-muted">Continue with Google or X</p>
            </div>
          </div>

          {authEnabled ? (
            <div className="flex flex-col gap-2.5">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={busy !== null}
                  onClick={() => void onSignIn(p.providerId)}
                  className={cn("w-full justify-center", busy === p.providerId && "opacity-80")}
                >
                  <ProviderMark id={p.idp} />
                  {busy === p.providerId ? "Opening…" : `Continue with ${p.label}`}
                </Button>
              ))}
              {error && <p className="mt-1 text-sm text-danger">{error}</p>}
              <p className="mt-2 text-center text-xs text-fg-subtle">
                Optional. The randomizer works without an account.
              </p>
            </div>
          ) : (
            <p className="text-sm text-fg-muted">Sign-in is disabled.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function ProviderMark({ id }: { id: string }) {
  if (id === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L4.5 22H1.23l8.02-9.17L1.5 2h6.75l4.66 6.17L18.244 2zm-1.16 18.06h1.81L6.99 3.84H5.05l12.03 16.22z"
      />
    </svg>
  );
}
