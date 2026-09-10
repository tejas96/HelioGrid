import { StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { BrandGradientDefs } from '../../utils/brand-gradient.native';

const GRADIENT_ID = 'hgBrand';

/**
 * `--gradient-brand` as a fill for React Native: any View wears it by rendering this inside.
 * The stops are `BrandGradientDefs`'s — one definition for the whole native half.
 */
export function BrandGradientFill() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <BrandGradientDefs id={GRADIENT_ID} />
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${GRADIENT_ID})`} />
    </Svg>
  );
}
