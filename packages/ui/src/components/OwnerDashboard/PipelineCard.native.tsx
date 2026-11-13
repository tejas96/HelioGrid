import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Card } from '../Card/Card.native';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { DashBars } from './DashBars.native';
import { type DashboardPartProps, pipelineBarsOf } from './OwnerDashboard.logic';

/**
 * The pipeline by stage on the phone (`M13-14`): open leads counted stage by stage — counts only,
 * until proposals price them — closed by this month's won deals on a bar of their own, then the
 * middle won deal when there are won deals to read.
 */
export function PipelineCard({ view, words }: DashboardPartProps) {
  const format = useFormat();
  const { bars, open, won } = pipelineBarsOf(view, words);
  const median = view.won.median;
  return (
    <Card>
      <View
        style={styles.body}
        accessibilityLabel={words.pipelineTitle}
        role="region"
        collapsable={false}
      >
        <View style={styles.head}>
          <Text variant="h3">{words.pipelineTitle}</Text>
          <Text variant="body-sm" color="secondary">
            {words.openLeads(open)}
          </Text>
        </View>
        <DashBars bars={bars} foot={won} />
        <View style={styles.foot}>
          {median === null ? null : (
            <View style={styles.median}>
              <Text variant="body-sm" color="secondary">
                {words.medianWon(format.money(median.amount), median.of)}
              </Text>
              <ProvenanceTier tier="derived" />
            </View>
          )}
          <Text variant="caption" color="secondary">
            {words.valuesGap}
          </Text>
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  foot: { gap: theme.spacing['sp-1'] },
  median: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
