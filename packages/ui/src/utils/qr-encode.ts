/* Minimal QR encoder — byte mode, EC level M, versions 1–10 (up to 213 bytes).
   Written for HelioGrid so a proposal link renders on the device with no dependency and no
   network round-trip. Returns a boolean matrix, or null when the payload doesn't fit — the caller is
   expected to SHOW that failure rather than draw an empty square (MS9-14).

   Platform-neutral: both QRCode halves consume it. No DOM types, no RN types.
   This file owns version choice, the placement bit stream, the zigzag data pass and the public
   entry. The version tables, the GF(256)/Reed-Solomon arithmetic and the codeword stage are in
   qr-encode-blocks.ts; the module grid and its function patterns are in qr-encode-grid.ts. */

import type { EcConfig } from './qr-encode-blocks';
import { codewords, EC, interleave, REMAINDER, utf8Bytes } from './qr-encode-blocks';
import type { Grid } from './qr-encode-grid';
import { createGrid, drawFunctionPatterns } from './qr-encode-grid';

export interface QREncodeResult {
  /** Row-major modules; `true` is a dark module. */
  matrix: boolean[][];
  /** Modules per side, excluding the quiet zone. */
  size: number;
  version: number;
}

/** Mask 0: a module is inverted wherever (row + column) is even. */
function maskedBit(row: number, col: number, bit: boolean): boolean {
  return (row + col) % 2 === 0 ? !bit : bit;
}

/** Cursor over the placement bit stream. Reads past the end are light, as the spec allows. */
function bitReader(stream: number[]): () => boolean {
  let at = 0;
  return () => (at < stream.length ? stream[at++] === 1 : false);
}

/** The two modules of one strip row. A module a function pattern already claimed is left alone. */
function fillStripRow(
  line: (boolean | null)[],
  row: number,
  start: number,
  next: () => boolean,
): void {
  for (let k = 0; k < 2; k++) {
    const c = start - k;
    if (line[c] === null) {
      line[c] = maskedBit(row, c, next());
    }
  }
}

/** One two-column strip, walked bottom-up or top-down according to `up`. */
function fillStrip(m: Grid, size: number, start: number, up: boolean, next: () => boolean): void {
  for (let n = 0; n < size; n++) {
    const row = up ? size - 1 - n : n;
    const line = m[row];
    if (line) {
      fillStripRow(line, row, start, next);
    }
  }
}

/** Zigzag data placement with mask 0: strips of two columns, right to left, alternating direction. */
function placeData(m: Grid, size: number, stream: number[]): void {
  const next = bitReader(stream);
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    /* Column 6 is the vertical timing pattern; the pair steps one left past it, and the next
       step is measured from there — the same mutation the source makes to its loop variable. */
    const start = col === 6 ? col - 1 : col;
    fillStrip(m, size, start, up, next);
    col = start;
    up = !up;
  }
}

/** The smallest version 1–10 that holds `bytes` at EC level M, or null. */
function pickVersion(byteLength: number): { version: number; cfg: EcConfig } | null {
  for (let v = 1; v <= 10; v++) {
    const cfg = EC[v];
    if (!cfg) {
      continue;
    }
    const dataCw = cfg.blocks.reduce((a, b) => a + b, 0);
    const lenBits = v < 10 ? 8 : 16;
    if (byteLength * 8 + 4 + lenBits <= dataCw * 8) {
      return { version: v, cfg };
    }
  }
  return null;
}

/** Interleaved codewords as placement bits, MSB-first, plus this version's remainder bits. */
function placementBits(final: number[], version: number): number[] {
  const stream: number[] = [];
  for (const b of final) {
    for (let i = 7; i >= 0; i--) {
      stream.push((b >> i) & 1);
    }
  }
  for (let i = 0; i < (REMAINDER[version] ?? 0); i++) {
    stream.push(0);
  }
  return stream;
}

/** Encodes `text`, or returns null when the payload does not fit versions 1–10 at EC level M. */
export function encodeQR(text: string): QREncodeResult | null {
  const bytes = utf8Bytes(String(text ?? ''));
  const picked = pickVersion(bytes.length);
  if (!picked) {
    return null;
  }
  const { version, cfg } = picked;

  const dataCw = cfg.blocks.reduce((a, b) => a + b, 0);
  const final = interleave(codewords(bytes, version, dataCw), cfg);

  const size = version * 4 + 17;
  const m = createGrid(size);
  drawFunctionPatterns(m, size, version);
  placeData(m, size, placementBits(final, version));

  return { matrix: m.map((row) => row.map((v) => v === true)), size, version };
}
