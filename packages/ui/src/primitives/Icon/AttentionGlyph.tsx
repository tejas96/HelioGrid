import type { AttentionGlyphProps } from './AttentionGlyph.types';

/** The attention mark — an upright stroke over a dot. Drawn here because `M118` keeps glyphs in this package. */
export function AttentionGlyph(props: AttentionGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}
