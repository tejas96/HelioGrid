import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { StatCardDeltaDir } from './StatCard.types';

/** The glyph each direction draws, the same on both halves. */
export const DELTA_DIR_GLYPH: Record<StatCardDeltaDir, ShellGlyphName> = {
  up: 'trend-up',
  down: 'trend-down',
  flat: 'minus',
};
