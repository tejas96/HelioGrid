import { PROPOSAL_LIMITS } from '@heliogrid/domain';
import type { SystemStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { present, type StepControl, savedNumber } from './step-controls';

/** The EMI example (`M06-40`): off, or on with the rate and the term the projection prints. */
export function emiControls(view: SystemStepView, shared: ProposalStepWords): StepControl[] {
  const { words, emi } = view;
  const rate = PROPOSAL_LIMITS.emiRatePercent;
  return present([
    {
      kind: 'switch',
      key: 'on',
      props: {
        checked: emi !== null,
        onChange: (on) => view.onEmi(on ? view.emiTypical : null),
        label: words.emiSwitch,
        description: words.emiSwitchLine,
      },
    },
    emi === null
      ? null
      : {
          kind: 'pair',
          key: 'terms',
          items: [
            savedNumber(
              'rate',
              {
                steppers: false,
                words: shared.number,
                label: words.emiRate,
                hint: words.percentPerYear,
                value: emi.ratePercent,
                min: rate.min,
                max: rate.max,
                precision: 2,
                outOfRange: 'refuse',
                onCommit: (ratePercent) => view.onEmi({ ...emi, ratePercent }),
              },
              view.saves?.emiRate,
            ),
            /* A tenure that is zero, negative or no number is refused where it is typed (`F8-23`). */
            savedNumber(
              'tenure',
              {
                steppers: false,
                words: shared.number,
                label: words.emiTenure,
                hint: words.years,
                value: emi.tenureYears,
                min: 0.5,
                precision: 1,
                outOfRange: 'refuse',
                onCommit: (tenureYears) => view.onEmi({ ...emi, tenureYears }),
              },
              view.saves?.emiTenure,
            ),
          ],
        },
  ]);
}
