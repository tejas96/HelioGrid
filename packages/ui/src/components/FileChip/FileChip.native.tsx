import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { useGround } from '../../primitives/Ground/Ground.native';
import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import { Text } from '../../primitives/Text/Text.native';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { Button } from '../Button/Button.native';
import { inkOver } from '../ShareFilter/ShareFilter.inks';
import type { FileChipProps } from './FileChip.types';

interface NativeFileChipProps extends FileChipProps {
  style?: StyleProp<ViewStyle>;
}

/* `FileChip.css`'s three mixes: the chip's wash, the wide tile's wash and the glyph's ink. */
const IRIS = theme.colors['iris-blue'];
const CHIP_WASH = 0.08;
const TILE_WASH = 0.16;
const GLYPH_INK = inkOver(IRIS, theme.colors['text-primary'], 0.72);

/**
 * One chosen file, named: a sheet glyph, the file's name on one line (it is data, so it is cut, not
 * wrapped), what was read in it or what went wrong, and *Replace* when the caller offers it.
 * `wide` sets the glyph in its own tile. The glyph is decoration; the name says what the file is.
 */
export function FileChip({
  name,
  meta,
  tone = 'read',
  layout = 'compact',
  onReplace,
  replaceLabel,
  style,
}: NativeFileChipProps) {
  const { ground } = useGround();
  const wide = layout === 'wide';
  const glyph = (
    <Svg
      width={ICON_SIZE.md}
      height={ICON_SIZE.md}
      viewBox="0 0 24 24"
      fill="none"
      stroke={GLYPH_INK}
      strokeWidth={glyphStroke('md')}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <ShellGlyphMarks name="board" />
    </Svg>
  );
  return (
    <View
      style={[
        styles.chip,
        wide ? styles.chipWide : undefined,
        { backgroundColor: inkOver(IRIS, ground, CHIP_WASH) },
        style,
      ]}
    >
      {wide ? (
        <View style={[styles.tile, { backgroundColor: inkOver(IRIS, ground, TILE_WASH) }]}>
          {glyph}
        </View>
      ) : (
        glyph
      )}
      <View style={styles.words}>
        <Text variant="body-sm" bold oneLine>
          {name}
        </Text>
        <Text variant="caption" color={tone === 'problem' ? 'danger' : 'secondary'}>
          {meta}
        </Text>
      </View>
      {onReplace !== undefined && replaceLabel !== undefined ? (
        <Button variant="ghost" size="sm" onClick={onReplace}>
          {replaceLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingLeft: 14,
    paddingRight: theme.spacing['sp-3'],
    borderRadius: 14,
  },
  chipWide: {
    paddingRight: 14,
  },
  tile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-sm'],
  },
  words: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing['sp-0-5'],
  },
});
