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
  'sidebar-w': 248,
  'header-h': 64,
  'topbar-h-mobile': 56,
  'bottomnav-pill-h': 64,
  'bottomnav-inset': 16,
  'bottomnav-gap': 20,
  'bottomnav-h': 84,
  'field-h': 52,
  'section-gap': 24,
  'tile-gap': 10,
  'tile-pad': 16,
  'content-max': 1160,
  'bp-desktop': 968,
  'form-max': 480,
  'gutter-mobile': 16,
  'gutter-tablet': 20,
  'gutter-desktop': 24,
  'touch-min': 44,
} as const;

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
  'r-input-expressive': 14,
  'r-field': 14,
  'r-tile': 18,
  'r-input-functional': 10,
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
  'doc-fs': 16,
  'doc-fs-small': 14,
  'doc-fs-figure': 22,
} as const;
