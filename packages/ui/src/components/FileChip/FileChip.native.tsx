import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import type { FileChipProps } from './FileChip.types';

interface NativeFileChipProps extends FileChipProps {
  style?: StyleProp<ViewStyle>;
}

/* `FileChip.css`'s three mixes: the chip's wash, the wide tile's wash and the glyph's ink. */
const GLYPH_INK = colors['hue-teal-text'];

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
  const wide = layout === 'wide';
  const glyph = <ShellGlyph name="board" size="md" ink={GLYPH_INK} />;
  return (
    <View
      style={[
        styles.chip,
        wide ? styles.chipWide : undefined,
        { backgroundColor: colors['hue-teal-bg'] },
        style,
      ]}
    >
      {wide ? (
        <View style={[styles.tile, { backgroundColor: colors['hue-teal-bg'] }]}>{glyph}</View>
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
    borderRadius: theme.radius['r-md'],
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
