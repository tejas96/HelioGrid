import type { PricingPlan } from '@heliogrid/data/react';
import type { BillingCycle } from '@heliogrid/domain';
import {
  PLAN_POSITIONING,
  PLAN_SUPPORT,
  PRICING,
  planFigure,
  planLimitsLine,
  planName,
  planWords,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  Card,
  Chip,
  FactRow,
  FactRows,
  PlanCard as PlanCardBody,
  useFormat,
} from '@heliogrid/ui';
import { OpenRow } from './OpenRow';

interface PlanCardProps {
  plan: PricingPlan;
  cycle: BillingCycle;
  /** `All limits` stands open on this card — 2 rows grow to 8 in one group (`SCR-M12-01` 10). */
  open: boolean;
  onToggle: () => void;
  /** Enterprise's act; `null` when the book names no sales address. */
  onTalkToSales: (() => void) | null;
}

/** The plan as content, never a choice: nothing on this page is picked (`SCR-M12-01` 2, 15). */
export function PlanCard({ plan, cycle, open, onToggle, onTalkToSales }: PlanCardProps) {
  const t = useTranslate();
  const words = planWords(t, useFormat());
  const figure = planFigure(plan, cycle, t, words);
  const name = planName(plan.tier);
  const support = t(PLAN_SUPPORT[plan.tier]);
  const voiceRate = words.voiceRate(plan);
  const anchored = plan.price.kind === 'anchored';
  return (
    <Card density="expressive">
      <div className="hg-pricing-card">
        <div className="hg-pricing-card__head">
          <span className="hg-pricing-card__name">{name}</span>
          <PlanCardBody
            form="head"
            name={name}
            figure={figure}
            gap={null}
            note={t(PLAN_POSITIONING[plan.tier])}
            lines={[]}
          />
        </div>
        {open ? (
          <FactRows label={name} density="expressive" form="pair" measure={40}>
            <FactRow label={t(PRICING.biggestDesign)} value={words.power(plan.designPower)} />
            <FactRow
              label={t(PRICING.proposalsMonth)}
              value={words.limit(plan.proposalsPerMonth)}
            />
            <FactRow label={t(PRICING.activeProjects)} value={words.limit(plan.activeProjects)} />
            <FactRow label={t(PRICING.users)} value={t(PRICING.unlimited)} />
            <FactRow
              label={t(PRICING.voiceMinutesMonth)}
              value={words.voiceIncluded(plan.voiceMinutesIncluded)}
            />
            {voiceRate === null ? (
              <FactRow
                label={t(PRICING.extraVoice)}
                gap={{ gap: t(PRICING.notPublished), scale: 'field' }}
              />
            ) : (
              <FactRow
                label={t(PRICING.extraVoice)}
                value={<span className="hg-pricing-figure">{voiceRate}</span>}
              />
            )}
            <FactRow label={t(PRICING.storage)} value={words.storage(plan.storageGb)} />
            <FactRow label={t(PRICING.support)} value={support} />
          </FactRows>
        ) : (
          <FactRows label={name} density="expressive" form="lead">
            <FactRow
              label={t(PRICING.limits)}
              values={[...planLimitsLine(plan, plan.designPower, t, words).values]}
            />
            <FactRow label={t(PRICING.support)} values={[support]} />
          </FactRows>
        )}
        <div className="hg-pricing-card__all-limits">
          <OpenRow title={t(PRICING.allLimits)} open={open} onToggle={onToggle} />
        </div>
        {anchored ? (
          <div className="hg-pricing-card__foot">
            <Chip density="expressive">{t(PRICING.annual)}</Chip>
            {onTalkToSales === null ? null : (
              <Button variant="secondary" size="md" fullWidth onClick={onTalkToSales}>
                {t(PRICING.talkToSales)}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
