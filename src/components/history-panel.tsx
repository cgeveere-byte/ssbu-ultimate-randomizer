import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FighterMonogram } from "@/components/fighter-tile";
import { ROSTER } from "@/lib/roster";
import { playerBadgeFg, playerColor } from "@/lib/player-colors";
import { useRandomizerStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export function HistoryPanel() {
  const history = useRandomizerStore((s) => s.history);
  const clearHistory = useRandomizerStore((s) => s.clearHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <section className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5">
        <div className="flex items-center gap-2 text-fg-muted">
          <Clock className="h-4 w-4" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold tracking-tight text-fg">Recent rolls</h2>
        </div>
        <p className="mt-3 text-sm text-fg-muted">Your spin history will show up here.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold tracking-tight text-fg">Recent rolls</h2>
        </div>
        <Button size="sm" variant="ghost" onClick={clearHistory}>
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {history.map((entry) => {
          const fighters = entry.fighterIds.map((id) => ROSTER.find((f) => f.id === id));
          const time = new Date(entry.at);
          const profiles = entry.profileNames ?? [];
          const uniqueProfiles = [...new Set(profiles.filter(Boolean))];
          const valid = fighters
            .map((f, i) => (f ? { fighter: f, index: i } : null))
            .filter(Boolean) as { fighter: (typeof ROSTER)[number]; index: number }[];
          const count = valid.length;
          const cols = count <= 4 ? count : Math.ceil(count / 2);
          const expanded = expandedId === entry.id;
          const nameLine = valid.map((v) => v.fighter.name).join(" · ");
          const multiProfile = uniqueProfiles.length > 1;

          return (
            <li
              key={entry.id}
              className={cn(
                "rounded-[var(--radius-md)] border border-border bg-bg",
                expanded ? "px-3 py-3" : "px-3 py-2.5",
              )}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {!expanded && (
                  <div
                    className="grid shrink-0 gap-x-1.5 gap-y-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 2.5rem))`,
                    }}
                  >
                    {valid.map(({ fighter: f, index: i }) => (
                      <div
                        key={`${entry.id}-${f.id}-${i}`}
                        className="flex w-10 flex-col items-center gap-1"
                        title={`P${i + 1}`}
                      >
                        <FighterMonogram fighter={f} size="sm" />
                        <span
                          className="h-0.5 w-full rounded-full"
                          style={{ background: playerColor(i).hex }}
                          aria-hidden
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {!expanded && (
                    <>
                      <p className="truncate text-sm font-medium text-fg" title={nameLine}>
                        {valid.map(({ fighter: f, index: i }) => (
                          <span key={`${entry.id}-name-${i}`}>
                            {i > 0 && <span className="text-fg-subtle"> · </span>}
                            {valid.length > 1 && (
                              <span
                                className="mr-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full"
                                style={{ background: playerColor(i).hex }}
                                aria-hidden
                              />
                            )}
                            {f.name}
                          </span>
                        ))}
                      </p>
                      <p className="truncate text-xs text-fg-subtle tabular">
                        {time.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {uniqueProfiles.length > 0 && (
                          <span>
                            {" · "}
                            {uniqueProfiles.length === 1
                              ? uniqueProfiles[0]
                              : uniqueProfiles.join(", ")}
                          </span>
                        )}
                        {count > 1 && (
                          <span>
                            {" · "}
                            {count} players
                          </span>
                        )}
                      </p>
                    </>
                  )}
                  {expanded && (
                    <p className="text-xs font-medium text-fg-muted">
                      <span className="tabular text-fg">
                        {time.toLocaleString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      <span className="text-fg-subtle">
                        {" · "}
                        {count} fighter{count === 1 ? "" : "s"}
                      </span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                  aria-expanded={expanded}
                  aria-label={expanded ? "Collapse roll details" : "Expand roll details"}
                  title={expanded ? "Collapse" : "Full details"}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>

              {expanded && (
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {valid.map(({ fighter: f, index: i }) => {
                    const pc = playerColor(i);
                    const profileName = profiles[i] ?? profiles[0] ?? "—";
                    return (
                      <li
                        key={`${entry.id}-detail-${i}`}
                        className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-border bg-bg-elevated px-2.5 py-2"
                        style={{
                          borderColor: pc.ring,
                          boxShadow: `inset 3px 0 0 ${pc.hex}`,
                        }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <FighterMonogram fighter={f} size="md" />
                          <span
                            className="h-0.5 w-full rounded-full"
                            style={{ background: pc.hex }}
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="inline-flex h-5 shrink-0 items-center rounded-full px-1.5 text-[10px] font-bold uppercase tracking-wide"
                              style={{ background: pc.hex, color: playerBadgeFg(i) }}
                            >
                              P{i + 1}
                            </span>
                            <span className="truncate text-sm font-semibold text-fg">
                              {f.name}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-fg-subtle">{f.seriesLabel}</p>
                          {(multiProfile || uniqueProfiles.length === 1) && (
                            <p className="mt-0.5 truncate text-[11px] text-fg-muted">
                              Profile · {profileName}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
