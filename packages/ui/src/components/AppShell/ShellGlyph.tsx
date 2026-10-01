import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import type { ShellGlyphProps } from './AppShell.types';
import { glyphMarks } from './ShellGlyph.logic';

/**
 * One of the shell's own glyphs. Decorative — the control that holds it carries the name — so it
 * is hidden from assistive tech. `tone` sets the colour; the stroke follows it.
 */
export function ShellGlyph({
  name,
  filled = false,
  size = 'lg',
  tone = 'secondary',
}: ShellGlyphProps) {
  const { marks, solid } = glyphMarks(name, filled);
  const px = ICON_SIZE[size];
  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill={solid ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="hg-shell-glyph"
      data-tone={tone}
    >
      {marks.map((mark) =>
        mark.kind === 'path' ? (
          <path key={mark.d} d={mark.d} />
        ) : (
          <circle key={`${mark.cx}-${mark.cy}`} cx={mark.cx} cy={mark.cy} r={mark.r} />
        ),
      )}
    </svg>
  );
}
