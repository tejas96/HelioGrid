import { theme } from '@heliogrid/theme';
import { useId, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text as RNText, StyleSheet, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
/* The primitive's NATIVE half is imported by path: tsc has no `moduleSuffixes` configured, so
   the barrel would hand this file the web signature. Metro resolves the explicit path
   identically, and no web bundler ever reads a .native.tsx. */
import { Text } from '../../primitives/Text/Text.native';
import { BrandGradientDefs } from '../../utils/brand-gradient.native';
import type { LogoTileProps, WordmarkProps } from './Wordmark.types';

/** −0.03em, the system's own display tracking, expressed against the caller's size. */
const TRACKING = -0.03;
/** Where Geist Bold's baseline sits in a line box as tall as the size — measured on the web half. */
const BASELINE = 0.78;
/** Geist Bold's runs are about this many em wide; the measuring twins correct them on first layout. */
const HELIO_WIDTH_EM = 2.6;
const GRID_WIDTH_EM = 2.2;
const HELIO = 'Helio';
const GRID = 'Grid';

interface NativeWordmarkProps extends WordmarkProps {
  style?: StyleProp<ViewStyle>;
}
interface NativeLogoTileProps extends LogoTileProps {
  style?: StyleProp<ViewStyle>;
}

function inkOf(tone: WordmarkProps['tone']): string {
  return tone === 'onDark' ? theme.colors['text-inverse'] : theme.colors['text-primary'];
}

function baseType(size: number, tone: WordmarkProps['tone']): TextStyle {
  return {
    fontFamily: theme.type.families.sans,
    fontWeight: '700',
    fontSize: size,
    lineHeight: size,
    letterSpacing: size * TRACKING,
    color: inkOf(tone),
  };
}

/** Laid out, never seen: it measures the run an SVG text must be as wide as. */
function MeasuringTwin({
  run,
  type,
  onWidth,
}: {
  run: string;
  type: TextStyle;
  onWidth: (width: number) => void;
}) {
  return (
    <RNText
      onLayout={(event: LayoutChangeEvent) => onWidth(event.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[type, styles.twin]}
    >
      {run}
    </RNText>
  );
}

/**
 * The identity. "Helio" is type in ink; "Grid" is the same type filled with `--gradient-brand`
 * — real gradient TYPE, as the web half clips it, never a colour per letter. RN cannot clip a
 * gradient to text, so BOTH runs are SVG text at one `y`: a native `Text` beside SVG text sits on
 * a different baseline on each platform, which lifted "Grid" on Android and dropped it on iOS.
 * Invisible measuring twins make each run exactly as wide as the type it stands for.
 */
export function Wordmark({ size = 22, tone = 'default', style }: NativeWordmarkProps) {
  const base = baseType(size, tone);
  const gradientId = `hg-wordmark-${useId()}`;
  const [helioWidth, setHelioWidth] = useState(size * HELIO_WIDTH_EM);
  const [gridWidth, setGridWidth] = useState(size * GRID_WIDTH_EM);
  if (tone === 'mono') {
    return <Text style={[base, style]}>HelioGrid</Text>;
  }
  const run = {
    y: size * BASELINE,
    fontFamily: theme.type.families.sans,
    fontSize: size,
    fontWeight: '700' as const,
    letterSpacing: size * TRACKING,
  };
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel="HelioGrid"
      style={[{ width: helioWidth + gridWidth, height: size }, style]}
    >
      <MeasuringTwin run={HELIO} type={base} onWidth={setHelioWidth} />
      <MeasuringTwin run={GRID} type={base} onWidth={setGridWidth} />
      <Svg width={helioWidth + gridWidth} height={size}>
        <BrandGradientDefs id={gradientId} />
        <SvgText {...run} x={0} fill={inkOf(tone)}>
          {HELIO}
        </SvgText>
        <SvgText {...run} x={helioWidth} fill={`url(#${gradientId})`}>
          {GRID}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  twin: { position: 'absolute', left: 0, top: 0, opacity: 0 },
});

export function LogoTile({ size = 40, radius = 12, style }: NativeLogoTileProps) {
  const gradientId = `hg-logo-tile-${useId()}`;
  const frame: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="HelioGrid"
      style={[frame, theme.elevation.e2, style]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <BrandGradientDefs id={gradientId} />
        <Rect
          x="0"
          y="0"
          width={size}
          height={size}
          rx={radius}
          ry={radius}
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <Text
        style={{
          fontFamily: theme.type.families.sans,
          fontWeight: '700',
          fontSize: Math.round(size * 0.45),
          letterSpacing: Math.round(size * 0.45) * TRACKING,
          color: theme.colors['text-inverse'],
        }}
      >
        H
      </Text>
    </View>
  );
}
