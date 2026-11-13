import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Card } from '../Card/Card.native';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { RollingNumber } from '../RollingNumber/RollingNumber.native';
import type { DashboardPartProps } from './OwnerDashboard.logic';

/**
 * Cash so far this month on the phone (`M13-16`): what came in, measured, as the card's one big
 * figure, last month's beside it, then what is still to collect and what of it is late.
 */
export function CashCard({ view, words }: DashboardPartProps) {
  const format = useFormat();
  const { cash } = view;
  const late = cash.late.count > 0;
  return (
    <Card>
      <View
        style={styles.body}
        accessibilityLabel={words.cashTitle}
        role="region"
        collapsable={false}
      >
        <View style={styles.head}>
          <Text variant="h3">{words.cashTitle}</Text>
          <ProvenanceTier tier="measured" />
        </View>
        <View style={styles.figure}>
          <Text variant="caption" color="secondary">
            {words.soFarThisMonth}
          </Text>
          <RollingNumber value={format.money(cash.collectedThisMonth)} variant="hero" />
          <Text variant="body-sm" color="secondary">
            {words.vsLastMonth(format.money(cash.collectedLastMonth))}
          </Text>
        </View>
        <View style={styles.split}>
          <View style={styles.cell}>
            <Text variant="caption" color="secondary">
              {words.toCollect}
            </Text>
            <Text variant="mono" oneLine>
              {format.money(cash.toCollect)}
            </Text>
          </View>
          <View style={styles.cell}>
            <View style={styles.lateWord}>
              <ShellGlyph name="clock" size="sm" tone={late ? 'danger' : 'secondary'} />
              <Text variant="caption" color={late ? 'danger' : 'secondary'}>
                {words.late(cash.late.count)}
              </Text>
            </View>
            <Text variant="mono" oneLine>
              {format.money(cash.late.amount)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  figure: { gap: theme.spacing['sp-1'] },
  split: {
    flexDirection: 'row',
    gap: theme.spacing['sp-3'],
    paddingTop: theme.spacing['sp-4'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  cell: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  lateWord: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
});
