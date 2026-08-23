/* One member of the equation (native) — the same label, note and amount as the web half, at the
   type step the surface resolved.

   AN UNRESOLVED LINE IS NOT A ZERO. It says so in the amount's own footprint, and the summary
   withholds the payable on the strength of it. A deduction carries its sign here rather than in the
   arithmetic: `amount` is a magnitude and `kind` is what it does to the total. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextVariant } from '../../primitives/Text/Text.types';
import type { MoneyLine } from '../../utils/money-lines';
import { useFormat } from '../MarketProvider/market-context';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-4'],
    paddingVertical: 7,
  },
  rowFn: { paddingVertical: 5 },
  labelColumn: { flexShrink: 1, minWidth: 0 },
  amountStrong: { fontWeight: '700' },
});

export function MoneySummaryRow({
  line,
  variant,
  smallVariant,
  density,
}: {
  line: MoneyLine;
  /** The surface's own type step — `screen` or `document`, resolved once by the summary. */
  variant: TextVariant;
  smallVariant: TextVariant;
  density: 'expressive' | 'functional';
}) {
  const mkt = useFormat();
  return (
    <View style={[styles.row, density === 'functional' ? styles.rowFn : null]}>
      <View style={styles.labelColumn}>
        <Text variant={variant}>{line.label}</Text>
        {line.note ? (
          <Text variant={smallVariant} color="secondary">
            {line.note}
          </Text>
        ) : null}
      </View>
      {line.amount === null ? (
        /* An unresolved line is not a zero. It says so, in its own footprint. */
        <Text variant={smallVariant} color="secondary">
          not resolved yet
        </Text>
      ) : (
        <Text variant="mono" style={line.strong ? styles.amountStrong : undefined}>
          {`${line.kind === 'deduct' ? '− ' : ''}${mkt.money(line.amount)}`}
        </Text>
      )}
    </View>
  );
}
