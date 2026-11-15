import { AMOUNT_WHOLE_DIGITS_MAX, BATTERY_CHEMISTRIES, PROPOSAL_LIMITS } from '@heliogrid/domain';
import type { SystemStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { memberOf, present, type StepControl, savedNumber } from './step-controls';

/**
 * The battery a hybrid or off-grid system carries (`M06-30`): its capacity, its cost, its
 * chemistry — named in words when it is none of the listed ones — and the act that removes it.
 */
export function batteryControls(view: SystemStepView, shared: ProposalStepWords): StepControl[] {
  const { words, battery } = view;
  if (battery === null) return [];
  const limits = PROPOSAL_LIMITS.batteryKwh;
  return present([
    {
      kind: 'pair',
      key: 'figures',
      items: [
        savedNumber(
          'capacity',
          {
            steppers: false,
            words: shared.number,
            label: words.batteryCapacity,
            value: battery.capacityKwh,
            min: limits.min,
            max: limits.max,
            precision: 1,
            outOfRange: 'refuse',
            onCommit: (capacityKwh) => view.onBattery({ ...battery, capacityKwh }),
          },
          view.saves?.batteryCapacity,
        ),
        savedNumber(
          'cost',
          {
            steppers: false,
            words: shared.number,
            currency: true,
            wholeDigits: AMOUNT_WHOLE_DIGITS_MAX,
            label: words.batteryCost,
            value: battery.cost ?? undefined,
            min: 0,
            precision: 0,
            onCommit: (cost) => view.onBattery({ ...battery, cost }),
            onClear: () => view.onBattery({ ...battery, cost: null }),
          },
          view.saves?.batteryCost,
        ),
      ],
    },
    {
      kind: 'segmented',
      key: 'chemistry',
      props: {
        label: words.batteryChemistry,
        value: battery.chemistry,
        onChange: (value) => {
          const chemistry = memberOf(BATTERY_CHEMISTRIES, value);
          if (chemistry !== undefined) view.onBattery({ ...battery, chemistry });
        },
        options: BATTERY_CHEMISTRIES.map((chemistry) => ({
          value: chemistry,
          label: words.chemistries[chemistry],
        })),
      },
    },
    battery.chemistry === 'custom'
      ? {
          kind: 'input',
          key: 'custom',
          props: {
            label: words.chemistryCustom,
            value: battery.chemistryCustom ?? '',
            commitOnBlur: true,
            onCommit: (text) =>
              view.onBattery({ ...battery, chemistryCustom: text.trim() || null }),
          },
        }
      : null,
    {
      kind: 'acts',
      key: 'acts',
      acts: [
        {
          glyph: 'trash',
          label: words.removeBattery,
          onPress: () => view.onBattery(null),
          quiet: true,
        },
      ],
    },
  ]);
}
