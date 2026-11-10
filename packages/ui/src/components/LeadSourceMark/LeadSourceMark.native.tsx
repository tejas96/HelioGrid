import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { sourceGlyphOf } from './LeadSourceMark.logic';
import type { LeadSourceMarkProps } from './LeadSourceMark.types';

interface NativeLeadSourceMarkProps extends LeadSourceMarkProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Where an enquiry came from (`M02-13`): the source's glyph and its word, or the glyph alone with
 * the word as its name — never a glyph a screen reader cannot name.
 */
export function LeadSourceMark({ source, label, form = 'word', style }: NativeLeadSourceMarkProps) {
  const alone = form === 'glyph';
  return (
    <View
      accessible={alone}
      accessibilityRole={alone ? 'image' : undefined}
      accessibilityLabel={alone ? label : undefined}
      style={[styles.mark, style]}
    >
      <ShellGlyph name={sourceGlyphOf(source)} size="sm" tone="secondary" />
      {alone ? null : (
        <Text variant="body-sm" color="secondary" style={styles.word}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'], minWidth: 0 },
  word: { flexShrink: 1 },
});
