import { createContext, useContext } from 'react';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { TONE } from '../../primitives/Tone/tone.native';
import type { ShellGlyphProps } from './AppShell.types';
import { SHELL_GLYPHS } from './ShellGlyph.icons';
import { GLYPH_SIZE, GLYPH_STROKE } from './ShellGlyph.logic';

/* react-native-svg has no inherited colour, so the tone resolves to its token here. */
const GLYPH_INK: Record<Exclude<NonNullable<ShellGlyphProps['tone']>, 'current'>, ThemeColor> = {
  primary: colors['text-primary'],
  secondary: colors['text-secondary'],
  inverse: colors['text-inverse'],
  accent: colors.accent,
  info: colors.info,
  danger: TONE.danger.ink,
  success: TONE.success.ink,
  warning: TONE.warning.ink,
};

/**
 * The ink of the filled pill a glyph stands on — a primary or destructive `Button`'s words — which
 * wins over the glyph's own tone, as the web's `.hg-button > svg` inherits it: a glyph left at its
 * default drew a dark mark on the ocean fill. Null off a filled pill.
 */
export const GlyphInkContext = createContext<ThemeColor | null>(null);

/**
 * One of the design system's glyphs, hidden from assistive tech unless it has a `label`. `ink`
 * wins, then the filled pill's ink, then `tone`.
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
  const pill = useContext(GlyphInkContext);
  /* react-native-svg paints a system colour here; Lucide's props type it as a string only. */
  const color = (ink ?? pill ?? GLYPH_INK[tone === 'current' ? 'primary' : tone]) as string;
  return (
    <Glyph
      size={GLYPH_SIZE[size]}
      stroke={color}
      strokeWidth={GLYPH_STROKE}
      fill={fill === 'ink' ? color : ((fill as string | undefined) ?? 'none')}
      {...(label === undefined
        ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' }
        : { accessible: true, accessibilityRole: 'image', accessibilityLabel: label })}
    />
  );
}
