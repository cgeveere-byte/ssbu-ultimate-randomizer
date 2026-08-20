import { ROSTER, clampWeight, getWeightValue } from "./roster";
import {
  type WeightMap,
  type WeightProfile,
  createProfile,
  isBuiltInProfileId,
  normalizeWeights,
} from "./profiles";

/** Compact QR payload marker. */
export const QR_FORMAT = "ssbu" as const;
export const QR_VERSION = 1 as const;

/** Soft max chars for a reliably scannable phone QR (medium ECC). */
export const QR_SOFT_LIMIT = 1200;
/** Hard max before we refuse / force multi-chunk. */
export const QR_HARD_LIMIT = 2200;
export const QR_CHUNK_LIMIT = 900;

export interface CompactProfile {
  /** name */
  n: string;
  /**
   * Sparse deltas from ×1 (roster index → weight).
   * Empty object means full equal pool.
   * Indices are base36 strings for density when minified.
   */
  d?: Record<string, number>;
}

export interface QrPayload {
  f: typeof QR_FORMAT;
  v: typeof QR_VERSION;
  p: CompactProfile[];
}

export interface QrChunk {
  f: typeof QR_FORMAT;
  v: typeof QR_VERSION;
  /** chunk index 0-based */
  i: number;
  /** total chunks */
  t: number;
  /** base64url gzip body fragment (or raw json fragment for uncompressed multi) */
  c: string;
}

function roundWeight(w: number): number {
  const c = clampWeight(w);
  // keep half-steps clean, trim float noise
  return Math.round(c * 1000) / 1000;
}

/** Encode weights as sparse deltas vs equal ×1. */
export function weightsToDelta(weights: WeightMap): CompactProfile["d"] {
  const d: Record<string, number> = {};
  for (let i = 0; i < ROSTER.length; i++) {
    const id = ROSTER[i].id;
    const w = roundWeight(getWeightValue(weights, id));
    if (w !== 1) {
      d[i.toString(36)] = w;
    }
  }
  return Object.keys(d).length === 0 ? undefined : d;
}

export function deltaToWeights(d?: CompactProfile["d"]): WeightMap {
  const base = normalizeWeights(null);
  if (!d) return base;
  for (const [k, v] of Object.entries(d)) {
    const idx = parseInt(k, 36);
    if (!Number.isFinite(idx) || idx < 0 || idx >= ROSTER.length) continue;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    base[ROSTER[idx].id] = clampWeight(v);
  }
  return base;
}

export function profilesToPayload(profiles: WeightProfile[]): QrPayload {
  const custom = profiles.filter((p) => !isBuiltInProfileId(p.id));
  return {
    f: QR_FORMAT,
    v: QR_VERSION,
    p: custom.map((p) => {
      const entry: CompactProfile = {
        n: p.name.slice(0, 48),
      };
      const d = weightsToDelta(p.weights);
      if (d) entry.d = d;
      return entry;
    }),
  };
}

export function payloadToProfiles(payload: QrPayload): WeightProfile[] {
  if (payload.f !== QR_FORMAT) {
    throw new Error("Not an SSBU randomizer QR code.");
  }
  if (payload.v !== QR_VERSION) {
    throw new Error(`Unsupported QR version ${String(payload.v)}.`);
  }
  if (!Array.isArray(payload.p) || payload.p.length === 0) {
    throw new Error("QR has no profiles.");
  }
  return payload.p.map((cp, i) => {
    const name =
      typeof cp.n === "string" && cp.n.trim()
        ? cp.n.trim().slice(0, 64)
        : `QR import ${i + 1}`;
    return createProfile(name, deltaToWeights(cp.d));
  });
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzipEncode(text: string): Promise<string> {
  if (typeof CompressionStream === "undefined") {
    return "u." + toBase64Url(new TextEncoder().encode(text));
  }
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  return "z." + toBase64Url(buf);
}

async function gzipDecode(token: string): Promise<string> {
  if (token.startsWith("u.")) {
    return new TextDecoder().decode(fromBase64Url(token.slice(2)));
  }
  if (token.startsWith("z.")) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("This browser can’t decompress QR data.");
    }
    const bytes = fromBase64Url(token.slice(2));
    const copy = Uint8Array.from(bytes);
    const stream = new Blob([copy])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }
  // raw json fallback
  return token;
}

/** Prefix so scanners know this is ours when reading plain text. */
export const QR_PREFIX = "SSBU1:";

/**
 * Encode profiles into one or more QR text payloads.
 * Prefer single code; chunk only when over soft limit.
 */
export async function encodeProfilesForQr(
  profiles: WeightProfile[],
): Promise<{ parts: string[]; approxBytes: number }> {
  const payload = profilesToPayload(profiles);
  if (payload.p.length === 0) {
    throw new Error("No custom profiles to share. Built-ins are already on every device.");
  }
  const json = JSON.stringify(payload);
  const packed = await gzipEncode(json);
  const full = QR_PREFIX + packed;

  if (full.length <= QR_SOFT_LIMIT) {
    return { parts: [full], approxBytes: full.length };
  }

  // Multi-chunk: split packed body into pieces
  const body = packed;
  const chunks: string[] = [];
  const total = Math.ceil(body.length / QR_CHUNK_LIMIT);
  for (let i = 0; i < total; i++) {
    const slice = body.slice(i * QR_CHUNK_LIMIT, (i + 1) * QR_CHUNK_LIMIT);
    const chunk: QrChunk = {
      f: QR_FORMAT,
      v: QR_VERSION,
      i,
      t: total,
      c: slice,
    };
    chunks.push(QR_PREFIX + "M" + JSON.stringify(chunk));
  }
  return { parts: chunks, approxBytes: full.length };
}

export type DecodeResult =
  | { kind: "complete"; profiles: WeightProfile[] }
  | { kind: "chunk"; index: number; total: number; bodyPart: string };

export async function decodeQrText(raw: string): Promise<DecodeResult> {
  let text = raw.trim();
  // Some scanners wrap URLs — try to extract payload
  const idx = text.indexOf(QR_PREFIX);
  if (idx >= 0) text = text.slice(idx);
  if (!text.startsWith(QR_PREFIX)) {
    // try raw json payload
    try {
      const obj = JSON.parse(text) as QrPayload;
      return { kind: "complete", profiles: payloadToProfiles(obj) };
    } catch {
      throw new Error("Unrecognized QR. Use Export QR from this app.");
    }
  }

  const rest = text.slice(QR_PREFIX.length);
  if (rest.startsWith("M{") || rest.startsWith("M[")) {
    // shouldn't be array
  }
  if (rest.startsWith("M")) {
    let chunk: QrChunk;
    try {
      chunk = JSON.parse(rest.slice(1)) as QrChunk;
    } catch {
      throw new Error("Broken multi-part QR.");
    }
    if (chunk.f !== QR_FORMAT || typeof chunk.c !== "string") {
      throw new Error("Invalid multi-part QR.");
    }
    return {
      kind: "chunk",
      index: chunk.i,
      total: chunk.t,
      bodyPart: chunk.c,
    };
  }

  const json = await gzipDecode(rest);
  const obj = JSON.parse(json) as QrPayload;
  return { kind: "complete", profiles: payloadToProfiles(obj) };
}

export async function assembleChunks(
  parts: Map<number, string>,
  total: number,
): Promise<WeightProfile[]> {
  if (parts.size < total) {
    throw new Error(`Need all ${total} parts (have ${parts.size}).`);
  }
  let body = "";
  for (let i = 0; i < total; i++) {
    const p = parts.get(i);
    if (p == null) throw new Error(`Missing QR part ${i + 1}/${total}.`);
    body += p;
  }
  const json = await gzipDecode(body);
  const obj = JSON.parse(json) as QrPayload;
  return payloadToProfiles(obj);
}
