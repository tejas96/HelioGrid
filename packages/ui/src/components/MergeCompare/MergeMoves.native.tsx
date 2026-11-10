import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { useFormat } from '../MarketProvider/market-context';
import { MERGE_MOVE_GLYPH } from './MergeCompare.logic';
import type { MergeMovesProps } from './MergeCompare.types';

/**
 * What a merge moves, counted, and what it leaves: the other record's fate, no money, and — where
 * the act sits beside it — that it cannot be undone. It draws no card of its own: the phone's
 * confirm sets it in a card, the web's compare in the hero.
 */
export function MergeMoves({
  heading,
  rows,
  tombstone,
  noMoney,
  cannotUndo,
  none,
}: MergeMovesProps) {
  const format = useFormat();
  return (
    <View style={styles.moves}>
      <Text variant="overline" color="secondary">
        {heading}
      </Text>
      <View>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <ShellGlyph name={MERGE_MOVE_GLYPH[row.key]} size="md" tone="secondary" />
            <View style={styles.words}>
              <Text variant="body">{row.label}</Text>
              {row.note === null ? null : (
                <Text variant="body-sm" color="secondary">
                  {row.note}
                </Text>
              )}
            </View>
            {row.count === 0 ? (
              <Text variant="body" color="secondary">
                {none}
              </Text>
            ) : (
              <Text variant="mono" bold>
                {format.number(row.count)}
              </Text>
            )}
          </View>
        ))}
      </View>
      {tombstone === null ? null : (
        <View style={styles.fact}>
          <ShellGlyph name="link" size="md" tone="secondary" />
          <View style={styles.words}>
            <Text variant="body-sm">{tombstone}</Text>
          </View>
        </View>
      )}
      <View style={styles.fact}>
        <ShellGlyph name="rupee" size="md" tone="success" />
        <View style={styles.words}>
          <Text variant="body-sm">
            <Text variant="body-sm" bold>
              {noMoney.title}
            </Text>{' '}
            {noMoney.line}
          </Text>
        </View>
      </View>
      {cannotUndo === null ? null : (
        <View style={styles.fact}>
          <ShellGlyph name="alert-triangle" size="md" tone="warning" />
          <View style={styles.words}>
            <Text variant="body-sm" color="warning" bold>
              {cannotUndo}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  moves: { gap: theme.spacing['sp-3'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors['line-soft'],
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
});
