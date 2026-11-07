import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { UsageMeterProps } from './UsageMeter.types';

/**
 * The meter's head: its label and its figure on one line (`row`), or — in the `tile` form — the
 * glyph and the label over the figure, large in the display face, its denominator quiet after it.
 */
export function UsageMeterHead({
  label,
  form,
  glyph,
  figure,
  after,
}: Pick<UsageMeterProps, 'form' | 'glyph'> & {
  label: TranslatedText;
  /** The figure, formatted. */
  figure: string;
  /** What follows the figure — *of 15 min*, or the unit alone; `null` for none. */
  after: TranslatedText | null;
}) {
  if (form === 'tile') {
    return (
      <View style={styles.tileHead}>
        <View style={styles.tileLabel}>
          {glyph === undefined ? null : <ShellGlyph name={glyph} size="sm" tone="secondary" />}
          <Text variant="body-sm" color="secondary" style={styles.shrink}>
            {label}
          </Text>
        </View>
        <View style={styles.tileFigure}>
          <Text variant="figure">{figure}</Text>
          {after === null ? null : (
            <Text variant="body-sm" color="secondary" style={styles.shrink}>
              {after}
            </Text>
          )}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.rowHead}>
      <Text style={labelStyle}>{label}</Text>
      <Text variant="mono" style={figureWeight}>
        {figure}
        {after === null ? null : (
          <Text variant="mono" color="tertiary">
            {` ${after}`}
          </Text>
        )}
      </Text>
    </View>
  );
}

const labelStyle: TextStyle = {
  fontSize: 14,
  fontWeight: '500',
  letterSpacing: -0.14,
  color: colors['text-primary'],
};

const figureWeight: TextStyle = { fontWeight: '700' };

const styles = StyleSheet.create({
  rowHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  tileHead: { gap: theme.spacing['sp-2'] },
  tileLabel: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  tileFigure: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: theme.spacing['sp-1'],
  },
  shrink: { flexShrink: 1 },
});
