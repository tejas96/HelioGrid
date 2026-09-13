import type { BrandVerdictKind } from './BrandColorField.types';

/**
 * The verdict glyphs, as geometry rather than markup: the web half draws each `d` with `<path>`
 * and the native half with `react-native-svg`'s `<Path>`, so ONE drawing serves both (`M118`).
 * A copy in each half is how a corrected outline lands on one platform only.
 *
 * The strings are SVG path data on a 24x24 grid, not identifiers: `M x y` moves the pen,
 * `h`/`v` draw a horizontal or vertical line, `l` a line to a point, `c` a curve. So
 * `M12 9v4` is "pen to the middle, draw 4 down" — a coordinate, never a ledger row id.
 */
export const VERDICT_PATH: Record<BrandVerdictKind, string> = {
  pass: 'M20 6 9 17l-5-5',
  warn: 'M12 9v4m0 3.5v.01M10.3 3.9 2.7 17a1.6 1.6 0 0 0 1.4 2.4h15.8a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0z',
  info: 'M12 16v-4m0-3.5v-.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
};
