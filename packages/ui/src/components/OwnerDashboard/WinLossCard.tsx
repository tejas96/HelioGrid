import { Text } from '../../primitives/Text';
import { Card } from '../Card';
import { useFormat } from '../MarketProvider';
import { ProgressRing } from '../ProgressRing';
import { DashBars } from './DashBars';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import { lostBarsOf, percentOf } from './OwnerDashboard.logic';

/**
 * Win and loss on closed deals over the window (`M13-23`, `M13-27`): the rate once enough deals
 * have closed for it to mean something, else the honest counts; then why deals were lost, the
 * commonest reason first.
 */
export function WinLossCard({ view, words, winRate }: DashboardPartProps) {
  const { winLoss } = view;
  const lost = lostBarsOf(winLoss.lostReasons, words.lostReason);
  return (
    <Card className="hg-owner-card">
      <section className="hg-owner-card-body" aria-label={words.winLossTitle}>
        <div className="hg-owner-card-head">
          <Text as="h2" variant="h3">
            {words.winLossTitle}
          </Text>
          <span className="hg-owner-card-aside">
            <Text as="span" variant="body-sm" color="secondary">
              {words.windowDays(winLoss.windowDays)}
            </Text>
          </span>
        </div>
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
      </section>
    </Card>
  );
}

/** The rate as a ring — the share and the counts it reads — with its name and meaning beside it. */
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
    <div className="hg-owner-rate">
      <ProgressRing
        share={share}
        value={rate}
        caption={words.wonLost(props.won, props.lost)}
        spokenName={words.winRate(rate)}
      />
      <span className="hg-owner-rate-words">
        <Text variant="body" bold>
          {words.winRateName}
        </Text>
        <Text variant="body-sm" color="secondary">
          {words.winRateMeaning}
        </Text>
      </span>
    </div>
  );
}
