import { COLOR_TOKENS, type ColorToken, theme } from '@heliogrid/theme';
import { type ColorValue, DynamicColorIOS, Platform, PlatformColor } from 'react-native';

/**
 * Every colour as one the system resolves per scheme, so a style written once at import follows
 * light and dark with no re-render: iOS picks a side of a dynamic colour by the window's trait,
 * Android reads `hg_<token>` from `values` or `values-night` (`@heliogrid/theme/android-res`).
 * Arithmetic that needs a hex reads `theme.palettes` through `usePalette`, never this.
 */
/** A colour value as this platform's styles take it. */
export type ThemeColor = ColorValue;

function systemColor(token: ColorToken): ColorValue {
  if (Platform.OS === 'ios') {
    return DynamicColorIOS({
      light: theme.palettes.light[token],
      dark: theme.palettes.dark[token],
    });
  }
  return PlatformColor(`@color/hg_${token.replaceAll('-', '_')}`);
}

export const colors = Object.fromEntries(
  COLOR_TOKENS.map((token) => [token, systemColor(token)]),
) as Readonly<Record<ColorToken, ThemeColor>>;
