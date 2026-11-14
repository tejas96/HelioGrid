import {
  AMOUNT_WHOLE_DIGITS_MAX,
  DISCOUNT_MODES,
  MAINTENANCE_KINDS,
  PROPOSAL_LIMITS,
  SUPPLY_PHASES,
} from '@heliogrid/domain';
import type { SystemStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import {
  type FoldControl,
  memberOf,
  present,
  type StepControl,
  savedNumber,
} from './step-controls';
import { batteryControls } from './system-battery-controls';
import { emiControls } from './system-emi-controls';

const PERCENT = '%';

function discountControls(view: SystemStepView, shared: ProposalStepWords): StepControl[] {
  const { words, discount } = view;
  const percent = discount.mode === 'percent';
  return [
    {
      kind: 'segmented',
      key: 'mode',
      props: {
        ariaLabel: words.discountMode,
        value: discount.mode,
        onChange: (value) => {
          const mode = memberOf(DISCOUNT_MODES, value);
          /* The mode entered is the mode recorded: switching it starts the figure again (`M06-34`). */
          if (mode !== undefined && mode !== discount.mode) view.onDiscount({ mode, value: null });
        },
        options: DISCOUNT_MODES.map((mode) => ({ value: mode, label: words.discountModes[mode] })),
      },
    },
    savedNumber(
      'value',
      {
        steppers: false,
        words: shared.number,
        label: words.discountField,
        hint: words.discountHelper,
        value: discount.value ?? undefined,
        min: 0,
        ...(percent
          ? { max: 100, unit: PERCENT, precision: 2 }
          : { currency: true, precision: 0, wholeDigits: AMOUNT_WHOLE_DIGITS_MAX }),
        onCommit: (value) => view.onDiscount({ mode: discount.mode, value }),
        onClear: () => view.onDiscount({ mode: discount.mode, value: null }),
      },
      view.saves?.discount,
    ),
  ];
}

function supplyControls(view: SystemStepView, shared: ProposalStepWords): StepControl[] {
  const { words } = view;
  return [
    {
      kind: 'pair',
      key: 'supply',
      items: [
        savedNumber(
          'load',
          {
            steppers: false,
            words: shared.number,
            label: words.sanctionedLoad,
            unit: words.sizeUnit,
            value: view.sanctionedLoadKw ?? undefined,
            min: 0,
            precision: 2,
            onCommit: view.onSanctionedLoad,
            onClear: () => view.onSanctionedLoad(null),
          },
          view.saves?.sanctionedLoad,
        ),
        {
          kind: 'segmented',
          key: 'phase',
          props: {
            label: words.supplyPhase,
            value: view.supplyPhase ?? '',
            onChange: (value) => {
              const phase = memberOf(SUPPLY_PHASES, value);
              if (phase !== undefined) view.onSupplyPhase(phase);
            },
            options: SUPPLY_PHASES.map((phase) => ({
              value: phase,
              label: words.supplyPhases[phase],
            })),
          },
        },
      ],
    },
    { kind: 'helper', key: 'helper', text: words.supplyHelper },
  ];
}

function maintenanceControls(view: SystemStepView, shared: ProposalStepWords): StepControl[] {
  const { words, maintenance } = view;
  const limits = PROPOSAL_LIMITS.maintenanceYears;
  return present([
    {
      kind: 'segmented',
      key: 'kind',
      props: {
        ariaLabel: words.maintenance,
        value: maintenance.kind,
        onChange: (value) => {
          const kind = memberOf(MAINTENANCE_KINDS, value);
          if (kind === undefined) return;
          view.onMaintenance({
            kind,
            years: kind === 'years' ? (maintenance.years ?? limits.min) : null,
          });
        },
        options: MAINTENANCE_KINDS.map((kind) => ({
          value: kind,
          label: words.maintenanceKinds[kind],
        })),
      },
    },
    maintenance.kind === 'years'
      ? {
          kind: 'number',
          key: 'years',
          field: {
            words: shared.number,
            steppers: true,
            label: words.maintenanceYears,
            value: maintenance.years ?? limits.min,
            min: limits.min,
            max: limits.max,
            precision: 0,
            onCommit: (years) => view.onMaintenance({ kind: 'years', years }),
          },
        }
      : null,
  ]);
}

function costControls(view: SystemStepView, shared: ProposalStepWords): StepControl[] {
  const { words, ourCost } = view;
  if (ourCost === undefined) return [];
  return [
    savedNumber(
      'cost',
      {
        steppers: false,
        words: shared.number,
        currency: true,
        wholeDigits: AMOUNT_WHOLE_DIGITS_MAX,
        label: words.ourCostField,
        hint: words.ourCostHelper,
        value: ourCost.value ?? undefined,
        min: 0,
        precision: 0,
        onCommit: ourCost.onCost,
        onClear: () => ourCost.onCost(null),
      },
      view.saves?.ourCost,
    ),
  ];
}

/**
 * Step 3's rows that open in place (`T-M06-005`): discount, the incentive switch, site supply,
 * yearly maintenance, the EMI example, the battery where the system carries one, and — only for a
 * viewer handed it — our cost. One row is open at a time.
 */
export function systemFolds(view: SystemStepView, shared: ProposalStepWords): FoldControl[] {
  const { words, incentive, ourCost } = view;
  const rows: (FoldControl | null)[] = [
    {
      key: 'discount',
      glyph: 'scales',
      hue: 'plum',
      title: words.discount,
      value: words.discountValue,
      controls: discountControls(view, shared),
    },
    incentive === undefined
      ? null
      : {
          key: 'incentive',
          glyph: 'download',
          hue: 'success',
          title: words.incentive,
          value: words.incentiveValue,
          aside: {
            checked: incentive.claimed,
            onChange: incentive.onClaimed,
            ariaLabel: words.incentiveSwitch,
          },
          controls: [],
        },
    {
      key: 'supply',
      glyph: 'bolt',
      hue: 'teal',
      title: words.supply,
      value: words.supplyValue,
      controls: supplyControls(view, shared),
    },
    {
      key: 'maintenance',
      glyph: 'wrench',
      hue: 'ocean',
      title: words.maintenance,
      value: words.maintenanceValue,
      controls: maintenanceControls(view, shared),
    },
    {
      key: 'emi',
      glyph: 'calendar-clock',
      hue: 'ocean',
      title: words.emi,
      value: words.emiValue,
      controls: emiControls(view, shared),
    },
    view.battery === null
      ? null
      : {
          key: 'battery',
          glyph: 'battery',
          hue: 'teal',
          title: words.battery,
          value: words.batteryValue,
          controls: batteryControls(view, shared),
        },
    ourCost === undefined
      ? null
      : {
          key: 'cost',
          glyph: 'eye-off',
          hue: 'neutral',
          title: words.ourCost,
          value: words.ourCostValue,
          controls: costControls(view, shared),
        },
  ];
  return rows.filter((row) => row !== null);
}
