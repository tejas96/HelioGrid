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
/** Geist Bold's "Grid" is about 2.2 em wide; the measuring twin corrects it on first layout. */
const GRID_WIDTH_EM = 2.2;
const GRID = 'Grid';

interface NativeWordmarkProps extends WordmarkProps {
  style?: StyleProp<TextStyle>;
}
interface NativeLogoTileProps extends LogoTileProps {
  style?: StyleProp<ViewStyle>;
}

function baseType(size: number, tone: WordmarkProps['tone']): TextStyle {
  return {
    fontFamily: theme.type.families.sans,
    fontWeight: '700',
    fontSize: size,
    lineHeight: size,
    letterSpacing: size * TRACKING,
    color: tone === 'onDark' ? theme.colors['text-inverse'] : theme.colors['text-primary'],
  };
}

/**
 * The identity. "Helio" is type in ink; "Grid" is the same type filled with `--gradient-brand`
 * — real gradient TYPE, as the web half clips it, never a colour per letter. RN cannot clip a
 * gradient to text, so "Grid" is drawn as SVG text filled by `BrandGradientDefs`, sized by an
 * invisible measuring twin so the run is exactly as wide as the type it replaces.
 */
export function Wordmark({ size = 22, tone = 'default', style }: NativeWordmarkProps) {
  const base = baseType(size, tone);
  const gradientId = `hg-wordmark-${useId()}`;
  const [gridWidth, setGridWidth] = useState(size * GRID_WIDTH_EM);
  const measured = (event: LayoutChangeEvent) => setGridWidth(event.nativeEvent.layout.width);
  if (tone === 'mono') {
    return <Text style={[base, style]}>HelioGrid</Text>;
  }
  return (
    <View accessible accessibilityRole="text" accessibilityLabel="HelioGrid" style={styles.row}>
      <Text style={[base, style]}>Helio</Text>
      <View style={{ width: gridWidth, height: size }}>
        <RNText
          onLayout={measured}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[base, styles.twin]}
        >
          {GRID}
        </RNText>
        <Svg width={gridWidth} height={size}>
          <BrandGradientDefs id={gradientId} />
          <SvgText
            x={0}
            y={size * BASELINE}
            fontFamily={theme.type.families.sans}
            fontSize={size}
            fontWeight="700"
            letterSpacing={size * TRACKING}
            fill={`url(#${gradientId})`}
          >
            {GRID}
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  /* Laid out, never seen: it measures the run the gradient text must match. */
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
