import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * `--gradient-brand` for React Native.
 *
 * The token is a CSS `linear-gradient(135deg, …)` string, which RN cannot use as a background, so
 * the same three stops are drawn as a real SVG gradient at the same 135° diagonal (x1,y1 → x2,y2
 * across the object box). Absolutely filled, so any View can wear it by rendering this inside.
 */
export function BrandGradientFill() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="hgBrand" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.colors['iris-violet']} />
          <Stop offset="0.45" stopColor={theme.colors['iris-blue']} />
          <Stop offset="1" stopColor={theme.colors['iris-magenta']} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#hgBrand)" />
    </Svg>
  );
}
