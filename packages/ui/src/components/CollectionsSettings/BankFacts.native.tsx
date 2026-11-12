import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { bankFactsOf } from './CollectionsSettings.logic';
import type { BankFactsProps } from './CollectionsSettings.types';

/** The bank account on the phone: one row per fact, term beside value, a hairline between. */
export function BankFacts(props: BankFactsProps) {
  return (
    <View style={styles.facts}>
      {bankFactsOf(props).map((fact) => (
        <View key={fact.key} style={styles.fact}>
          <Text variant="body-sm" color="secondary">
            {fact.term}
          </Text>
          <View style={styles.value}>
            <Text variant={fact.mono ? 'mono' : 'body-sm'} align="end">
              {fact.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  facts: { gap: theme.spacing['sp-2'] },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-4'],
    paddingBottom: theme.spacing['sp-2'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors['line-soft'],
  },
  value: { flexShrink: 1, alignItems: 'flex-end' },
});
