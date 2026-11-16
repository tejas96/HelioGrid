import type { ShellGlyphSize } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ImageGlyphName } from './Image.missing';
import { IMAGE_GLYPH } from './Image.missing';

/* The three marks the frame can draw. Split out of Image.tsx so the missing panel, the photo and
   the reference badge all reach for the same one. */

export function Glyph({ name, size = 'lg' }: { name: ImageGlyphName; size?: ShellGlyphSize }) {
  return (
    <span className="hg-image-glyph">
      <ShellGlyph name={IMAGE_GLYPH[name]} size={size} tone="current" />
    </span>
  );
}
