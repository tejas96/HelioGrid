import { COLOR_TOKENS, type ColorToken } from '@heliogrid/theme';

/**
 * Every colour as its custom property, so a value set from code follows light, dark and field mode
 * exactly as a stylesheet does. Arithmetic that needs a hex reads `theme.palettes`, never this.
 */
/** A colour value as this platform's styles take it. */
export type ThemeColor = string;

export const colors = Object.fromEntries(
  COLOR_TOKENS.map((token) => [token, `var(--${token})`]),
) as Readonly<Record<ColorToken, ThemeColor>>;
