import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Card } from '../Card';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance';
import { RollingNumber } from '../RollingNumber';
import { cashFiguresOf, type DashboardPartProps } from './OwnerDashboard.logic';

/**
 * Cash so far this month (`M13-16`): what came in, measured, as the card's one big figure, last
 * month's beside it, then what is still to collect and what of it is late — never projected.
 */
export function CashCard({ view, words }: DashboardPartProps) {
  const format = useFormat();
  const { cash } = view;
  const figures = cashFiguresOf(cash, format);
  return (
    <Card className="hg-owner-card" tile="glass">
      <section className="hg-owner-card-body" aria-label={words.cashTitle}>
        <div className="hg-owner-card-head">
          <Text as="h2" variant="h3">
            {words.cashTitle}
          </Text>
          <ProvenanceTier tier="measured" />
        </div>
        <div className="hg-owner-figure-block">
          <Text variant="caption" color="secondary">
            {words.soFarThisMonth}
          </Text>
          <span className="hg-owner-hero-figure">
            <RollingNumber value={figures.collected} variant="hero" />
          </span>
          <Text variant="body-sm" color="secondary">
            {words.vsLastMonth(figures.lastMonth)}
          </Text>
        </div>
        <div className="hg-owner-cash-split">
          <div className="hg-owner-cash-cell">
            <Text variant="caption" color="secondary">
              {words.toCollect}
            </Text>
            <span className="hg-owner-amount">{figures.toCollect}</span>
          </div>
          <div className="hg-owner-cash-cell">
            <span className="hg-owner-late-word">
              <ShellGlyph
                name="clock"
                size="sm"
                tone={cash.late.count > 0 ? 'danger' : 'secondary'}
              />
              <Text
                as="span"
                variant="caption"
                color={cash.late.count > 0 ? 'danger' : 'secondary'}
              >
                {words.late(cash.late.count)}
              </Text>
            </span>
            <span className="hg-owner-amount">{figures.late}</span>
          </div>
        </div>
      </section>
    </Card>
  );
}
