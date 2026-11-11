import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { HUE_TILE_GLYPH, hueTileTintOf } from './HueTile.logic';
import type { HueTileProps, HueTileSize } from './HueTile.types';

export function HueTile({ glyph, hue, size, stroke }: HueTileProps) {
  const tint = hueTileTintOf(hue);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radiusOf(size), backgroundColor: tint.bg },
      ]}
    >
      <Svg
        width={HUE_TILE_GLYPH[size]}
        height={HUE_TILE_GLYPH[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke={tint.fg}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={glyph} />
      </Svg>
    </View>
  );
}

/** A group head's small tile rounds less; a hero's or a sheet's moment, as a tile does. */
function radiusOf(size: HueTileSize): number {
  if (size === 24) return theme.radius['r-xs'];
  return size >= 48 ? theme.radius['r-tile'] : theme.radius['r-sm'];
}

const styles = StyleSheet.create({
  tile: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
