import type { ShellGlyphProps } from './AppShell.types';
import { SHELL_GLYPHS } from './ShellGlyph.icons';
import { GLYPH_SIZE, GLYPH_STROKE } from './ShellGlyph.logic';

/**
 * One of the design system's glyphs, hidden from assistive tech unless it has a `label`. `tone`
 * sets the colour from `ShellGlyph.css`; `ink` wins.
 */
export function ShellGlyph({
  name,
  size = 'lg',
  tone = 'secondary',
  ink,
  fill,
  label,
}: ShellGlyphProps) {
  const Glyph = SHELL_GLYPHS[name];
  return (
    <Glyph
      size={GLYPH_SIZE[size]}
      strokeWidth={GLYPH_STROKE}
      fill={fill === 'ink' ? 'currentColor' : (fill ?? 'none')}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className="hg-shell-glyph"
      data-size={size}
      data-tone={ink === undefined ? tone : undefined}
      style={ink === undefined ? undefined : { color: ink }}
    />
  );
}
