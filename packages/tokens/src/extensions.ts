/**
 * The five marked extensions of docs/10 §2 — the ONLY values in this package that do not
 * come verbatim from design/ds-source. Every one is emitted under an explicit
 * `@heliogrid-extension` marker so ds-source diffs stay clean.
 */

export const EXTENSION_MARKER = '@heliogrid-extension';

/** Ext 1 — Geist has zero Devanagari coverage; the chain is Geist → Noto Sans Devanagari. */
export const NOTO_FONT_FACE = `@font-face{font-family:"Noto Sans Devanagari";src:url("./fonts/NotoSansDevanagari[wght].woff2") format("woff2-variations"),url("./fonts/NotoSansDevanagari[wght].woff2") format("woff2");font-weight:400 700;font-style:normal;font-display:swap;unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF,U+11B00-11B09}`;

export const FONT_SANS_EXTENDED = `"Geist","Noto Sans Devanagari","Inter",-apple-system,system-ui,sans-serif`;

/** Ext 2 — ruling D (owner, 2026-07-24): 600 sanctioned; shipped set is 400/500/600/700. */
export const SEMIBOLD: Record<string, string> = { 'fw-semibold': '600' };

/** Ext 3 — the recurring hand-mixed violet washes in the mockups, promoted to tokens. */
export const BRAND_WASH: Record<string, string> = {
  'brand-wash': '#F4F1FF',
  'brand-wash-subtle': '#FCFBFF',
  'brand-wash-faint': '#FBFAFF',
  'gradient-hero': 'linear-gradient(180deg,#F4F1FF 0%,#FCFBFF 78%)',
};

/**
 * Ext 4 — studio data-viz namespaces (authored new; a genuine gap in ds-source).
 * Harmonised with --chart-1..8. Requirements carried as metadata: categorical sets are
 * deuteranopia-distinguishable (hue variance rides the blue/yellow axis + monotonic
 * lightness spread), and every data-colour encoding pairs with a non-colour channel.
 * UI colour ≠ data colour stays law: never chart with --accent or --action-primary.
 */
export const DATA_ROOF: Record<string, string> = {
  'data-roof-1': '#5A4BFF',
  'data-roof-2': '#0E7490',
  'data-roof-3': '#E9A23B',
  'data-roof-4': '#E85CBE',
  'data-roof-5': '#2563EB',
  'data-roof-6': '#8A6D3B',
  'data-roof-7': '#14B8C4',
  'data-roof-8': '#6B7280',
};

export const DATA_STRING: Record<string, string> = {
  'data-string-1': '#4338CA',
  'data-string-2': '#0891B2',
  'data-string-3': '#D97706',
  'data-string-4': '#DB2777',
  'data-string-5': '#1D4ED8',
  'data-string-6': '#0D9488',
  'data-string-7': '#9333EA',
  'data-string-8': '#B45309',
  'data-string-9': '#64748B',
  'data-string-10': '#7B5CFF',
  'data-string-11': '#0EA5E9',
  'data-string-12': '#A21CAF',
};

/** Sequential irradiance/solar-access ramp, low→high, monotonically darkening (lightness-readable). */
export const DATA_SCALE: Record<string, string> = {
  'data-scale-0': '#FFF8E6',
  'data-scale-1': '#FFEFC2',
  'data-scale-2': '#FFE29E',
  'data-scale-3': '#FFD37A',
  'data-scale-4': '#FCBF5A',
  'data-scale-5': '#F5A73F',
  'data-scale-6': '#EB8A2C',
  'data-scale-7': '#DD6B20',
  'data-scale-8': '#C94D1D',
  'data-scale-9': '#B03A2E',
  'data-scale-10': '#8F2D52',
};

export const ALL_EXTENSION_TOKENS: Record<string, string> = {
  ...SEMIBOLD,
  ...BRAND_WASH,
  ...DATA_ROOF,
  ...DATA_STRING,
  ...DATA_SCALE,
};

/** Ext 5 is the contrast-pairs regeneration — see contrast.ts (DECLARED_PAIRS + annotations). */
