/* Transcript's small shared furniture (native) — the globe glyph on the language line and on the
   in-flow switch marker, and the rhythm the turns sit on. One declaration each, so they never
   drift apart. */

import { theme } from '@heliogrid/theme';
import { colors } from '../../primitives/Color/colors';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';

/** The rhythm between turns — and between the skeleton bars that hold their footprint. */
export const TRANSCRIPT_GAP = { expressive: 10, functional: theme.spacing['sp-2'] };

/** The mark beside the language words. A second channel beside them, never the carrier. */
export function GlobeGlyph() {
  return <ShellGlyph name="globe" size="dense" ink={colors['text-tertiary']} />;
}
