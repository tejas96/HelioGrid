import Svg from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import type { IconSize } from '../../primitives/Icon/Icon.types';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';

/**
 * One of the system's glyphs inside `Icon`, at the stroke the board draws it with — the wizard's
 * glyphs sit on the ladder's `xs` and carry their own strokes and inks, which `ShellGlyph` does not
 * offer. Decorative: the control or line that holds it carries the words. react-native-svg has no
 * inherited colour, so the holder passes its theme ink.
 */
export function ImportGlyph({
  name,
  size,
  stroke,
  color,
}: {
  name: ShellGlyphName;
  size: IconSize;
  stroke: number;
  color: string;
}) {
  return (
    <Icon size={size} color={color}>
      <Svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={name} />
      </Svg>
    </Icon>
  );
}
