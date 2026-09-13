import type { FindingStatus } from './FindingList.types';

/**
 * The status marks, as geometry rather than markup: the web half draws each `d` with `<path>`
 * and the native half with `react-native-svg`'s `<Path>`, so ONE drawing serves both (`M118`).
 * A copy in each half is how a corrected outline lands on one platform only.
 *
 * The strings are SVG path data on a 24x24 grid, not identifiers: `M x y` moves the pen,
 * `h`/`v` draw a horizontal or vertical line, `l` a line to a point, `c` a curve. So
 * `M12 9v4` is "pen to the middle, draw 4 down" — a coordinate, never a ledger row id.
 */
export const FINDING_MARK_PATH: Record<FindingStatus, string> = {
  ready: 'M5 13l4 4L19 7',
  blocking: 'M12 7v7M12 17.5h.01',
  attention: 'M12 8v5M12 16.5h.01',
};
