import { useState } from "react";
import {
  ChevronDown,
  Copy,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Swords,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileTransferMenus } from "@/components/profile-transfer-menus";
import { PreferenceQuiz } from "@/components/preference-quiz";
import {
  isBuiltInProfileId,
  builtInSubtitle,
  profileEligibleCount,
  profileStats,
} from "@/lib/profiles";
import { ROSTER, computeProbabilities } from "@/lib/roster";
import { useRandomizerStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export function ProfilesPanel() {
  const profiles = useRandomizerStore((s) => s.profiles);
  const activeProfileId = useRandomizerStore((s) => s.activeProfileId);
  const setActiveProfileId = useRandomizerStore((s) => s.setActiveProfileId);
  const createProfile = useRandomizerStore((s) => s.createProfile);
  const duplicateProfile = useRandomizerStore((s) => s.duplicateProfile);
  const renameProfile = useRandomizerStore((s) => s.renameProfile);
  const deleteProfile = useRandomizerStore((s) => s.deleteProfile);
  const importProfiles = useRandomizerStore((s) => s.importProfiles);
  const resetAllData = useRandomizerStore((s) => s.resetAllData);
  const isSpinning = useRandomizerStore((s) => s.isSpinning);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);

  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const isBuiltIn = isBuiltInProfileId(active.id);
  const eligible = profileEligibleCount(active.weights);
  const stats = profileStats(active.weights);
  const odds = computeProbabilities(active.weights);

  const startRename = () => {
    if (isBuiltIn) return;
    setRenaming(true);
    setRenameValue(active.name);
  };

  const commitRename = () => {
    if (renameValue.trim()) {
      renameProfile(active.id, renameValue.trim());
    }
    setRenaming(false);
    setRenameValue("");
  };

  return (
    <>
    <section className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">Weight profiles</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            Choose which setup to edit. Built-ins are read-only — duplicate them to customize.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
          <Button
            size="sm"
            variant="secondary"
            disabled={isSpinning}
            onClick={() => createProfile()}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={isSpinning}
            onClick={() => setQuizOpen(true)}
          >
            <Swords className="h-3.5 w-3.5" />
            Quiz
          </Button>
          <ProfileTransferMenus
            profiles={profiles}
            activeProfileId={activeProfileId}
            disabled={isSpinning}
            onImportProfiles={(list, mode) => importProfiles(list, mode)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 sm:max-w-md">
          <span className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
            Active profile
          </span>
          <div className="relative">
            <select
              value={active.id}
              disabled={isSpinning || renaming}
              onChange={(e) => {
                setActiveProfileId(e.target.value);
                setRenaming(false);
              }}
              className="h-11 w-full appearance-none rounded-[var(--radius-md)] border border-border bg-bg py-2 pl-3 pr-10 text-sm font-medium text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50"
            >
              {profiles.map((p) => {
                const n = profileEligibleCount(p.weights);
                const tag = isBuiltInProfileId(p.id)
                  ? " · built-in"
                  : ` · ${n}/${ROSTER.length}`;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {tag}
                  </option>
                );
              })}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
              strokeWidth={1.75}
            />
          </div>
        </label>

        {renaming ? (
          <div className="flex max-w-md flex-wrap items-center gap-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setRenaming(false);
                  setRenameValue("");
                }
              }}
              autoFocus
              className="h-9 min-w-[12rem] flex-1"
              aria-label="Profile name"
            />
            <Button size="icon-sm" variant="secondary" onClick={commitRename}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                setRenaming(false);
                setRenameValue("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-fg-muted">
              {isBuiltIn ? (
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {builtInSubtitle(active.id)} · read-only
                </span>
              ) : (
                <span className="tabular">
                  {eligible}/{ROSTER.length} in pool
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:ml-auto">
              {!isBuiltIn && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isSpinning}
                  onClick={startRename}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rename
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={isSpinning}
                onClick={() => duplicateProfile(active.id)}
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </Button>
              {!isBuiltIn && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isSpinning}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete profile “${active.name}”? This cannot be undone.`,
                      )
                    ) {
                      deleteProfile(active.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(
          [
            ["banned", stats.never, "text-danger"],
            ["rare", stats.rare, "text-fg-muted"],
            ["often", stats.often, "text-often"],
            ["favorites", stats.favorite, "text-fg"],
            ["custom", stats.custom, "text-fg-muted"],
          ] as const
        ).map(([label, n, color]) => (
          <div
            key={label}
            className="rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2"
          >
            <p className={cn("text-lg font-semibold tabular", color)}>{n}</p>
            <p className="text-[11px] uppercase tracking-wide text-fg-subtle">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-fg-subtle tabular">
        Total weight {Number.isInteger(odds.total) ? odds.total : odds.total.toFixed(1)} ·{" "}
        {odds.eligible} eligible
      </p>

      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-fg">Reset all data</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            Clears custom profiles, history, stock scores, unique bags, and settings.
            Built-in profiles stay.
          </p>
        </div>
        <Button
          size="sm"
          variant="danger"
          disabled={isSpinning}
          onClick={() => {
            const first = window.confirm(
              "Reset all app data?\n\nThis removes custom profiles, roll history, stock scores, unique bags, and settings. Built-in profiles stay.\n\nThis cannot be undone.",
            );
            if (!first) return;
            const second = window.confirm(
              "Last chance: really reset everything?",
            );
            if (!second) return;
            resetAllData();
            toast.success("All data reset");
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset all data
        </Button>
      </div>
    </section>
    {quizOpen && <PreferenceQuiz onClose={() => setQuizOpen(false)} />}
    </>
  );
}
