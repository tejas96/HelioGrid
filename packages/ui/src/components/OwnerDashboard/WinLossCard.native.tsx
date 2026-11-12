import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Card } from '../Card/Card.native';
import { useFormat } from '../MarketProvider';
import { ProgressRing } from '../ProgressRing/ProgressRing.native';
import { DashBars } from './DashBars.native';
import { type DashboardPartProps, lostBarsOf, percentOf } from './OwnerDashboard.logic';

/**
 * Win and loss on closed deals on the phone (`M13-23`, `M13-27`): the rate once enough deals have
 * closed for it to mean something, else the honest counts; then why deals were lost, commonest first.
 */
export function WinLossCard({ view, words, winRate }: DashboardPartProps) {
  const { winLoss } = view;
  const lost = lostBarsOf(winLoss.lostReasons, words.lostReason);
  return (
    <Card>
      <View
        style={styles.body}
        accessibilityLabel={words.winLossTitle}
        role="region"
        collapsable={false}
      >
        <View style={styles.head}>
          <Text variant="h3">{words.winLossTitle}</Text>
          <Text variant="body-sm" color="secondary">
            {words.windowDays(winLoss.windowDays)}
          </Text>
        </View>
        {winRate?.kind === 'rate' ? (
          <RateRing
            basisPoints={winRate.basisPoints}
            won={winRate.won}
            lost={winRate.lost}
            words={words}
          />
        ) : (
          <Text variant="body-sm" color="secondary">
            {winRate === null
              ? words.wonLost(winLoss.won, winLoss.lost)
              : words.tooFew(winRate.won, winRate.lost)}
          </Text>
        )}
        {lost.length === 0 ? (
          <Text variant="body-sm" color="secondary">
            {words.noLosses}
          </Text>
        ) : (
          <DashBars bars={lost} />
        )}
      </View>
    </Card>
  );
}

function RateRing(props: {
  basisPoints: number;
  won: number;
  lost: number;
  words: DashboardPartProps['words'];
}) {
  const format = useFormat();
  const { words } = props;
  const share = props.basisPoints / 10_000;
  const rate = percentOf(share, words, format);
  return (
    <View style={styles.rate}>
      <ProgressRing
        share={share}
        value={rate}
        caption={words.wonLost(props.won, props.lost)}
        spokenName={words.winRate(rate)}
      />
      <View style={styles.rateWords}>
        <Text variant="body" bold>
          {words.winRate(rate)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  rate: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-4'] },
  rateWords: { flex: 1, minWidth: 0 },
});
