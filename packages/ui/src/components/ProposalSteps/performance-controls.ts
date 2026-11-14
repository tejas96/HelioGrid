import { PROPOSAL_LIMITS } from '@heliogrid/domain';
import type { PerformanceStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { present, type StepControl, savedNumber } from './step-controls';

const PERCENT = '%';

function monthControls(view: PerformanceStepView, shared: ProposalStepWords): StepControl[] {
  const { words, monthlyKwh } = view;
  const months = (monthlyKwh ?? []).map((kwh, month): StepControl | null => {
    const name = words.monthNames[month];
    return name === undefined
      ? null
      : {
          kind: 'number',
          key: name,
          field: {
            steppers: false,
            words: shared.number,
            density: 'functional',
            label: name,
            ariaLabel: words.monthField(name),
            value: kwh,
            min: 0,
            precision: 0,
            onCommit: (value) => view.onMonth(month, value),
          },
        };
  });
  return [
    { kind: 'grid', key: 'months', items: present(months) },
    { kind: 'save', key: 'save', save: view.saves?.months },
  ];
}

/**
 * Step 4's fields under its card (`M06-10`, `T-M06-006`): the person changes the efficiency, or a
 * month they know better. The twelve months are there once the step holds figures.
 */
export function performanceControls(
  view: PerformanceStepView,
  shared: ProposalStepWords,
): StepControl[] {
  const { words } = view;
  const limits = PROPOSAL_LIMITS.efficiencyPercent;
  return present([
    savedNumber(
      'efficiency',
      {
        steppers: false,
        words: shared.number,
        label: words.efficiency,
        value: view.efficiencyPercent,
        min: limits.min,
        max: limits.max,
        precision: 0,
        unit: PERCENT,
        hint: words.efficiencyHelper,
        onCommit: view.onEfficiency,
      },
      view.saves?.efficiency,
    ),
    view.monthlyKwh === null
      ? null
      : {
          kind: 'folds',
          key: 'folds',
          rows: [
            {
              key: 'months',
              glyph: 'bar-chart',
              hue: 'ocean',
              title: words.months,
              value: words.monthsValue,
              controls: monthControls(view, shared),
            },
          ],
        },
  ]);
}
