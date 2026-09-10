import { theme } from '@heliogrid/theme';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * `--gradient-brand` for React Native: the token's three stops at its 135° diagonal (x1,y1 →
 * x2,y2 across the object box), declared once so a tile, a progress fill and the wordmark's
 * "Grid" never carry a second copy. Render inside an `<Svg>`, then fill with `url(#id)`.
 */
export function BrandGradientDefs({ id }: { id: string }) {
  return (
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={theme.colors['iris-violet']} />
        <Stop offset="0.45" stopColor={theme.colors['iris-blue']} />
        <Stop offset="1" stopColor={theme.colors['iris-magenta']} />
      </LinearGradient>
    </Defs>
  );
}
