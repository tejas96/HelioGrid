import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import type { PlanCardProps } from './PlanCard.types';

/**
 * The plan card's body (phone): the headline figure, its line, then each line's values as a short
 * list, a tick before each, under its quiet label.
 */
export function PlanCard({ form, figure, gap, note, lines }: PlanCardProps) {
  return (
    <View style={form === 'head' ? styles.head : styles.card}>
      {figure === null ? null : (
        <View style={styles.price}>
          {figure.lead === null ? null : (
            <Text variant="body-sm" color="secondary">
              {figure.lead}
            </Text>
          )}
          <Text variant="display" oneLine style={styles.figure}>
            {figure.figure}
          </Text>
          {figure.trail === null ? null : (
            <Text variant="body-sm" color="secondary">
              {figure.trail}
            </Text>
          )}
          <Text variant="body-sm" color="secondary">
            {figure.period}
          </Text>
        </View>
      )}
      {gap === null ? null : <NamedGap gap={gap} scale="headline" />}
      {note === null ? null : (
        <Text variant="body-sm" color="secondary">
          {note}
        </Text>
      )}
      {lines.map((line) => (
        <View key={line.key} style={styles.group}>
          <Text variant="body-sm" color="secondary">
            {line.label}
          </Text>
          {line.values.map((value) => (
            <View key={value} style={styles.line}>
              <View style={styles.tick}>
                <ShellGlyph name="tick-small" size="sm" tone="success" />
              </View>
              <Text variant="body-sm" style={styles.lineText}>
                {value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing['sp-3'] },
  head: { gap: theme.spacing['sp-2'] },
  price: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
  },
  /* The card's one headline figure: the display face, tabular (`F7-09`'s hero ruling). */
  figure: { fontVariant: ['tabular-nums'] },
  group: { gap: theme.spacing['sp-1'] },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  tick: { paddingTop: theme.spacing['sp-0-5'] },
  lineText: { flex: 1 },
});
