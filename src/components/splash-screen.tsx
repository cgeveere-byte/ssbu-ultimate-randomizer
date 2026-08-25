import { useEffect, useState, type ReactNode } from "react";
import { Dices } from "lucide-react";
import {
  portraitPreloadTotal,
  preloadFighterPortraits,
} from "@/lib/roster";
import { useRandomizerStore } from "@/lib/store";

export function SplashScreen({
  loaded,
  total,
}: {
  loaded: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg px-6 text-fg"
      role="status"
      aria-live="polite"
      aria-busy={loaded < total}
      aria-label="Loading randomizer"
    >
      <div className="roll-gold mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)]">
        <Dices className="h-8 w-8" strokeWidth={1.6} />
      </div>
      <p className="text-lg font-semibold tracking-tight">Ultimate Randomizer</p>
      <p className="mt-1 max-w-xs text-center text-sm text-fg-muted">
        {loaded < total
          ? "Caching fighter portraits — first visit takes a bit."
          : "Ready."}
      </p>
      <div className="mt-6 w-full max-w-xs">
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
          <div
            className="h-full rounded-full bg-amber-300/90 transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs tabular text-fg-subtle">
          Portraits {loaded} / {total}
        </p>
      </div>
    </div>
  );
}

function waitForPersist(timeoutMs = 2500): Promise<void> {
  try {
    const api = useRandomizerStore.persist;
    if (api.hasHydrated()) return Promise.resolve();
    return new Promise((resolve) => {
      const t = window.setTimeout(resolve, timeoutMs);
      const unsub = api.onFinishHydration(() => {
        window.clearTimeout(t);
        unsub();
        resolve();
      });
    });
  } catch {
    return Promise.resolve();
  }
}

/** Full-screen splash until portraits (and profile store) are ready. */
export function SplashGate({ children }: { children: ReactNode }) {
  const total = portraitPreloadTotal();
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();
    const portraits = preloadFighterPortraits((n) => {
      if (!cancelled) setLoaded(n);
    });
    void Promise.all([portraits, waitForPersist()]).then(async () => {
      const elapsed = performance.now() - started;
      if (elapsed < 400) {
        await new Promise((r) => window.setTimeout(r, 400 - elapsed));
      }
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return <SplashScreen loaded={loaded} total={total} />;
  return <>{children}</>;
}