import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Download,
  FileJson,
  QrCode,
  ScanLine,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QrExportModal, QrImportModal } from "@/components/qr-transfer";
import {
  type WeightProfile,
  buildExportPayload,
  downloadJson,
  isBuiltInProfileId,
  parseImportPayload,
  slugifyFilename,
} from "@/lib/profiles";
import { cn } from "@/lib/cn";

function MenuPanel({
  open,
  onClose,
  title,
  anchorRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => {
      setIsMobile(mq.matches);
      const el = anchorRef.current;
      if (!el || mq.matches) {
        setCoords(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const width = 288;
      let left = r.right - width;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      let top = r.bottom + 6;
      const estHeight = 360;
      if (top + estHeight > window.innerHeight - 8) {
        top = Math.max(8, r.top - estHeight - 6);
      }
      setCoords({ top, left, width });
    };
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="presentation">
      {/* Backdrop — always closes on press */}
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/50 sm:bg-black/30"
        onClick={onClose}
      />

      {isMobile ? (
        <div
          ref={panelRef}
          role="menu"
          aria-label={title}
          className="absolute inset-x-0 bottom-0 max-h-[min(85dvh,560px)] overflow-y-auto rounded-t-[var(--radius-xl)] border border-border bg-bg-elevated p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-soft)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-fg">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-bg-subtle hover:text-fg"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      ) : (
        coords && (
          <div
            ref={panelRef}
            role="menu"
            aria-label={title}
            className="absolute max-h-[min(70vh,28rem)] overflow-y-auto rounded-[var(--radius-md)] border border-border bg-bg-elevated p-2 shadow-[var(--shadow-soft)]"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
          >
            {children}
          </div>
        )
      )}
    </div>,
    document.body,
  );
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
      {children}
    </p>
  );
}

function MenuItem({
  icon: Icon,
  children,
  disabled,
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm font-medium text-fg transition-colors hover:bg-bg-subtle active:bg-bg-hover disabled:pointer-events-none disabled:opacity-40 sm:min-h-0 sm:px-2 sm:py-2 sm:text-xs"
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-fg-muted sm:h-3.5 sm:w-3.5" />}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export function ProfileTransferMenus({
  profiles,
  activeProfileId,
  disabled,
  onImportProfiles,
}: {
  profiles: WeightProfile[];
  activeProfileId: string;
  disabled?: boolean;
  onImportProfiles: (
    list: WeightProfile[],
    mode: "merge" | "replace",
  ) => number;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qrExport, setQrExport] = useState(false);
  const [qrImport, setQrImport] = useState(false);
  const importModeRef = useRef<"merge" | "replace">("merge");
  const fileRef = useRef<HTMLInputElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const importBtnRef = useRef<HTMLButtonElement>(null);
  const exportTitleId = useId();

  useEffect(() => {
    const custom = profiles.filter((p) => !isBuiltInProfileId(p.id));
    setSelectedIds((ids) => {
      const kept = ids.filter((id) => custom.some((p) => p.id === id));
      if (kept.length > 0) return kept;
      if (custom.some((p) => p.id === activeProfileId)) return [activeProfileId];
      return custom.map((p) => p.id);
    });
  }, [profiles, activeProfileId]);

  const exportableProfiles = profiles.filter((p) => !isBuiltInProfileId(p.id));
  const selectedProfiles = exportableProfiles.filter((p) => selectedIds.includes(p.id));
  const selectedCustom = selectedProfiles;

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => setSelectedIds(exportableProfiles.map((p) => p.id));
  const selectActive = () => {
    if (!isBuiltInProfileId(activeProfileId)) setSelectedIds([activeProfileId]);
  };

  const exportJson = () => {
    if (selectedProfiles.length === 0) {
      toast.error("Select at least one profile");
      return;
    }
    const payload = buildExportPayload(selectedProfiles);
    const name =
      selectedProfiles.length === 1
        ? `ssbu-profile-${slugifyFilename(selectedProfiles[0].name)}.json`
        : `ssbu-profiles-${selectedProfiles.length}.json`;
    downloadJson(name, payload);
    toast.success(
      selectedProfiles.length === 1
        ? `Exported “${selectedProfiles[0].name}”`
        : `Exported ${selectedProfiles.length} profiles`,
    );
    setExportOpen(false);
  };

  const exportQr = () => {
    if (selectedCustom.length === 0) {
      toast.error(
        "QR only shares custom profiles. Select a custom profile, or duplicate a built-in first.",
      );
      return;
    }
    setExportOpen(false);
    setQrExport(true);
  };

  const pickFile = (mode: "merge" | "replace") => {
    importModeRef.current = mode;
    setImportOpen(false);
    // Defer so menu unmounts before file picker (iOS)
    window.setTimeout(() => fileRef.current?.click(), 50);
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const parsed = parseImportPayload(json);
      const mode = importModeRef.current;
      if (mode === "replace") {
        const ok = window.confirm(
          `Replace custom profiles with ${parsed.length} from this file? Built-ins are always kept.`,
        );
        if (!ok) return;
      }
      const count = onImportProfiles(parsed, mode);
      toast.success(
        mode === "replace"
          ? `Replaced with ${count} profile${count === 1 ? "" : "s"}`
          : `Imported ${count} profile${count === 1 ? "" : "s"}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  };

  return (
    <>
      <Button
        ref={exportBtnRef}
        size="sm"
        variant="secondary"
        disabled={disabled}
        aria-expanded={exportOpen}
        aria-haspopup="menu"
        aria-label="Export profiles"
        title="Export"
        className="h-9 w-9 shrink-0 px-0"
        onClick={() => {
          setImportOpen(false);
          setExportOpen((v) => !v);
        }}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>

      <Button
        ref={importBtnRef}
        size="sm"
        variant="secondary"
        disabled={disabled}
        aria-expanded={importOpen}
        aria-haspopup="menu"
        aria-label="Import profiles"
        title="Import"
        className="h-9 w-9 shrink-0 px-0"
        onClick={() => {
          setExportOpen(false);
          setImportOpen((v) => !v);
        }}
      >
        <Upload className="h-3.5 w-3.5" />
      </Button>

      <MenuPanel
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export profiles"
        anchorRef={exportBtnRef}
      >
        <MenuLabel>Profiles</MenuLabel>
        {exportableProfiles.length === 0 ? (
          <p className="px-2 py-3 text-sm text-fg-muted">
            No custom profiles yet. Duplicate a built-in or create one to export.
          </p>
        ) : (
          <>
            <div className="mb-1 flex flex-wrap gap-1 px-1">
              <button
                type="button"
                className="rounded px-2 py-1 text-xs font-medium text-fg-muted hover:bg-bg-subtle hover:text-fg disabled:opacity-40"
                onClick={selectActive}
                disabled={isBuiltInProfileId(activeProfileId)}
              >
                Active
              </button>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs font-medium text-fg-muted hover:bg-bg-subtle hover:text-fg"
                onClick={selectAll}
              >
                All custom
              </button>
            </div>
            <div className="mb-2 max-h-[40dvh] overflow-y-auto rounded-[var(--radius-sm)] border border-border bg-bg p-1 sm:max-h-44">
              {exportableProfiles.map((p) => {
                const on = selectedIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm hover:bg-bg-subtle sm:min-h-0 sm:py-1.5 sm:text-xs",
                      on && "bg-bg-subtle/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border sm:h-4 sm:w-4",
                        on
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border-strong bg-bg",
                      )}
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => toggleId(p.id)}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-fg">
                      {p.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        )}
        <p className="mb-1 px-2 text-[11px] text-fg-subtle" id={exportTitleId}>
          {selectedProfiles.length} selected
          <span className="text-fg-subtle"> · Built-ins stay on every device</span>
        </p>
        <div className="border-t border-border pt-1">
          <MenuItem
            icon={FileJson}
            disabled={selectedProfiles.length === 0}
            onClick={exportJson}
          >
            Download JSON
          </MenuItem>
          <MenuItem
            icon={QrCode}
            disabled={selectedCustom.length === 0}
            onClick={exportQr}
          >
            Show QR code
          </MenuItem>
        </div>
      </MenuPanel>

      <MenuPanel
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import profiles"
        anchorRef={importBtnRef}
      >
        <MenuLabel>From file</MenuLabel>
        <MenuItem icon={FileJson} onClick={() => pickFile("merge")}>
          Add JSON profiles
        </MenuItem>
        <MenuItem icon={FileJson} onClick={() => pickFile("replace")}>
          Replace custom with JSON
        </MenuItem>
        <div className="my-1 border-t border-border" />
        <MenuLabel>From phone</MenuLabel>
        <MenuItem
          icon={ScanLine}
          onClick={() => {
            setImportOpen(false);
            setQrImport(true);
          }}
        >
          Scan QR code
        </MenuItem>
      </MenuPanel>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onImportFile(file);
        }}
      />

      {qrExport && (
        <QrExportModal profiles={selectedCustom} onClose={() => setQrExport(false)} />
      )}
      {qrImport && (
        <QrImportModal
          onClose={() => setQrImport(false)}
          onImport={(list, mode) => {
            const n = onImportProfiles(list, mode);
            toast.success(
              `Imported ${n} profile${n === 1 ? "" : "s"} from QR`,
            );
            setQrImport(false);
          }}
        />
      )}
    </>
  );
}
