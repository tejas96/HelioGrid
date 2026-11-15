import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { usePalette } from '../../primitives/Color/use-palette';

/**
 * The rows fading out under the sheet's head as they scroll away — luminance, never a divider line
 * or a shadowed slab — drawn as one vector fill, as `PictureShade` is. It fades from the sheet's
 * own ground and shows only while the body is scrolled (`tuck`).
 */
export function SheetFade({ tuck }: { tuck: Animated.Value }) {
  const id = useId();
  /* A gradient stop takes a hex, not the system colour a style takes: the sheet's own ground, so
     the fade draws no band of another colour. */
  const ground = usePalette().surface;
  return (
    <Animated.View pointerEvents="none" style={[styles.fade, { opacity: tuck }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset={0} stopColor={ground} stopOpacity={1} />
            <Stop offset={1} stopColor={ground} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: theme.spacing['sp-5'],
    zIndex: 1,
  },
});
