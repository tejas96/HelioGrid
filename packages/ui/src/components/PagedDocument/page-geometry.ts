/* The geometry table, and the estimate computed against it — so the estimate in the editor and
   the pages the document produces cannot come from two different ideas of a page. */
import type { RichTextMetrics } from '../RichText/RichText.types';
import type {
  PageEstimateOptions,
  PageEstimateResult,
  PageGeometry,
  PageGeometryOptions,
  PageMargin,
  Paper,
} from './PagedDocument.types';

/** 96dpi paper, matching @heliogrid/theme/print.css. Both orientations are derived. */
export const PAGE_GEOMETRY: Record<Paper, { w: number; h: number; label: string }> = {
  a4: { w: 794, h: 1123, label: 'A4 · 210 × 297 mm' },
  letter: { w: 816, h: 1056, label: 'Letter · 8.5 × 11 in' },
};

export const FLOW_GAP = 18;
export const HEAD_H = 30;
export const FOOT_H = 44;

/* Geist's mean advance for mixed-case body copy, in em. Named because the estimate's honesty
   depends on it being a stated assumption rather than a magic number: it is the one figure in
   estimatePages() that is measured from type rather than derived from geometry. */
const MEAN_ADVANCE_EM = 0.5;

const DEFAULT_MARGIN: PageMargin = { top: 48, right: 48, bottom: 48, left: 48 };

export function pageGeometry({
  paper = 'a4',
  orientation = 'portrait',
  margin = 48,
}: PageGeometryOptions = {}): PageGeometry {
  const p = PAGE_GEOMETRY[paper] ?? PAGE_GEOMETRY.a4;
  const land = orientation === 'landscape';
  const width = land ? p.h : p.w;
  const height = land ? p.w : p.h;
  const m: PageMargin =
    typeof margin === 'number'
      ? { top: margin, right: margin, bottom: margin, left: margin }
      : { ...DEFAULT_MARGIN, ...margin };
  return {
    paper,
    orientation,
    label: p.label,
    width,
    height,
    margin: m,
    contentW: width - m.left - m.right,
    contentH: height - m.top - m.bottom,
    flowH: height - m.top - m.bottom - HEAD_H - FOOT_H,
  };
}

/**
 * The estimate `RichText.measure(value)` was waiting for, computed against REAL PAGE GEOMETRY.
 *
 * Everything it uses is either geometry from this module's own table or a stated assumption:
 *   lines a page  = floor((content height − running head − foot) / (font size × line height))
 *   chars a line  = floor(content width / (font size × MEAN_ADVANCE_EM))
 *   lines needed  = max(chars ÷ chars-a-line, one line per block and per list item)
 *                   + a block gap per block + extra leading per heading + a logo's own footprint
 * `basis` returns those numbers in words, so a reader can check the estimate instead of trusting it.
 */
export function estimatePages(
  metrics?: RichTextMetrics,
  opts: PageEstimateOptions = {},
): PageEstimateResult {
  const g = pageGeometry(opts);
  const fs = opts.fontSize ?? 16;
  const lh = fs * (opts.lineHeight ?? 1.5);
  const reserve = opts.reserve ?? HEAD_H + FOOT_H;
  const usableH = Math.max(lh, g.contentH - reserve);
  const width = opts.contentWidth ?? g.contentW;
  const cpl = Math.max(20, Math.floor(width / (fs * (opts.advance ?? MEAN_ADVANCE_EM))));
  const m: Partial<RichTextMetrics> = metrics ?? {};
  const chars = m.chars ?? 0;
  const wrapped = Math.ceil(chars / cpl);
  const atLeast = (m.blocks ?? 0) + (m.listItems ?? 0);
  const lines =
    Math.max(wrapped, atLeast) +
    (m.blocks ?? 0) * 0.6 +
    (m.headings ?? 0) * 0.9 +
    (m.hasLogo ? 3 : 0);
  const linesPerPage = Math.max(1, Math.floor(usableH / lh));
  return {
    pages: chars === 0 ? 0 : Math.max(1, Math.ceil(lines / linesPerPage)),
    lines: Math.ceil(lines),
    linesPerPage,
    charsPerLine: cpl,
    geometry: g,
    basis: `${g.label} · ${Math.round(fs / 1.3333)}pt · ${Math.round(width)}px column · ${linesPerPage} lines a page`,
  };
}
