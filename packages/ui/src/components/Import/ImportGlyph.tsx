import { Icon } from '../../primitives/Icon';
import type { IconSize } from '../../primitives/Icon/Icon.types';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';

/**
 * One of the system's glyphs inside `Icon`, at the stroke the board draws it with — the wizard's
 * glyphs sit on the ladder's `xs` and carry their own strokes, which `ShellGlyph` does not offer.
 * Decorative: the control or line that holds it carries the words. The colour is the holder's.
 */
export function ImportGlyph({
  name,
  size,
  stroke,
  className,
}: {
  name: ShellGlyphName;
  size: IconSize;
  stroke: number;
  className?: string;
}) {
  return (
    <Icon size={size} className={className}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <ShellGlyphMarks name={name} />
      </svg>
    </Icon>
  );
}
