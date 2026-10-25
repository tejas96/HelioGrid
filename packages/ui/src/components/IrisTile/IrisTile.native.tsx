import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { irisTintOf } from '../Avatar/Avatar.logic';
import type { IrisTileProps } from './IrisTile.types';

export function IrisTile({ glyph, iris, size, stroke }: IrisTileProps) {
  const tint = irisTintOf(iris);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { width: size, height: size, backgroundColor: tint.bg }]}
    >
      <Svg
        width={ICON_SIZE.md}
        height={ICON_SIZE.md}
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

const styles = StyleSheet.create({
  tile: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-sm'],
  },
});
