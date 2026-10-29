import type { QREncodeResult } from '../../utils/qr-encode';
import { encodeQR } from '../../utils/qr-encode';

/** One dark module, at its place in the quiet-zoned code. */
export interface DarkModule {
  id: string;
  x: number;
  y: number;
}

/**
 * The code to draw, or `null` when there is none: no link yet, or one too long to encode. `null`
 * draws the failed panel — never an empty square that reads as a QR which merely won't scan
 * (MS9-14).
 */
export function drawableCode(value: string): QREncodeResult | null {
  if (!value) {
    return null;
  }
  try {
    return encodeQR(value);
  } catch {
    return null;
  }
}

/** The code's side in modules, its quiet zone on both edges included — the drawing's viewBox. */
export function quietZonedSide(modulesPerSide: number, quietZone: number): number {
  return modulesPerSide + quietZone * 2;
}

/** The note and the link may run wider than the code they sit under, by this much. */
export function wordsWidth(size: number): number {
  return size + 80;
}

/* The dark modules as flat records. Their coordinates ARE their identity — a QR module has no
   other one — so the key is the coordinate rather than a position in a map callback. */
export function darkModules(matrix: boolean[][], quietZone: number): DarkModule[] {
  const out: DarkModule[] = [];
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row) {
      continue;
    }
    for (let c = 0; c < row.length; c++) {
      if (row[c]) {
        out.push({ id: `${r}-${c}`, x: c + quietZone, y: r + quietZone });
      }
    }
  }
  return out;
}
