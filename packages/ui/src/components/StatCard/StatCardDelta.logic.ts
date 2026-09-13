import type { StatCardDeltaDir } from './StatCard.types';

/**
 * The direction arrows, as geometry rather than markup: the web half draws each `d` with
 * `<path>` and the native half with `react-native-svg`'s `<Path>`, so ONE drawing serves both
 * (`M118`). A copy in each half is how a corrected arrow lands on one platform only.
 *
 * The strings are SVG path data on a 24x24 grid, not identifiers: `M x y` moves the pen,
 * `h`/`v` draw a horizontal or vertical line, `l` a line to a point, `c` a curve. So
 * `M12 9v4` is "pen to the middle, draw 4 down" — a coordinate, never a ledger row id.
 */
export const DELTA_DIR_PATH: Record<StatCardDeltaDir, string> = {
  up: 'M7 17 17 7M17 7H9m8 0v8',
  down: 'M7 7l10 10M17 17H9m8 0V9',
  flat: 'M5 12h14',
};
