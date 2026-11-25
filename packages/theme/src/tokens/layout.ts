/** Spacing, layout, radius and elevation. Every px value a component sets comes from here. */
export const SPACING = {
  'sp-0': 0,
  'sp-0-5': 2,
  'sp-1': 4,
  'sp-2': 8,
  'sp-3': 12,
  'sp-4': 16,
  'sp-5': 20,
  'sp-6': 24,
  'sp-8': 32,
  'sp-10': 40,
  'sp-12': 48,
  'sp-16': 64,
  'sp-20': 80,
  'sp-24': 96,
} as const;

/**
 * Layout sizes. A safe-area inset is never a token: the web reads `env(safe-area-inset-*)` and the
 * phone reads `react-native-safe-area-context`.
 */
export const LAYOUT = {
  'screen-pad-mobile': 20,
  'screen-pad-desktop': 32,
  'screen-pad-mobile-fn': 16,
  'screen-pad-desktop-fn': 24,
  /** The sidebar open, and folded to its icons. */
  'sidebar-w': 256,
  'sidebar-w-folded': 72,
  /** One sidebar row: OneOhm's packed nav row; the 44 px touch floor is the phone's, not the rail's. */
  'nav-row-h': 34,
  'header-h': 64,
  'topbar-h-mobile': 56,
  'bottomnav-pill-h': 64,
  'bottomnav-inset': 16,
  'bottomnav-gap': 20,
  'bottomnav-h': 84,
  'field-h': 44,
  /** A button's three heights, OneOhm's `h-9` · `h-11` · `h-12`; a small one keeps the 44 px hit area. */
  'button-h-sm': 36,
  'button-h-md': 44,
  'button-h-lg': 48,
  /** A segment of a segmented control. */
  'segment-h': 40,
  /** A quick chip in a filter row, a choice chip, a status pill and a badge. */
  'filter-chip-h': 32,
  'chip-h': 28,
  'status-h': 28,
  'badge-h': 24,
  'section-gap': 24,
  'tile-gap': 10,
  'tile-pad': 16,
  'content-max': 1160,
  /** A page that reads as one column — a proposal's track, versions and links. */
  'content-narrow': 860,
  'bp-desktop': 968,
  'form-max': 480,
  'gutter-mobile': 16,
  'gutter-tablet': 20,
  'gutter-desktop': 24,
  'touch-min': 44,
} as const;

/**
 * The 3D studio's chrome over its canvas (`T-M05-002`): its round tools, the edge and gap round
 * them, the picture's thumb and the height of a tag on the picture. A phone draws them smaller so the roof keeps the screen; the tap area stays
 * `touch-min`. Every studio part reads these, never a size of its own.
 */
export const STUDIO_CHROME = {
  desk: {
    'studio-tool': 44,
    'studio-glyph': 20,
    'studio-edge': 16,
    'studio-gap': 12,
    'studio-thumb': 32,
    'studio-tag-h': 22,
  },
  phone: {
    'studio-tool': 36,
    'studio-glyph': 18,
    'studio-edge': 8,
    'studio-gap': 6,
    'studio-thumb': 24,
    'studio-tag-h': 20,
  },
} as const satisfies Record<'desk' | 'phone', Record<string, number>>;

export const RADIUS = {
  'r-xs': 8,
  'r-sm': 12,
  'r-md': 16,
  'r-lg': 24,
  'r-xl': 32,
  'r-2xl': 40,
  'rf-xs': 4,
  'rf-sm': 6,
  'rf-md': 8,
  'rf-lg': 12,
  'rf-xl': 16,
  'r-pill': 999,
  'r-card-expressive': 24,
  'r-card-functional': 16,
  'r-sheet-top': 28,
  'r-input-expressive': 12,
  'r-field': 12,
  'r-tile': 18,
  'r-input-functional': 12,
  /** Every control a person presses or types in: a button, a field, a select, a segmented track. */
  'r-control': 12,
  /** A badge: a quiet label with a hairline, never a pill. */
  'r-badge': 8,
} as const;

export interface Shadow {
  readonly x: number;
  readonly y: number;
  readonly blur: number;
  readonly spread: number;
  /** An rgb triple and its opacity, so one shadow serves CSS and the phone. */
  readonly rgb: readonly [number, number, number];
  readonly opacity: number;
}

export type ElevationLevel = 'e1' | 'e2' | 'e3' | 'e4' | 'e5';

const ink = [20, 23, 26] as const;
const ocean = [5, 52, 77] as const;
const black = [0, 0, 0] as const;

/** Light: soft neutral ink, felt more than seen; the largest lift is tinted ocean. */
export const ELEVATION_LIGHT: Readonly<Record<ElevationLevel, readonly Shadow[]>> = {
  e1: [
    { x: 0, y: 1, blur: 2, spread: 0, rgb: ink, opacity: 0.06 },
    { x: 0, y: 1, blur: 1, spread: 0, rgb: ink, opacity: 0.04 },
  ],
  e2: [
    { x: 0, y: 2, blur: 4, spread: 0, rgb: ink, opacity: 0.05 },
    { x: 0, y: 12, blur: 24, spread: -12, rgb: ink, opacity: 0.18 },
  ],
  e3: [
    { x: 0, y: 4, blur: 8, spread: 0, rgb: ink, opacity: 0.06 },
    { x: 0, y: 24, blur: 48, spread: -16, rgb: ink, opacity: 0.26 },
  ],
  e4: [
    { x: 0, y: 2, blur: 4, spread: 0, rgb: ink, opacity: 0.06 },
    { x: 0, y: 32, blur: 80, spread: -24, rgb: ocean, opacity: 0.42 },
  ],
  e5: [
    { x: 0, y: 8, blur: 16, spread: 0, rgb: ink, opacity: 0.08 },
    { x: 0, y: 40, blur: 96, spread: -24, rgb: ocean, opacity: 0.45 },
  ],
};

/** Dark: surfaces lift by tone, so shadows are deeper and black. */
export const ELEVATION_DARK: Readonly<Record<ElevationLevel, readonly Shadow[]>> = {
  e1: [{ x: 0, y: 1, blur: 2, spread: 0, rgb: black, opacity: 0.4 }],
  e2: [
    { x: 0, y: 2, blur: 4, spread: 0, rgb: black, opacity: 0.3 },
    { x: 0, y: 12, blur: 24, spread: -12, rgb: black, opacity: 0.5 },
  ],
  e3: [
    { x: 0, y: 4, blur: 8, spread: 0, rgb: black, opacity: 0.3 },
    { x: 0, y: 24, blur: 48, spread: -16, rgb: black, opacity: 0.6 },
  ],
  e4: [{ x: 0, y: 32, blur: 80, spread: -24, rgb: black, opacity: 0.72 }],
  e5: [{ x: 0, y: 40, blur: 96, spread: -24, rgb: black, opacity: 0.8 }],
};

/** Paper geometry: A4 and Letter at 96 dpi, and the reading floor of 12 pt. */
export const PRINT = {
  'page-w-a4': 794,
  'page-h-a4': 1123,
  'page-w-letter': 816,
  'page-h-letter': 1056,
  'page-margin': 48,
  'page-margin-tight': 32,
  'sheet-gap': 24,
  'sheet-radius': 4,
} as const;
