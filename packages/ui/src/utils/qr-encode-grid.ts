/* qr-encode — the module grid and every function pattern the spec stamps on it BEFORE the data
   pass: the finders and their separators, the timing runs, the alignment squares, the dark
   module, the format block and the version block. Owns the grid type and its bounds-checked
   writer, because nothing may write a module without those bounds.

   Siblings: qr-encode-blocks.ts holds the version tables and the Reed-Solomon arithmetic;
   qr-encode.ts holds the data pass and the public entry point.
   Platform-neutral: both QRCode halves consume it. No DOM types, no RN types. */

import { ALIGN } from './qr-encode-blocks';

/** Row-major modules under construction; `null` is a free module the data pass may claim. */
export type Grid = (boolean | null)[][];

/** Writes one module. Coordinates outside the grid are dropped, not clamped. */
type SetModule = (r: number, c: number, v: boolean) => void;

/* Format info for EC level M with mask 0, BCH-encoded and XOR-masked. */
const FORMAT_M0 = 0x5412;

/** A `size` × `size` grid with every module still free. */
export function createGrid(size: number): Grid {
  return Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null));
}

/** A bounds-checked writer bound to one grid. */
function moduleSetter(m: Grid, size: number): SetModule {
  return (r, c, v) => {
    const row = m[r];
    if (row && c >= 0 && c < size) {
      row[c] = v;
    }
  };
}

/** Dark where the 7x7 finder itself sits; light across its 1-module separator band. */
function isFinderModule(i: number, j: number): boolean {
  const inSquare = i >= 0 && i <= 6 && j >= 0 && j <= 6;
  const onRing = i === 0 || i === 6 || j === 0 || j === 6;
  const inCore = i >= 2 && i <= 4 && j >= 2 && j <= 4;
  return inSquare && (onRing || inCore);
}

/** One finder plus its separator, anchored at (r, c) and clipped to the grid. */
function drawFinder(set: SetModule, size: number, r: number, c: number): void {
  for (let i = -1; i <= 7; i++) {
    for (let j = -1; j <= 7; j++) {
      const rr = r + i;
      const cc = c + j;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) {
        continue;
      }
      set(rr, cc, isFinderModule(i, j));
    }
  }
}

/** The two alternating timing runs that join the finders. */
function drawTiming(set: SetModule, size: number): void {
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
}

/** An alignment centre inside a finder's territory is skipped, not drawn. */
function coveredByFinder(r: number, c: number, size: number): boolean {
  return (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
}

/** One 5x5 alignment square centred on (r, c) — solid ring, hollow at radius 1. */
function drawAlignmentSquare(set: SetModule, r: number, c: number): void {
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      set(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1);
    }
  }
}

/** Every alignment square this version's centre table calls for. */
function drawAlignment(set: SetModule, size: number, version: number): void {
  const centres = ALIGN[version] ?? [];
  for (const r of centres) {
    for (const c of centres) {
      if (coveredByFinder(r, c, size)) {
        continue;
      }
      drawAlignmentSquare(set, r, c);
    }
  }
}

/* Format information, 15 bits. Both copies are written LSB-first in spec order:
   column 8 takes bits 0-5 (rows 0-5), 6-7 (rows 7-8) and 8-14 (rows size-7…size-1);
   row 8 takes bits 0-7 (columns size-1…size-8), bit 8 (column 6) and 9-14 (columns 5…0).
   The bottom vertical run deliberately skips row size-8 — that is the dark module. */
function drawFormatInfo(set: SetModule, size: number): void {
  for (let i = 0; i < 15; i++) {
    const b = ((FORMAT_M0 >> i) & 1) === 1;
    if (i < 6) {
      set(i, 8, b);
    } else if (i < 8) {
      set(i + 1, 8, b);
    } else {
      set(size - 15 + i, 8, b);
    }
    if (i < 8) {
      set(8, size - 1 - i, b);
    } else {
      set(8, 14 - i, b);
    }
  }
}

/** 18-bit version information: 6 version bits + BCH(18,6) remainder. Versions 7+ only. */
function versionBits(v: number): number {
  let rem = v;
  for (let i = 0; i < 12; i++) {
    rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
  }
  return ((v << 12) | (rem & 0xfff)) >>> 0;
}

/** Version information (v7+): two 3x6 blocks, bottom-left and top-right, written before the
    data pass so the zigzag skips them. Below v7 the grid carries none. */
function drawVersionInfo(set: SetModule, size: number, version: number): void {
  if (version < 7) {
    return;
  }
  const vb = versionBits(version);
  for (let i = 0; i < 18; i++) {
    const b = ((vb >> i) & 1) === 1;
    const a = Math.floor(i / 3);
    const c = size - 11 + (i % 3);
    set(a, c, b);
    set(c, a, b);
  }
}

/** Finders, timing, alignment, the dark module, format and version blocks — in spec order.
    The dark module is written twice on purpose: the format run crosses that cell, so it gets
    the last word on it. */
export function drawFunctionPatterns(m: Grid, size: number, version: number): void {
  const set = moduleSetter(m, size);
  drawFinder(set, size, 0, 0);
  drawFinder(set, size, 0, size - 7);
  drawFinder(set, size, size - 7, 0);
  drawTiming(set, size);
  drawAlignment(set, size, version);
  set(size - 8, 8, true); // dark module
  drawFormatInfo(set, size);
  set(size - 8, 8, true); // dark module — always the last word on this cell
  drawVersionInfo(set, size, version);
}
