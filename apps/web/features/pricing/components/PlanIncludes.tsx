import { PLAN_INCLUDES, PRICING, STUDIO_INCLUDES } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { FactRow, FactRows } from '@heliogrid/ui';
import { OpenRow } from './OpenRow';

interface PlanIncludesProps {
  open: boolean;
  onToggle: () => void;
}

/** `BM-05`'s list, one for every plan, opened in place — never a grid of ticks. */
export function PlanIncludes({ open, onToggle }: PlanIncludesProps) {
  const t = useTranslate();
  return (
    <div className="hg-pricing-includes">
      <OpenRow icon="grid" title={t(PRICING.includes)} open={open} onToggle={onToggle} />
      {open ? (
        <FactRows density="expressive" form="lead">
          <FactRow label={t(PRICING.everyPlan)} values={PLAN_INCLUDES.map((item) => t(item))} />
          <FactRow label={t(PRICING.studio)} values={STUDIO_INCLUDES.map((item) => t(item))} />
        </FactRows>
      ) : null}
    </div>
  );
}
