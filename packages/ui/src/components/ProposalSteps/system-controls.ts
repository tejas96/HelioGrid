import {
  AMOUNT_WHOLE_DIGITS_MAX,
  DEAL_SEGMENTS,
  PROPOSAL_LIMITS,
  SYSTEM_TYPES,
} from '@heliogrid/domain';
import type { SystemStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { memberOf, present, type StepControl } from './step-controls';
import { systemFolds } from './system-fold-controls';

/** The sizes offered as chips (`T-M06-005`): the common home sizes, kW. */
const SIZE_CHIPS = [2, 3, 5, 10] as const;

function sizeControl(view: SystemStepView, shared: ProposalStepWords): StepControl {
  const { words } = view;
  const limits = PROPOSAL_LIMITS.capacityKw;
  return {
    kind: 'group',
    key: 'size',
    items: present([
      {
        kind: 'number',
        key: 'field',
        field: {
          words: shared.number,
          hero: true,
          steppers: true,
          label: words.size,
          unit: words.sizeUnit,
          value: view.capacityKw ?? undefined,
          min: limits.min,
          max: limits.max,
          step: PROPOSAL_LIMITS.capacityStepKw,
          precision: 2,
          outOfRange: 'refuse',
          onCommit: view.onCapacity,
        },
      },
      {
        kind: 'chips',
        key: 'chips',
        name: words.commonSizes,
        chips: SIZE_CHIPS.map((kw) => ({
          key: String(kw),
          label: words.sizeChip(kw),
          active: view.capacityKw === kw,
          onPress: () => view.onCapacity(kw),
        })),
      },
      words.panelLine === undefined
        ? null
        : { kind: 'helper', key: 'panels', text: words.panelLine },
      { kind: 'save', key: 'save', save: view.saves?.capacity },
    ]),
  };
}

function priceControl(view: SystemStepView, shared: ProposalStepWords): StepControl {
  const { words } = view;
  return {
    kind: 'group',
    key: 'price',
    top: { label: words.price, tag: words.priceTag },
    items: [
      {
        kind: 'number',
        key: 'field',
        field: {
          steppers: false,
          words: shared.number,
          hero: true,
          currency: true,
          wholeDigits: AMOUNT_WHOLE_DIGITS_MAX,
          labelSpokenOnly: true,
          label: words.price,
          value: view.priceInclusive ?? undefined,
          min: 0,
          precision: 0,
          ...(words.priceHelper === undefined ? {} : { hint: words.priceHelper }),
          onCommit: view.onPrice,
          onClear: () => view.onPrice(null),
        },
      },
      { kind: 'save', key: 'save', save: view.saves?.price },
    ],
  };
}

/**
 * Step 3 (`M06-09`, `M06-30`, `M06-35`, `T-M06-005`): the size, the system type, the price as one
 * large field marked as including tax, then the rows that open in place. The price is typed — the
 * figure per kW the hero shows is a check on it, never its source — and every figure the customer
 * will read is the server's, in the block above.
 */
export function systemControls(view: SystemStepView, shared: ProposalStepWords): StepControl[] {
  const { words, batteryNotice, noTax } = view;
  return present([
    sizeControl(view, shared),
    {
      kind: 'segmented',
      key: 'segment',
      props: {
        label: words.category,
        value: view.segment ?? '',
        onChange: (value) => {
          const segment = memberOf(DEAL_SEGMENTS, value);
          if (segment !== undefined) view.onSegment(segment);
        },
        options: DEAL_SEGMENTS.map((segment) => ({
          value: segment,
          label: words.segments[segment],
        })),
      },
    },
    {
      kind: 'segmented',
      key: 'type',
      props: {
        ariaLabel: words.systemType,
        value: view.systemType,
        onChange: (value) => {
          const type = memberOf(SYSTEM_TYPES, value);
          if (type !== undefined) view.onSystemType(type);
        },
        options: SYSTEM_TYPES.map((type) => ({ value: type, label: words.systemTypes[type] })),
      },
    },
    batteryNotice === undefined
      ? null
      : {
          kind: 'note',
          key: 'battery',
          notice: batteryNotice,
          tone: batteryNotice.tone,
          glyph: 'battery',
        },
    priceControl(view, shared),
    noTax === undefined
      ? null
      : { kind: 'note', key: 'no-tax', notice: noTax, tone: 'info', glyph: 'info-circle' },
    { kind: 'folds', key: 'folds', rows: systemFolds(view, shared) },
  ]);
}
