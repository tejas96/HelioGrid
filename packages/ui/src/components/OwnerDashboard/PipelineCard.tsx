import { Text } from '../../primitives/Text';
import { Card } from '../Card';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance';
import { DashBars } from './DashBars';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import { pipelineBarsOf } from './OwnerDashboard.logic';

/**
 * The pipeline by stage (`M13-14`): open leads counted stage by stage — counts only, since a stage
 * has no value until proposals price it — closed by this month's won deals on a bar of their own,
 * then the middle won deal when there are won deals to read.
 */
export function PipelineCard({ view, words }: DashboardPartProps) {
  const format = useFormat();
  const { bars, open, won } = pipelineBarsOf(view, words);
  const median = view.won.median;
  return (
    <Card className="hg-owner-card">
      <section className="hg-owner-card-body" aria-label={words.pipelineTitle}>
        <div className="hg-owner-card-head">
          <Text as="h2" variant="h3">
            {words.pipelineTitle}
          </Text>
          <span className="hg-owner-card-aside">
            <Text as="span" variant="body-sm" color="secondary">
              {words.openLeads(open)}
            </Text>
          </span>
        </div>
        <DashBars bars={bars} foot={won} />
        <div className="hg-owner-card-foot">
          {median === null ? null : (
            <span className="hg-owner-median">
              <Text as="span" variant="body-sm" color="secondary">
                {words.medianWon(format.money(median.amount), median.of)}
              </Text>
              <ProvenanceTier tier="derived" />
            </span>
          )}
          <Text variant="caption" color="secondary">
            {words.valuesGap}
          </Text>
        </div>
      </section>
    </Card>
  );
}
