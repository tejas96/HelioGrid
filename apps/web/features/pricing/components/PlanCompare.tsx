import type { PricingPlan, PricingSet } from '@heliogrid/data/react';
import type { Tier } from '@heliogrid/domain';
import { PRICING, planName } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { FilterChips } from '@heliogrid/ui';
import { OpenRow } from './OpenRow';
import { PlanGrid } from './PlanGrid';
import { ChipField, SetChips } from './SetChips';

interface PlanCompareProps {
  plans: readonly PricingPlan[];
  open: boolean;
  onToggle: () => void;
  pair: { plan: Tier; against: Tier };
  planOptions: readonly Tier[];
  againstOptions: readonly Tier[];
  onPlan: (tier: Tier) => void;
  onAgainst: (tier: Tier) => void;
  set: PricingSet;
  onSet: (set: PricingSet) => void;
  source: string;
}

/** 375's comparison: two plans, each chosen by a chip strip, never a four-plan matrix (`SCR-M12-01` 11). */
export function PlanCompare(props: PlanCompareProps) {
  const t = useTranslate();
  const { pair, plans } = props;
  const chips = (tiers: readonly Tier[]) =>
    tiers.map((tier) => ({ value: tier, label: planName(tier) }));
  const tierOf = (value: string, tiers: readonly Tier[]) => tiers.find((tier) => tier === value);
  const shown = [pair.plan, pair.against].flatMap((tier) =>
    plans.filter((plan) => plan.tier === tier),
  );
  return (
    <div className="hg-pricing-compare">
      <OpenRow
        icon="scales"
        title={t(PRICING.compare)}
        open={props.open}
        onToggle={props.onToggle}
      />
      {props.open ? (
        <div className="hg-pricing-compare__body">
          <ChipField label={t(PRICING.plan)}>
            <FilterChips
              label={t(PRICING.plan)}
              value={pair.plan}
              onChange={(value) => {
                const tier = tierOf(value, props.planOptions);
                if (tier !== undefined) props.onPlan(tier);
              }}
              options={chips(props.planOptions)}
            />
          </ChipField>
          <ChipField label={t(PRICING.against)}>
            <FilterChips
              label={t(PRICING.against)}
              value={pair.against}
              onChange={(value) => {
                const tier = tierOf(value, props.againstOptions);
                if (tier !== undefined) props.onAgainst(tier);
              }}
              options={chips(props.againstOptions)}
            />
          </ChipField>
          <SetChips value={props.set} onChange={props.onSet} />
          <PlanGrid
            plans={shown}
            set={props.set}
            caption={t(PRICING.pairCaption, {
              plan: planName(pair.plan),
              against: planName(pair.against),
            })}
            source={props.source}
            columnWidth={110}
            labelWidth={112}
          />
        </div>
      ) : null}
    </div>
  );
}
