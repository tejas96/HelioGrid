/* Transcript's small shared furniture (web) — the globe glyph on the language line and on the
   in-flow switch marker, and the plain pill button that the error state and the reveal control
   both press. One declaration each, so the two never drift apart. */

import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable';

/** The mark beside the language words. A second channel beside them, never the carrier: the
    sentence always states the language in full. */
export function GlobeGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="hg-transcript-globe-svg"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18" />
    </svg>
  );
}

/** "Try again" and "Show the rest of the call" are the same target: a real 44px plain pill. */
export function TranscriptPlainButton({
  disabled,
  onPress,
  children,
}: {
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable className="hg-transcript-plain" disabled={disabled} onPress={onPress}>
      {children}
    </Pressable>
  );
}
