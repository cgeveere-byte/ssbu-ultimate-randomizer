import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type WeightProfile } from "@/lib/profiles";
import {
  assembleChunks,
  decodeQrText,
  encodeProfilesForQr,
} from "@/lib/qr-codec";
import { cn } from "@/lib/cn";

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "max-h-[min(92dvh,720px)] w-full overflow-y-auto rounded-[var(--radius-xl)] border border-border bg-bg-elevated shadow-[var(--shadow-soft)]",
          wide ? "max-w-lg" : "max-w-md",
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-bg-elevated/95 px-4 py-3 backdrop-blur-sm">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-fg">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-fg-muted">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-bg-subtle hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function QrExportModal({
  profiles,
  onClose,
}: {
  profiles: WeightProfile[];
  onClose: () => void;
}) {
  const [parts, setParts] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bytes, setBytes] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setDataUrl(null);
    setPage(0);
    void (async () => {
      try {
        const { parts: p, approxBytes } = await encodeProfilesForQr(profiles);
        if (cancelled) return;
        setParts(p);
        setBytes(approxBytes);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not encode QR");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profiles]);

  useEffect(() => {
    if (!parts[page]) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(parts[page], {
      errorCorrectionLevel: parts.length > 1 ? "M" : "M",
      margin: 2,
      width: 320,
      color: { dark: "#0a0a0b", light: "#f4f4f5" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [parts, page]);

  const names = profiles.map((p) => p.name).join(", ");

  return (
    <ModalShell
      title="Export via QR"
      subtitle="Open QR import on the other phone and scan this code."
      onClose={onClose}
    >
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-[var(--radius-lg)] border border-border bg-fg p-3">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={`QR code for ${names}`}
                className="h-64 w-64 sm:h-72 sm:w-72"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-sm text-bg-elevated sm:h-72 sm:w-72">
                Generating…
              </div>
            )}
          </div>

          <p className="text-center text-xs text-fg-muted">
            Sharing: <span className="font-medium text-fg">{names || "—"}</span>
            <span className="text-fg-subtle"> · ~{bytes} chars</span>
          </p>

          {parts.length > 1 && (
            <div className="flex w-full flex-col items-center gap-2">
              <p className="text-center text-xs text-warn">
                Large transfer — scan all {parts.length} parts in any order.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <span className="tabular text-xs text-fg">
                  Part {page + 1} / {parts.length}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= parts.length - 1}
                  onClick={() => setPage((p) => Math.min(parts.length - 1, p + 1))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-[11px] text-fg-subtle">
            Built-in Default & Smash 64 are not included — every install already has them.
          </p>
        </div>
      )}
    </ModalShell>
  );
}

export function QrImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (profiles: WeightProfile[], mode: "merge" | "replace") => void;
}) {
  const [tab, setTab] = useState<"camera" | "paste">("camera");
  const [status, setStatus] = useState<string>("Point the camera at a QR code");
  const [chunks, setChunks] = useState<Map<number, string>>(() => new Map());
  const [chunkTotal, setChunkTotal] = useState<number | null>(null);
  const [pending, setPending] = useState<WeightProfile[] | null>(null);
  const [paste, setPaste] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "ssbu-qr-reader";
  const handling = useRef(false);

  const finishComplete = useCallback((profiles: WeightProfile[]) => {
    setPending(profiles);
    setStatus(`Ready: ${profiles.map((p) => p.name).join(", ")}`);
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      void (async () => {
        try {
          await s.stop();
        } catch {
          /* ignore */
        }
        try {
          await s.clear();
        } catch {
          /* ignore */
        }
      })();
    }
  }, []);

  const handleRaw = useCallback(
    async (raw: string) => {
      if (handling.current) return;
      handling.current = true;
      try {
        const result = await decodeQrText(raw);
        if (result.kind === "complete") {
          finishComplete(result.profiles);
          return;
        }
        setChunks((prev) => {
          const next = new Map(prev);
          next.set(result.index, result.bodyPart);
          return next;
        });
        setChunkTotal(result.total);
        setStatus(`Got part ${result.index + 1}/${result.total}`);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Scan failed");
      } finally {
        // allow more scans for multi-part
        setTimeout(() => {
          handling.current = false;
        }, 600);
      }
    },
    [finishComplete],
  );

  // Assemble multi-part when complete
  useEffect(() => {
    if (chunkTotal == null) return;
    if (chunks.size < chunkTotal) return;
    void (async () => {
      try {
        const profiles = await assembleChunks(chunks, chunkTotal);
        finishComplete(profiles);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Could not assemble parts");
      }
    })();
  }, [chunks, chunkTotal, finishComplete]);

  useEffect(() => {
    if (tab !== "camera" || pending) return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    let started = false;

    void (async () => {
      try {
        scanner = new Html5Qrcode(regionId, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 8,
            qrbox: (w, h) => {
              const side = Math.min(260, Math.floor(Math.min(w, h) * 0.75));
              return { width: side, height: side };
            },
            aspectRatio: 1,
          },
          (decoded) => {
            void handleRaw(decoded);
          },
          () => {
            /* frame miss */
          },
        );
        if (cancelled) {
          try {
            await scanner.stop();
            await scanner.clear();
          } catch {
            /* ignore */
          }
          return;
        }
        started = true;
        setStatus("Point the camera at a QR code");
      } catch {
        if (!cancelled) {
          setStatus("Camera unavailable — paste the QR text instead.");
          setTab("paste");
        }
        if (scanner) {
          try {
            await scanner.clear();
          } catch {
            /* ignore */
          }
        }
        scannerRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      const s = scanner ?? scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      void (async () => {
        try {
          // isScanning may not exist on all versions — try stop only if started
          if (started) {
            await s.stop();
          }
        } catch {
          /* not running */
        }
        try {
          await s.clear();
        } catch {
          /* ignore */
        }
      })();
    };
  }, [tab, pending, handleRaw]);

  return (
    <ModalShell
      title="Import via QR"
      subtitle="Scan the code shown on the other phone."
      onClose={onClose}
      wide
    >
      {!pending && (
        <div className="mb-3 flex gap-1 rounded-[var(--radius-md)] border border-border bg-bg p-1">
          <button
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-medium",
              tab === "camera"
                ? "bg-bg-subtle text-fg"
                : "text-fg-muted hover:text-fg",
            )}
            onClick={() => setTab("camera")}
          >
            <Camera className="h-3.5 w-3.5" />
            Camera
          </button>
          <button
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-medium",
              tab === "paste"
                ? "bg-bg-subtle text-fg"
                : "text-fg-muted hover:text-fg",
            )}
            onClick={() => setTab("paste")}
          >
            Paste text
          </button>
        </div>
      )}

      {pending ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-fg">
            Found{" "}
            <span className="font-semibold">{pending.length}</span> profile
            {pending.length === 1 ? "" : "s"}:
          </p>
          <ul className="flex flex-col gap-1.5">
            {pending.map((p) => (
              <li
                key={p.id}
                className="rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-sm text-fg"
              >
                {p.name}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onImport(pending, "merge")}
            >
              Add to my profiles
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (
                  window.confirm(
                    "Replace all custom profiles with the scanned ones? Built-ins stay.",
                  )
                ) {
                  onImport(pending, "replace");
                }
              }}
            >
              Replace custom
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPending(null);
                setChunks(new Map());
                setChunkTotal(null);
                setStatus("Point the camera at a QR code");
              }}
            >
              Scan again
            </Button>
          </div>
        </div>
      ) : (
        <>
          {tab === "camera" && (
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg">
              <div id={regionId} className="min-h-[240px] w-full" />
            </div>
          )}
          {tab === "paste" && (
            <div className="flex flex-col gap-2">
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="Paste SSBU1:… text from the other device"
                className="min-h-[120px] w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2 font-mono text-xs text-fg placeholder:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              />
              <Button
                size="sm"
                disabled={!paste.trim()}
                onClick={() => void handleRaw(paste)}
              >
                Decode
              </Button>
            </div>
          )}
          <p className="mt-3 text-center text-xs text-fg-muted">{status}</p>
          {chunkTotal != null && (
            <p className="mt-1 text-center text-xs tabular text-fg-subtle">
              Parts {chunks.size}/{chunkTotal}
            </p>
          )}
        </>
      )}
    </ModalShell>
  );
}
