import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dices, Images, Maximize2, SlidersHorizontal, Users } from "lucide-react";
import { Toaster } from "sonner";
import { ClientOnly } from "@/components/client-only";
import { SplashGate, SplashScreen } from "@/components/splash-screen";
import { RandomizerStage } from "@/components/randomizer-stage";
import { RosterPanel } from "@/components/roster-panel";
import { HistoryPanel } from "@/components/history-panel";
import { ProfilesPanel } from "@/components/profiles-panel";
import { GameMode } from "@/components/game-mode";
import { GalleryPanel } from "@/components/gallery-panel";
import { AuthHeader } from "@/components/auth-header";
import { GrokBrokerSync } from "@/components/grok-broker-sync";
import { ROSTER, portraitPreloadTotal } from "@/lib/roster";
import { useRandomizerStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({
  component: Home,
});

type AppTab = "randomize" | "profiles" | "gallery";

function AppShell() {
  const [tab, setTab] = useState<AppTab>("randomize");
  const [gameMode, setGameMode] = useState(false);
  const profiles = useRandomizerStore((s) => s.profiles);
  const activeProfileId = useRandomizerStore((s) => s.activeProfileId);
  const playerCount = useRandomizerStore((s) => s.playerCount);
  const twoPlayer = playerCount === 2;
  const activeName =
    profiles.find((p) => p.id === activeProfileId)?.name ?? "Default";

  if (gameMode) {
    return (
      <>
        <GameMode onExit={() => setGameMode(false)} startFaceOff={twoPlayer} />
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            className: "!bg-bg-elevated !border-border !text-fg",
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="App sections"
            className="relative inline-flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated sm:w-auto"
          >
            <TabButton
              id="tab-randomize"
              active={tab === "randomize"}
              onClick={() => setTab("randomize")}
              icon={<Dices className="h-4 w-4" strokeWidth={1.75} />}
              label="Randomize"
            />
            <TabButton
              id="tab-profiles"
              active={tab === "profiles"}
              onClick={() => setTab("profiles")}
              icon={<SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />}
              label="Profiles"
            />
            <TabButton
              id="tab-gallery"
              active={tab === "gallery"}
              onClick={() => setTab("gallery")}
              icon={<Images className="h-4 w-4" strokeWidth={1.75} />}
              label="Gallery"
            />
          </div>

          {tab === "randomize" && (
            <div className="flex flex-wrap items-center gap-2 sm:contents">
                <button
                  type="button"
                  onClick={() => setGameMode(true)}
                  className={cn(
                    "game-mode-rainbow flex h-10 items-center gap-2 rounded-[var(--radius-md)] font-semibold transition-opacity duration-150 hover:opacity-90",
                    twoPlayer ? "px-4 text-sm" : "px-3 text-xs",
                  )}
                >
                  {twoPlayer ? (
                    <Users className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  {twoPlayer ? "Face-off" : "Game mode"}
                </button>
                <button
                  type="button"
                  onClick={() => setTab("profiles")}
                  className="flex h-10 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-left text-xs transition-colors duration-150 hover:border-border-strong hover:bg-bg-subtle sm:max-w-xs sm:justify-start"
                >
                  <span className="text-fg-subtle">Active profile</span>
                  <span className="truncate font-medium text-fg">{activeName}</span>
                  <span className="shrink-0 text-fg-muted">Edit →</span>
                </button>
            </div>
          )}
        </div>

        {tab === "randomize" ? (
          <div
            role="tabpanel"
            id="panel-randomize"
            aria-labelledby="tab-randomize"
            className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start"
          >
            <RandomizerStage onEditProfiles={() => setTab("profiles")} />
            <aside className="lg:sticky lg:top-[4.75rem]">
              <HistoryPanel />
            </aside>
          </div>
        ) : tab === "profiles" ? (
          <div
            role="tabpanel"
            id="panel-profiles"
            aria-labelledby="tab-profiles"
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
                  Profiles
                </h1>
                <p className="mt-1 max-w-xl text-sm text-fg-muted">
                  Pick a setup, tune weights, then head back to Randomize to spin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab("randomize")}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
              >
                <Dices className="h-4 w-4" strokeWidth={1.75} />
                Back to randomize
              </button>
            </div>
            <GrokBrokerSync />
            <ProfilesPanel />
            <RosterPanel />
          </div>
        ) : (
          <div
            role="tabpanel"
            id="panel-gallery"
            aria-labelledby="tab-gallery"
          >
            <GalleryPanel />
          </div>
        )}
      </div>

      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          className: "!bg-bg-elevated !border-border !text-fg",
        }}
      />
    </>
  );
}

function TabButton({
  id,
  active,
  onClick,
  icon,
  label,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative flex h-full flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-sm font-medium transition-[color,background-color] duration-150 sm:flex-none sm:min-w-[7.5rem] sm:gap-2 sm:px-4",
        active
          ? "bg-bg-subtle text-fg shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
          : "text-fg-muted hover:text-fg",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function Home() {
  return (
    <ClientOnly
      fallback={<SplashScreen loaded={0} total={portraitPreloadTotal()} />}
    >
      <SplashGate>
        <div className="min-h-dvh">
          <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-bg-elevated">
                  <Dices className="h-5 w-5 text-fg" strokeWidth={1.6} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-fg">
                    Ultimate Randomizer
                  </p>
                  <p className="truncate text-xs text-fg-subtle">
                    Smash Ultimate · {ROSTER.length} fighters
                  </p>
                </div>
              </div>
              <AuthHeader />
            </div>
          </header>

          <main className="mx-auto flex max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
            <AppShell />
          </main>

          <footer className="border-t border-border py-6">
            <div className="mx-auto max-w-7xl px-4 text-center text-xs text-fg-subtle sm:px-6">
              Fan utility — not affiliated with Nintendo. Character names used
              for identification.
            </div>
          </footer>
        </div>
      </SplashGate>
    </ClientOnly>
  );
}
