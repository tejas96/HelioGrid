/* What the lines add up to (native) — or the reason they do not add up to a price. Same rules and
   the same words as the web half; `role="alert"` maps to an assertive live region.

   NO PRICE. A failed reconciliation is a defect (SCR-M06-14) and an unresolved line is not a zero,
   so on either the payable is not printed at all and `noPriceSentence` names the gap instead. */

import { theme } from '@heliogrid/theme';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextVariant } from '../../primitives/Text/Text.types';
import type { ResolvedMoney } from '../../utils/money-lines';
import { useFormat } from '../MarketProvider/market-context';
import { renderProvenance } from '../Provenance/Provenance.native';
import { noPriceSentence } from './MoneySummary.sentences';
import type { MoneySummaryProps } from './MoneySummary.types';

/* THE DOCUMENT STEPS ARE PRINT TOKENS. `--doc-fs-figure` (22px) is emitted to CSS only — the RN
   theme object carries no `doc` family — so the payable maps to the NEAREST theme type role rather
   than hand-transcribing a px value the generator owns. */
const figureStyle: TextStyle = {
  fontSize: theme.type.roles.h2.fontSize,
  lineHeight: theme.type.roles.h2.lineHeight,
  letterSpacing: theme.type.roles.h2.letterSpacing,
  fontWeight: '700',
};

const styles = StyleSheet.create({
  total: {
    marginTop: 10,
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: 1,
    borderTopColor: theme.colors['neutral-bg'],
  },
  payable: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-4'],
  },
  payableLabel: { fontWeight: '700', letterSpacing: -0.15 },
  defect: { fontWeight: '500' },
  unapplied: { marginTop: 6 },
  provenance: { marginTop: 6 },
  reconciled: { marginTop: 6 },
  note: { marginTop: theme.spacing['sp-2'] },
});

export function MoneySummaryTotal({
  money,
  payableLabel,
  provenance,
  note,
  variant,
  smallVariant,
}: {
  /** The arithmetic, already resolved by `resolveMoneySummary` — the one money path. */
  money: ResolvedMoney;
  payableLabel: string;
  provenance?: MoneySummaryProps['provenance'];
  note?: MoneySummaryProps['note'];
  /** The surface's own type step — `screen` or `document`, resolved once by the summary. */
  variant: TextVariant;
  smallVariant: TextVariant;
}) {
  const mkt = useFormat();
  const defect = money.reconciliation !== null && !money.reconciliation.agrees;
  const unresolved = money.unresolved.length > 0;

  return (
    <View style={styles.total}>
      {defect || unresolved ? (
        <View accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Text variant={variant} color="danger" style={styles.defect}>
            {noPriceSentence(money, mkt)}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.payable}>
            <Text variant={variant} style={styles.payableLabel}>
              {payableLabel}
            </Text>
            <Text variant="mono" style={figureStyle}>
              {mkt.money(money.payable)}
            </Text>
          </View>
          {money.overDeducted ? (
            <Text variant={smallVariant} color="warning" style={styles.unapplied}>
              {`The deductions exceed the amount by ${mkt.money(money.unapplied)}. The payable is ${mkt.money(0)} and ${mkt.money(money.unapplied)} is unapplied — it is not a refund.`}
            </Text>
          ) : null}
          {provenance ? (
            <View style={styles.provenance}>{renderProvenance(provenance, { size: 12 })}</View>
          ) : null}
          {money.reconciliation?.agrees ? (
            <Text variant={smallVariant} color="secondary" style={styles.reconciled}>
              {`${money.reconciliation.label} reconciles · ${mkt.money(money.reconciliation.amount)}`}
            </Text>
          ) : null}
        </>
      )}
      {note ? (
        <Text variant={smallVariant} color="secondary" style={styles.note}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}
