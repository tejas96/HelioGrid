import type { PricingComparison } from '@heliogrid/data/react';
import { PRICING, planName } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { FactRow, FactRows, Provenance, useFormat } from '@heliogrid/ui';
import { planWords } from '../plan-words';

interface ComparedWithProps {
  comparisons: readonly PricingComparison[];
  listSource: string;
  benchmarkSources: readonly string[];
}

/**
 * `Compared with` — one group of rows, our plan beside the benchmark at the same capacity, both
 * yearly; no adjective, no percentage (`SCR-M12-01` 12). Each benchmark names its own source.
 */
export function ComparedWith({ comparisons, listSource, benchmarkSources }: ComparedWithProps) {
  const t = useTranslate();
  const words = planWords(t, useFormat());
  const yearly = (value: string) => (
    <span className="hg-pricing-figure">{t(PRICING.perYear, { value: words.money(value) })}</span>
  );
  return (
    <section className="hg-pricing-compared" aria-label={t(PRICING.comparedWith)}>
      <span className="hg-pricing-overline">{t(PRICING.comparedWith)}</span>
      <FactRows label={t(PRICING.comparedWith)} density="expressive" form="pair" measure={40}>
        {comparisons.flatMap((row) => {
          const capacity = words.power(row.power);
          return [
            <FactRow
              key={`${row.tier}-${row.rung}-ours`}
              label={t(PRICING.atCapacity, { name: planName(row.tier), capacity })}
              value={yearly(row.ours)}
            />,
            <FactRow
              key={`${row.tier}-${row.rung}-theirs`}
              label={t(PRICING.atCapacity, {
                name: t(PRICING.competitorRung, { competitor: row.competitor, rung: row.rung }),
                capacity,
              })}
              value={yearly(row.theirs)}
            />,
          ];
        })}
      </FactRows>
      <div className="hg-pricing-sources">
        <Provenance tier="unmarked" source={listSource} />
        {benchmarkSources.map((source) => (
          <Provenance key={source} tier="unmarked" source={source} />
        ))}
      </div>
    </section>
  );
}
