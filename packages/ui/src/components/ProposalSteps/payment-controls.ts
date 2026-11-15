import type { PaymentPartView, PaymentStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import type { ChipControl, RowControl, RowItem, StepControl } from './step-controls';

/** What step 7's controls read: its view, wherever it is drawn — a proposal, or Proposal defaults. */
type PaymentControlsView = Omit<PaymentStepView, 'step' | 'split'>;

/** A part moves by five with its two buttons (`T-M06-009`); any whole percent can be typed. */
const SHARE_STEP = 5;
const PERCENT = '%';

function partRow(
  view: PaymentControlsView,
  shared: ProposalStepWords,
  part: PaymentPartView,
  index: number,
): RowControl {
  const { words, onRemove } = view;
  const move = (by: number) => () =>
    view.onShare(index, Math.min(100, Math.max(0, part.percent + by)));
  const items: RowItem[] = [
    {
      kind: 'act',
      key: 'less',
      glyph: 'minus',
      label: words.less(part.label),
      disabled: part.percent <= 0,
      leaves: part.percent <= SHARE_STEP,
      onPress: move(-SHARE_STEP),
    },
    {
      kind: 'share',
      key: 'share',
      field: {
        steppers: false,
        words: shared.number,
        density: 'functional',
        hero: true,
        plain: true,
        ariaLabel: words.share(part.label),
        value: part.percent,
        min: 0,
        max: 100,
        precision: 0,
        unit: PERCENT,
        onCommit: (percent) => view.onShare(index, percent),
      },
    },
    {
      kind: 'act',
      key: 'more',
      glyph: 'plus',
      label: words.more(part.label),
      disabled: part.percent >= 100,
      leaves: part.percent >= 100 - SHARE_STEP,
      onPress: move(SHARE_STEP),
    },
  ];
  if (onRemove !== undefined) {
    items.push({
      kind: 'act',
      key: 'remove',
      glyph: 'trash',
      label: words.remove(part.label),
      leaves: true,
      onPress: () => onRemove(index),
    });
  }
  const { onOpen } = view;
  return {
    key: part.key,
    title: part.label,
    line: part.due,
    ...(onOpen === undefined
      ? {}
      : { open: { label: words.edit(part.label), onPress: () => onOpen(index) } }),
    items,
  };
}

function planChips(view: PaymentControlsView): ChipControl[] {
  const chips: ChipControl[] = view.plans.map((plan) => ({
    key: plan.id,
    label: plan.name,
    active: plan.id === view.planId,
    onPress: () => view.onPlan(plan.id),
  }));
  if (view.onNewPlan !== undefined) {
    chips.push({ key: 'new', label: view.words.newPlan, glyph: 'plus', onPress: view.onNewPlan });
  }
  return chips;
}

/**
 * Step 7 (`M06-13`, `T-M06-009`): the company's named plans as chips, each part a row with − and +
 * in steps of five and a typed share, then *Add a part* and *Reset*. The split bar above follows at
 * once; the hundred is checked at Generate, never here (`M06-22`).
 */
export function paymentControls(
  view: PaymentControlsView,
  shared: ProposalStepWords,
): StepControl[] {
  const { words } = view;
  return [
    { kind: 'chips', key: 'plans', name: words.plans, chips: planChips(view), note: words.note },
    {
      kind: 'rows',
      key: 'parts',
      rows: view.parts.map((part, index) => partRow(view, shared, part, index)),
    },
    {
      kind: 'acts',
      key: 'acts',
      acts: [
        { glyph: 'plus', label: words.add, onPress: view.onAdd },
        { glyph: 'retry', label: words.reset, onPress: view.onReset, quiet: true },
      ],
    },
    { kind: 'hint', key: 'hint', text: words.hint },
  ];
}
