import { theme } from '@heliogrid/tokens/theme';
import type { ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Ambient --glow-brand radial backdrop (atmosphere, never information) — the REAL token
 * stops via react-native-svg: iris-violet 0.22 @0% → iris-blue 0.14 @40% → transparent
 * @72%. Extracted from EmptyState's ratified bloom (owner ruling 2026-07-26) so auth
 * screens and EmptyState share one piece. Decorative only: no pointer events, hidden
 * from accessibility. Positioning belongs to the consumer (pass `style`).
 */
export interface BloomLayerProps {
  size?: number;
  style?: ViewStyle;
}

export function BloomLayer({ size = 220, style }: BloomLayerProps) {
  return (
    <Svg pointerEvents="none" width={size} height={size} style={style} accessible={false}>
      <Defs>
        <RadialGradient id="hgGlowBrand" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={theme.colors['iris-violet']} stopOpacity={0.22} />
          <Stop offset="40%" stopColor={theme.colors['iris-blue']} stopOpacity={0.14} />
          <Stop offset="72%" stopColor={theme.colors['iris-blue']} stopOpacity={0} />
          <Stop offset="100%" stopColor={theme.colors['iris-blue']} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill="url(#hgGlowBrand)" />
    </Svg>
  );
}
