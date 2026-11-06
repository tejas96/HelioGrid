import { theme } from '@heliogrid/theme';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * `--gradient-brand` for React Native: the logo's green → teal → blue, left to right, declared
 * once so a hero's top line, a progress fill and the brand mark never carry a second copy;
 * `diagonal` runs it top to bottom across a mark, as the logo does. Render inside an `<Svg>`, then
 * fill with `url(#id)`.
 */
export function BrandGradientDefs({ id, diagonal = false }: { id: string; diagonal?: boolean }) {
  return (
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2={diagonal ? '0.35' : '1'} y2={diagonal ? '1' : '0'}>
        {theme.brand.gradient.map((stop) => (
          <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
        ))}
      </LinearGradient>
    </Defs>
  );
}
