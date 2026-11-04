import type { TranslatedText } from '@heliogrid/contracts';
import type { PricingPlan, PricingSet } from '@heliogrid/data/react';
import { COMPARE_GRID, compareGridWords, planWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { CompareGrid, useFormat } from '@heliogrid/ui';
import { compareAttributes, compareOption } from '../compare-values';

interface PlanGridProps {
  plans: readonly PricingPlan[];
  set: PricingSet;
  caption: TranslatedText;
  source: string;
  columnWidth: number;
  labelWidth: number;
}

/** The comparison table both widths draw: two plans at 375, all four at 1536. */
export function PlanGrid({ plans, set, caption, source, columnWidth, labelWidth }: PlanGridProps) {
  const t = useTranslate();
  const words = planWords(t, useFormat());
  return (
    <CompareGrid
      caption={caption}
      density="functional"
      columnWidth={columnWidth}
      labelWidth={labelWidth}
      attributes={compareAttributes(set, t)}
      options={plans.map((plan) => compareOption(plan, set, t, words))}
      provenance={{ tier: 'unmarked', source }}
      read={{ kind: 'ready' }}
      words={compareGridWords(t)}
      selectLabel={t(COMPARE_GRID.select)}
      selectedLabel={t(COMPARE_GRID.selected)}
      currentLabel={t(COMPARE_GRID.current)}
      emptyTitle={t(COMPARE_GRID.emptyTitle)}
      errorTitle={t(COMPARE_GRID.errorTitle)}
      unavailableTitle={t(COMPARE_GRID.unavailableTitle)}
    />
  );
}
