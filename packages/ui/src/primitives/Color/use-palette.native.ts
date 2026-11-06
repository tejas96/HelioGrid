import { type ThemePalette, theme } from '@heliogrid/theme';
import { useColorScheme } from 'react-native';

/** The palette of the scheme on screen, as hex — for a gradient stop or a mix, never a style. */
export function usePalette(): ThemePalette {
  return useColorScheme() === 'dark' ? theme.palettes.dark : theme.palettes.light;
}
