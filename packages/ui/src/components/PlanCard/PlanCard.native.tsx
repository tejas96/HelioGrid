import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import type { PlanCardProps } from './PlanCard.types';

/** The plan card's body (phone): the headline figure, its line, then the one flowing limits line. */
export function PlanCard({ form, name, figure, gap, note, lines }: PlanCardProps) {
  return (
    <View style={form === 'head' ? styles.head : styles.card}>
      {figure === null ? null : (
        <View style={styles.price}>
          {figure.lead === null ? null : (
            <Text variant="body-sm" color="secondary">
              {figure.lead}
            </Text>
          )}
          <Text variant="h1" bold oneLine style={styles.figure}>
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
      {lines.length === 0 ? null : (
        <FactRows label={name} density="expressive" form="lead">
          {lines.map((line) => (
            <FactRow key={line.key} label={line.label} values={[...line.values]} />
          ))}
        </FactRows>
      )}
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
  figure: { fontFamily: theme.type.families.mono, fontVariant: ['tabular-nums'] },
});
