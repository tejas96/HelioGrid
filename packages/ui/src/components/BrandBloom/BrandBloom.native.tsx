import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { usePalette } from '../../primitives/Color/use-palette.native';
import { type BrandBloomProps, CENTRE_BLOOM_SIZE, PAGE_GLOW_HEIGHT } from './BrandBloom.types';

interface NativeBrandBloomProps extends BrandBloomProps {
  style?: StyleProp<ViewStyle>;
}

interface Light {
  readonly color: string;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly opacity: number;
}

/* The web's `--glow-page`, drawn: teal from the top right, green over the middle, blue from the
   left, each fading to nothing in its own colour so no edge shows. Stronger on the dark canvas. */
function pageLights(dark: boolean): readonly Light[] {
  const lift = dark ? 1.4 : 1;
  return [
    { color: theme.brand.teal, cx: 0.9, cy: -0.25, r: 0.95, opacity: 0.12 * lift },
    { color: theme.brand.green, cx: 0.55, cy: -0.35, r: 0.8, opacity: 0.1 * lift },
    { color: theme.brand.blue, cx: 0.05, cy: -0.3, r: 0.75, opacity: 0.08 * lift },
  ];
}

const MARK_LIGHTS: readonly Light[] = [
  { color: theme.brand.teal, cx: 0.5, cy: 0.5, r: 0.5, opacity: 0.18 },
  { color: theme.brand.green, cx: 0.5, cy: 0.5, r: 0.36, opacity: 0.1 },
];

export function BrandBloom({ placement, size, style }: NativeBrandBloomProps) {
  const id = `hg-bloom-${useId().replaceAll(':', '')}`;
  const palette = usePalette();
  const lights = placement === 'page' ? pageLights(palette === theme.palettes.dark) : MARK_LIGHTS;
  const side = placement === 'centre' ? CENTRE_BLOOM_SIZE : size;
  const box: ViewStyle =
    placement === 'page'
      ? { top: 0, left: 0, right: 0, height: PAGE_GLOW_HEIGHT }
      : side !== undefined
        ? { width: side, height: side, alignSelf: 'center', top: '50%', marginTop: -side / 2 }
        : { top: 0, left: 0, right: 0, bottom: 0 };
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.bloom, box, style]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          {lights.map((light, index) => (
            <RadialGradient
              // biome-ignore lint/suspicious/noArrayIndexKey: the lights are a fixed list in order
              key={index}
              id={`${id}-${index}`}
              cx={light.cx}
              cy={light.cy}
              r={light.r}
            >
              <Stop offset="0" stopColor={light.color} stopOpacity={light.opacity} />
              <Stop offset="1" stopColor={light.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {lights.map((_, index) => (
          <Rect
            // biome-ignore lint/suspicious/noArrayIndexKey: the lights are a fixed list in order
            key={index}
            width="100%"
            height="100%"
            fill={`url(#${id}-${index})`}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  bloom: { position: 'absolute' },
});
