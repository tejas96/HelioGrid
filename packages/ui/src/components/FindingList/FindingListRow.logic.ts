import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { FindingStatus } from './FindingList.types';

/** The glyph each status draws, the same on both halves. */
export const FINDING_MARK_GLYPH: Record<FindingStatus, ShellGlyphName> = {
  ready: 'tick',
  blocking: 'alert-long',
  attention: 'alert-mid',
};
