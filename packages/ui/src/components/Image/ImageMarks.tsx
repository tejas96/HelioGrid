import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { ImageGlyphName } from './Image.missing';
import { IMAGE_GLYPH } from './Image.missing';

/* The three marks the frame can draw. Split out of Image.tsx so the missing panel, the photo and
   the reference badge all reach for the same one. */

export function Glyph({ name, size = 24 }: { name: ImageGlyphName; size?: number }) {
  return (
    <svg
      className="hg-image-glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ShellGlyphMarks name={IMAGE_GLYPH[name]} />
    </svg>
  );
}
