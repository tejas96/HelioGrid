import { createContext, useContext } from 'react';
import Svg from 'react-native-svg';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import type { ShellGlyphProps } from './AppShell.types';
import { glyphMarks, glyphStroke } from './ShellGlyph.logic';
import { ShellGlyphMarks } from './ShellGlyphMarks.native';

/* react-native-svg has no currentColor, so the tone resolves to its token here. */
const TONE: Record<NonNullable<ShellGlyphProps['tone']>, ThemeColor> = {
  primary: colors['text-primary'],
  secondary: colors['text-secondary'],
  inverse: colors['text-inverse'],
  accent: colors.accent,
  info: colors.info,
  danger: colors['danger-text'],
  success: colors['success-text'],
  warning: colors['warning-text'],
};

/**
 * The ink of the filled pill a glyph stands on — a primary or destructive `Button`'s words — which
 * wins over the glyph's own tone, as the web's `.hg-button > svg` inherits it: a glyph left at its
 * default drew a dark mark on the ocean fill. Null off a filled pill.
 */
export const GlyphInkContext = createContext<ThemeColor | null>(null);

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
  const color = useContext(GlyphInkContext) ?? TONE[tone];
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
