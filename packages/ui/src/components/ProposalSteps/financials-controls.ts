import { AMOUNT_WHOLE_DIGITS_MAX, PROPOSAL_LIMITS } from '@heliogrid/domain';
import type { FinancialsStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { type StepControl, savedNumber } from './step-controls';

function assumptionControls(view: FinancialsStepView, shared: ProposalStepWords): StepControl[] {
  const { words, saves } = view;
  return [
    {
      kind: 'pair',
      key: 'assumptions',
      items: [
        savedNumber(
          'rise',
          {
            steppers: false,
            words: shared.number,
            label: words.tariffRise,
            hint: words.tariffRiseUnit,
            value: view.tariffRisePercent,
            min: 0,
            max: 100,
            precision: 1,
            outOfRange: 'refuse',
            onCommit: view.onTariffRise,
          },
          saves?.tariffRise,
        ),
        savedNumber(
          'horizon',
          {
            steppers: false,
            words: shared.number,
            label: words.horizon,
            value: view.horizonYears,
            min: 1,
            precision: 0,
            outOfRange: 'refuse',
            onCommit: view.onHorizon,
          },
          saves?.horizon,
        ),
      ],
    },
  ];
}

/**
 * Step 5 (`M06-11`, `T-M06-007`): the bill and the tariff the savings are worked out from — by the
 * server, never here — and the two assumptions a projection rides on, folded. A horizon or a rise
 * that is not a positive number is refused where it is typed (`F8-23`).
 */
export function financialsControls(
  view: FinancialsStepView,
  shared: ProposalStepWords,
): StepControl[] {
  const { words, saves } = view;
  const tariff = PROPOSAL_LIMITS.tariffPerKwh;
  return [
    {
      kind: 'pair',
      key: 'bill',
      items: [
        savedNumber(
          'bill',
          {
            steppers: false,
            words: shared.number,
            currency: true,
            wholeDigits: AMOUNT_WHOLE_DIGITS_MAX,
            label: words.monthlyBill,
            hint: words.monthlyBillHelper,
            value: view.monthlyBill ?? undefined,
            min: 0,
            precision: 0,
            /* The bill is the lead's own fact: with no commit it is shown, never typed (`M02-05`). */
            ...(view.onMonthlyBill === undefined
              ? { disabled: true }
              : { onCommit: view.onMonthlyBill, onClear: () => view.onMonthlyBill?.(null) }),
          },
          saves?.monthlyBill,
        ),
        savedNumber(
          'tariff',
          {
            steppers: false,
            words: shared.number,
            currency: true,
            wholeDigits: AMOUNT_WHOLE_DIGITS_MAX,
            label: words.tariff,
            hint: words.tariffUnit,
            value: view.tariffPerKwh ?? undefined,
            min: tariff.min,
            max: tariff.max,
            precision: 2,
            outOfRange: 'refuse',
            onCommit: view.onTariff,
            onClear: () => view.onTariff(null),
          },
          saves?.tariff,
        ),
      ],
    },
    {
      kind: 'folds',
      key: 'folds',
      rows: [
        {
          key: 'assumptions',
          glyph: 'sliders',
          hue: 'ocean',
          title: words.assumptions,
          value: words.assumptionsValue,
          controls: assumptionControls(view, shared),
        },
      ],
    },
  ];
}
