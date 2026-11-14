import type { ProvenanceTier as Tier } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { BlockFigure, BlockOver, BlockTier, MONO, PAPER_TYPE } from './BlockParts.native';
import { type BlockInk, useBlockInk } from './block-ink.native';
import { Growing } from './Growing.native';
import { PaybackCurve } from './PaybackCurve.native';
import { billShare, paybackGeometry } from './ProposalBlocks.logic';
import type { ProposalBlockMode, ProposalSavingsBlockProps } from './ProposalBlocks.types';
import { savingsView } from './ProposalBlocks.views';

const display = theme.type.families.display;

/** One of the figures under the curve: its value in the display face over its own words. */
export function TrioCell({
  mode,
  value,
  name,
  tier,
  ink,
}: {
  mode: ProposalBlockMode;
  value: string;
  name: string;
  /** The figure's own tier, where no block head carries one (the EMI example). */
  tier?: Tier;
  ink: BlockInk;
}) {
  const paper = mode === 'paper';
  return (
    <View style={[styles.cell, { borderTopColor: ink.hairline }]}>
      <Text
        variant="figure"
        style={[styles.cellValue, { color: ink.text }, paper ? styles.cellValuePaper : undefined]}
      >
        {value}
      </Text>
      <Text
        variant="caption"
        style={[
          styles.cellName,
          { color: ink.secondary },
          paper ? styles.cellNamePaper : undefined,
        ]}
      >
        {name}
      </Text>
      {tier === undefined ? null : <BlockTier mode={mode} tier={tier} />}
    </View>
  );
}

function BillRow({
  mode,
  name,
  amount,
  share,
  fill,
  ink,
}: {
  mode: ProposalBlockMode;
  name: string;
  amount: string;
  share: number;
  fill: BlockInk['text'];
  ink: BlockInk;
}) {
  const paper = mode === 'paper';
  const size = paper ? styles.billPaper : undefined;
  return (
    <View style={styles.billRow}>
      <Text variant="body-sm" style={[styles.billName, { color: ink.secondary }, size]}>
        {name}
      </Text>
      <View
        style={[
          styles.track,
          { backgroundColor: ink.track },
          paper ? styles.trackPaper : undefined,
        ]}
      >
        <Growing
          axis="x"
          style={[styles.trackFill, { width: `${share}%`, backgroundColor: fill }]}
        />
      </View>
      <Text variant="mono" style={[MONO, styles.billAmount, { color: ink.text }, size]}>
        {amount}
      </Text>
    </View>
  );
}

/**
 * What the system saves (`M06-11`): the month as the one large figure, today's bill beside the bill
 * with solar, the savings adding up until they pass the net cost, and three figures under them.
 * Every figure here is a projection, so its assumptions are printed with it (`F8-23`, `F8-07`). A
 * bill nobody gave draws no bars, and a saving that never pays the cost back draws no payback.
 */
export function ProposalSavingsBlock({
  mode,
  savings,
  money,
  monthlyBill,
  words,
}: ProposalSavingsBlockProps) {
  const ink = useBlockInk(mode);
  const paper = mode === 'paper';
  const view = savingsView(savings, money, monthlyBill, useFormat());
  const { bills, payback } = view;
  const geometry = paybackGeometry(view.cumulative, view.netCost.amount, payback?.value ?? null);
  return (
    <View>
      <BlockOver mode={mode} overline={words.overline} tier={view.tier} />
      <View style={styles.top}>
        <BlockFigure mode={mode} figure={view.monthly} />
        <Text variant="body" style={{ color: ink.secondary }}>
          {words.perMonth}
        </Text>
      </View>
      {bills === null ? null : (
        <View style={styles.bill}>
          <BillRow
            mode={mode}
            name={words.billToday}
            amount={bills.today.text}
            share={100}
            fill={ink.markSubtle}
            ink={ink}
          />
          <BillRow
            mode={mode}
            name={words.billWithSolar}
            amount={bills.withSolar.text}
            share={billShare(bills.withSolar.value, bills.today.value)}
            fill={ink.chart2}
            ink={ink}
          />
        </View>
      )}
      {geometry === null ? null : (
        <View style={paper ? styles.paybackPaper : styles.payback}>
          <PaybackCurve
            geometry={geometry}
            name={payback === null ? words.chartNoPayback : words.chart(payback.text)}
            netCost={words.netCost(view.netCost.text)}
            firstYear={words.firstYear}
            lastYear={words.lastYear(view.horizonYears)}
            ink={ink}
            wordSize={paper ? PAPER_TYPE.sub : undefined}
          />
        </View>
      )}
      <View style={[styles.trio, paper ? styles.trioPaper : undefined]}>
        {payback === null ? null : (
          <TrioCell
            mode={mode}
            value={words.paybackValue(payback.text)}
            name={words.paybackLabel}
            ink={ink}
          />
        )}
        <TrioCell
          mode={mode}
          value={view.lifetime.text}
          name={words.lifetimeLabel(view.horizonYears)}
          ink={ink}
        />
        <TrioCell mode={mode} value={view.yearly.text} name={words.yearlyLabel} ink={ink} />
      </View>
      <Text
        variant="body-sm"
        style={[
          styles.honest,
          { borderTopColor: ink.lineSoft, color: paper ? ink.text : ink.secondary },
          paper ? PAPER_TYPE.sub : undefined,
        ]}
      >
        {words.projection}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: theme.spacing['sp-2'],
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
  },
  bill: { marginTop: theme.spacing['sp-4'], gap: theme.spacing['sp-2'] },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  billName: { minWidth: 76 },
  billAmount: { minWidth: 64, textAlign: 'right', fontWeight: '500' },
  billPaper: { fontSize: 16, lineHeight: 22, minWidth: 100 },
  track: { flex: 1, height: 10, borderRadius: 10, overflow: 'hidden' },
  trackPaper: { height: 16 },
  trackFill: { height: '100%', borderRadius: 10 },
  payback: { marginTop: theme.spacing['sp-4'] },
  paybackPaper: { marginTop: 28 },
  trio: { marginTop: theme.spacing['sp-3'], flexDirection: 'row', gap: theme.spacing['sp-2'] },
  trioPaper: { marginTop: 24, gap: 20 },
  cell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: 2,
  },
  cellValue: { fontFamily: display, fontSize: 20, lineHeight: 26 },
  cellValuePaper: { fontSize: 30, lineHeight: 36 },
  cellName: { marginTop: theme.spacing['sp-0-5'] },
  cellNamePaper: { fontSize: 14, lineHeight: 20 },
  honest: {
    marginTop: theme.spacing['sp-4'],
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: 1,
  },
});
