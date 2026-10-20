import { theme } from '@heliogrid/theme';
import Svg from 'react-native-svg';
import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import type { ShellGlyphProps } from './AppShell.types';
import { glyphMarks, glyphStroke } from './ShellGlyph.logic';
import { ShellGlyphMarks } from './ShellGlyphMarks.native';

/* react-native-svg has no currentColor, so the tone resolves to its token here. */
const TONE: Record<NonNullable<ShellGlyphProps['tone']>, string> = {
  primary: theme.colors['text-primary'],
  secondary: theme.colors['text-secondary'],
  inverse: theme.colors['text-inverse'],
  accent: theme.colors.accent,
  danger: theme.colors['danger-text'],
};

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
  const { solid } = glyphMarks(name, filled);
  const px = ICON_SIZE[size];
  const color = TONE[tone];
  return (
    <Svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill={solid ? color : 'none'}
      stroke={color}
      strokeWidth={glyphStroke(size)}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <ShellGlyphMarks name={name} filled={filled} />
    </Svg>
  );
}
