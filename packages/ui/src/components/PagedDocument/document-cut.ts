/* THE CUT — measure once, then emit explicit sheets.

   `measureFlow` reads the hidden layout (every atom's height, and for a `rows` section the per-row
   heights, the chrome and the footer separately). `packSheets` is pure, so the rule that keeps a
   total off its own page is readable in one place. */
import { FLOW_GAP } from './page-geometry';

/** The pre-measure shape the document hands in. */
export interface FlowAtom {
  id: string;
  kind: 'node' | 'rows';
  startsPage?: boolean;
  keepWithLast?: number;
  rows?: readonly unknown[];
}

export interface MeasuredNode {
  id: string;
  kind: 'node';
  startsPage?: boolean;
  h: number;
}

export interface MeasuredRows {
  id: string;
  kind: 'rows';
  startsPage?: boolean;
  keepWithLast?: number;
  h: number;
  rows: number[];
  chromeH: number;
  footH: number;
}

export type MeasuredItem = MeasuredNode | MeasuredRows;

export interface SheetPart {
  id: string;
  kind: 'node' | 'rows';
  oversized: boolean;
  from?: number;
  to?: number;
  continued?: boolean;
  last?: boolean;
}

interface PackState {
  sheets: SheetPart[][];
  cur: SheetPart[];
  used: number;
}

interface RowChunk {
  taken: number;
  h: number;
}

function flush(s: PackState): void {
  if (s.cur.length) {
    s.sheets.push(s.cur);
    s.cur = [];
    s.used = 0;
  }
}

function gap(s: PackState): number {
  return s.cur.length ? FLOW_GAP : 0;
}

function packNode(s: PackState, it: MeasuredNode, flowH: number): void {
  let lead = gap(s);
  if (s.cur.length && s.used + lead + it.h > flowH) {
    flush(s);
    lead = 0;
  }
  s.cur.push({ id: it.id, kind: 'node', oversized: it.h > flowH });
  s.used += lead + it.h;
  /* an atom taller than a page keeps its own sheet and is reported */
  if (it.h > flowH) flush(s);
}

/**
 * THE TOTAL MUST NOT BE ORPHANED (§3: "a total orphaned onto its own page is a defect"). If the
 * footer does not fit under the last chunk, rows are pushed forward so it lands WITH them — never
 * fewer than `keepWithLast`, so the last sheet is a total under real lines. `null` means nothing
 * can be kept back and the caller must flush and retry.
 */
function withFooter(it: MeasuredRows, i: number, chunk: RowChunk, avail: number): RowChunk | null {
  const keep = Math.max(1, it.keepWithLast || 2);
  let k = chunk.taken;
  let dh = chunk.h;
  while (k > 0 && dh + it.footH > avail) {
    k -= 1;
    dh -= it.rows[i + k] ?? 0;
  }
  if (k > 0 && chunk.taken - k < keep) k = Math.max(0, chunk.taken - keep);
  if (k <= 0) return null;
  return { taken: k, h: dh };
}

function fillChunk(it: MeasuredRows, i: number, avail: number): RowChunk {
  const n = it.rows.length;
  let taken = 0;
  let h = 0;
  while (i + taken < n && h + (it.rows[i + taken] ?? 0) <= avail) {
    h += it.rows[i + taken] ?? 0;
    taken += 1;
  }
  /* one row taller than a page: place it, report it */
  if (taken === 0) return { taken: 1, h: it.rows[i] ?? 0 };
  return { taken, h };
}

/**
 * Where the next chunk starts on the CURRENT sheet: the lead gap and the height left for rows once
 * this section's chrome is paid for. When not even the next row fits here, the sheet is flushed
 * first and the chunk opens at the top of a fresh one.
 */
function openChunk(
  s: PackState,
  it: MeasuredRows,
  i: number,
  flowH: number,
): { lead: number; avail: number } {
  const lead = gap(s);
  const avail = flowH - s.used - lead - it.chromeH;
  if (avail < (it.rows[i] ?? 0) && s.cur.length) {
    flush(s);
    return { lead: 0, avail: flowH - it.chromeH };
  }
  return { lead, avail };
}

/**
 * The rows this sheet takes: as many as fit, less any pushed forward so the total lands WITH them.
 * `retry` says the footer cannot be kept with any of them — the caller flushes and asks again on an
 * empty sheet, and takes the unadjusted chunk when the sheet was already empty.
 */
function chunkForSheet(
  it: MeasuredRows,
  i: number,
  avail: number,
): { chunk: RowChunk; retry: boolean } {
  const chunk = fillChunk(it, i, avail);
  const last = i + chunk.taken >= it.rows.length;
  if (!last || it.footH <= 0 || chunk.h + it.footH <= avail) return { chunk, retry: false };
  const adjusted = withFooter(it, i, chunk, avail);
  return adjusted === null ? { chunk, retry: true } : { chunk: adjusted, retry: false };
}

function packRows(s: PackState, it: MeasuredRows, flowH: number): void {
  const n = it.rows.length;
  if (n === 0) return;
  let i = 0;
  while (i < n) {
    const { lead, avail } = openChunk(s, it, i, flowH);
    const { chunk, retry } = chunkForSheet(it, i, avail);
    if (retry && s.cur.length) {
      flush(s);
      continue;
    }
    const end = i + chunk.taken;
    const last = end >= n;
    s.cur.push({
      id: it.id,
      kind: 'rows',
      from: i,
      to: end,
      continued: i > 0,
      last,
      oversized: chunk.taken === 1 && (it.rows[i] ?? 0) > flowH,
    });
    s.used += lead + it.chromeH + chunk.h + (last ? it.footH : 0);
    i = end;
    if (!last) flush(s);
  }
}

/** Packs measured atoms into sheets. Pure. */
export function packSheets(items: readonly MeasuredItem[], flowH: number): SheetPart[][] {
  const s: PackState = { sheets: [], cur: [], used: 0 };
  for (const it of items) {
    if (it.startsPage) flush(s);
    if (it.kind === 'node') packNode(s, it, flowH);
    else packRows(s, it, flowH);
  }
  flush(s);
  return s.sheets;
}

function measureRows(box: HTMLElement, it: FlowAtom, h: number): MeasuredRows {
  let els = Array.from(box.querySelectorAll<HTMLElement>('[data-flow-row],[data-flow-row-note]'));
  if (els.length === 0) els = Array.from(box.querySelectorAll<HTMLElement>('tbody tr'));
  const rows: number[] = [];
  for (const el of els) {
    const rh = el.getBoundingClientRect().height;
    const lastIndex = rows.length - 1;
    /* a row's own note line rides with its row, which is why the two attributes are read together */
    if (el.hasAttribute('data-flow-row-note') && rows.length) {
      rows[lastIndex] = (rows[lastIndex] ?? 0) + rh;
    } else {
      rows.push(rh);
    }
  }
  const footEl = box.querySelector<HTMLElement>('[data-flow-foot],tfoot');
  const footH = footEl ? footEl.getBoundingClientRect().height : 0;
  const sum = rows.reduce((a, b) => a + b, 0);
  return {
    id: it.id,
    kind: 'rows',
    startsPage: it.startsPage,
    keepWithLast: it.keepWithLast,
    h,
    rows,
    footH,
    chromeH: Math.max(0, h - sum - footH),
  };
}

/** Reads the hidden layout. Web only — the cut has no meaning without a laid-out DOM. */
export function measureFlow(root: HTMLElement, items: readonly FlowAtom[]): MeasuredItem[] {
  return items.map((it) => {
    const box = root.querySelector<HTMLElement>(`[data-mid="${it.id}"]`);
    if (!box) {
      return it.kind === 'rows'
        ? {
            id: it.id,
            kind: 'rows' as const,
            startsPage: it.startsPage,
            keepWithLast: it.keepWithLast,
            h: 0,
            rows: [],
            chromeH: 0,
            footH: 0,
          }
        : { id: it.id, kind: 'node' as const, startsPage: it.startsPage, h: 0 };
    }
    const h = box.getBoundingClientRect().height;
    if (it.kind !== 'rows') {
      return { id: it.id, kind: 'node' as const, startsPage: it.startsPage, h };
    }
    return measureRows(box, it, h);
  });
}
