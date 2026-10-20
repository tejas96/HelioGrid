/* Transcript's small shared furniture (native) — the globe glyph on the language line and on the
   in-flow switch marker, and the rhythm the turns sit on. One declaration each, so they never
   drift apart. */

import { theme } from '@heliogrid/theme';
import Svg from 'react-native-svg';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';

/** The rhythm between turns — and between the skeleton bars that hold their footprint. */
export const TRANSCRIPT_GAP = { expressive: 10, functional: theme.spacing['sp-2'] };

/** The mark beside the language words. A second channel beside them, never the carrier. */
export function GlobeGlyph({ size = 14 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.colors['text-tertiary']}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name="globe" />
    </Svg>
  );
}
