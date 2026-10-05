import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { BLOOM_GEOMETRY, type BrandBloomProps } from './BrandBloom.types';

interface NativeBrandBloomProps extends BrandBloomProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * `--glow-brand` for React Native. The token is a CSS radial-gradient RN cannot paint, so its
 * three stops — --iris-violet at 22%, --iris-blue at 14%, a transparent edge at 72% — are drawn
 * as a real SVG radial gradient from the same tokens. One definition: every bloom on the phone
 * comes through here, never a flat disc that approximates it.
 */
/**
 * CSS's `radial-gradient(circle, …)` reaches the box's FARTHEST CORNER by default, so the 72%
 * stop of a 520×420 bloom sits 240px out, not 187px; the box's diagonal is the radius the token
 * was drawn with. A box whose size is unknown (fill mode) falls back to half its width.
 */
function farthestCorner(width: number, height: number): number {
  return Math.sqrt(width * width + height * height) / 2;
}

/**
 * The bloom's ellipse and its gradient, in the box's own units when its size is known, else as
 * fractions of it: the centre, the radii, and the gradient's reach to the farthest corner.
 */
function shapeOf(known: { width: number; height: number } | null) {
  if (known === null) {
    return {
      cx: '50%',
      cy: '50%',
      rx: '50%',
      ry: '50%',
      reach: '50%',
      units: 'objectBoundingBox',
    } as const;
  }
  const { width, height } = known;
  return {
    cx: width / 2,
    cy: height / 2,
    rx: width / 2,
    ry: height / 2,
    reach: farthestCorner(width, height),
    units: 'userSpaceOnUse',
  } as const;
}

export function BrandBloom({ placement, size, style }: NativeBrandBloomProps) {
  const gradientId = `hg-bloom-${useId()}`;
  const geometry = placement === undefined ? null : BLOOM_GEOMETRY[placement];
  const known =
    geometry !== null
      ? { width: geometry.width, height: geometry.height }
      : size !== undefined
        ? { width: size, height: size }
        : null;
  const shape = shapeOf(known);
  const box: ViewStyle =
    geometry !== null
      ? {
          width: geometry.width,
          height: geometry.height,
          ...(geometry.top === null
            ? { top: '50%', marginTop: -geometry.height / 2 }
            : { top: geometry.top }),
          ...(geometry.left === null ? { alignSelf: 'center' } : { left: geometry.left }),
        }
      : size !== undefined
        ? { width: size, height: size, alignSelf: 'center', top: '50%', marginTop: -size / 2 }
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
          <RadialGradient
            id={gradientId}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.reach}
            gradientUnits={shape.units}
          >
            <Stop offset="0" stopColor={theme.colors['iris-violet']} stopOpacity={0.22} />
            <Stop offset="0.4" stopColor={theme.colors['iris-blue']} stopOpacity={0.14} />
            {/* biome-ignore lint/plugin/raw-white: illustration — a drawn mark */}
            <Stop offset="0.72" stopColor={theme.colors.surface} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* An ellipse, as the artboards draw it: a box would end in a straight edge. */}
        <Ellipse
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          fill={`url(#${gradientId})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  bloom: { position: 'absolute' },
});
