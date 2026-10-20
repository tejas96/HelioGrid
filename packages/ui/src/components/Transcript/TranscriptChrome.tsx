import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';

/* Transcript's small shared furniture (web) — the globe glyph on the language line and on the
   in-flow switch marker. One declaration, so the two never drift apart. */

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
      <ShellGlyphMarks name="globe" />
    </svg>
  );
}
