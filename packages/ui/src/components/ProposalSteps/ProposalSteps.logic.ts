import { type ComponentType, createElement, type ReactElement } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter/FocusAfter.types';
import type {
  ProposalGenerationBlockProps,
  ProposalPriceBlockProps,
  ProposalSavingsBlockProps,
  ProposalSplitBlockProps,
} from '../ProposalBlocks/ProposalBlocks.types';
import type { SelectProps } from '../Select/Select.types';
import { financialsControls } from './financials-controls';
import type { ClientStepView, ProposalStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { paymentControls } from './payment-controls';
import type { StepControl } from './step-controls';
import { systemControls } from './system-controls';
import { timelineControls } from './timeline-controls';

/** The steps whose body is more than a list of controls: each has its own part on both halves. */
export type OwnBodyStep =
  | 'company'
  | 'achievements'
  | 'performance'
  | 'components'
  | 'terms'
  | 'client'
  | 'bank';

/** What a step's own part takes: its view, the room, and the words every step shares. */
export interface StepBodyProps<Step extends ProposalStepView['step']> {
  view: Extract<ProposalStepView, { step: Step }>;
  wide: boolean;
  shared: ProposalStepWords;
  /** Where focus lands once a row's act took itself away: the step's title. */
  focusAfter: FocusAfter;
}

/** A half's own parts, one a step. */
export type StepBodies = {
  readonly [Step in OwnBodyStep]: ComponentType<StepBodyProps<Step>>;
};

/** The blocks the customer reads, as a half draws them. */
export interface StepHeroBlocks {
  readonly price: ComponentType<ProposalPriceBlockProps>;
  readonly generation: ComponentType<ProposalGenerationBlockProps>;
  readonly savings: ComponentType<ProposalSavingsBlockProps>;
  readonly split: ComponentType<ProposalSplitBlockProps>;
}

/** The controls of a step drawn from data alone; `null` for a step that has its own part. */
export function stepControlsOf(
  view: ProposalStepView,
  shared: ProposalStepWords,
): StepControl[] | null {
  switch (view.step) {
    case 'system':
      return systemControls(view, shared);
    case 'financials':
      return financialsControls(view, shared);
    case 'timeline':
      return timelineControls(view);
    case 'payment':
      return paymentControls(view, shared);
    default:
      return null;
  }
}

/**
 * Which of a half's own parts draws this view (`T-M06-003`–`T-M06-013`): decided once, so the two
 * halves cannot come to draw different steps. No markup of its own — it hands each part its view.
 */
export function stepBodyOf(
  bodies: StepBodies,
  view: ProposalStepView,
  room: { wide: boolean; shared: ProposalStepWords; focusAfter: FocusAfter },
): ReactElement | null {
  switch (view.step) {
    case 'company':
      return createElement(bodies.company, { view, ...room });
    case 'achievements':
      return createElement(bodies.achievements, { view, ...room });
    case 'performance':
      return createElement(bodies.performance, { view, ...room });
    case 'components':
      return createElement(bodies.components, { view, ...room });
    case 'terms':
      return createElement(bodies.terms, { view, ...room });
    case 'client':
      return createElement(bodies.client, { view, ...room });
    case 'bank':
      return createElement(bodies.bank, { view, ...room });
    default:
      return null;
  }
}

/**
 * The block the customer will read, as the phone opens steps 3, 4, 5 and 7 with it (`T-M06-002`);
 * `null` where the step has none or its figures are not there yet.
 */
export function stepHeroOf(blocks: StepHeroBlocks, view: ProposalStepView): ReactElement | null {
  switch (view.step) {
    case 'system':
      return view.price === null
        ? null
        : createElement(blocks.price, { mode: 'app', ...view.price });
    case 'performance':
      return view.generation === null
        ? null
        : createElement(blocks.generation, { mode: 'app', ...view.generation });
    case 'financials':
      return view.savings === null
        ? null
        : createElement(blocks.savings, { mode: 'app', ...view.savings });
    case 'payment':
      return createElement(blocks.split, { mode: 'app', ...view.split });
    default:
      return null;
  }
}

/**
 * Step 10's two lists (`M06-09`): the region, then its districts — none until a region is picked.
 * Picking a region lets the district go; both halves draw these same two.
 */
export function areaSelects(
  area: NonNullable<ClientStepView['area']>,
  words: ClientStepView['words'],
): readonly [SelectProps, SelectProps] {
  const districts = area.options.find((option) => option.code === area.code)?.districts ?? [];
  const lists = { placeholder: words.choose, closeLabel: words.closeList };
  return [
    {
      ...lists,
      label: words.area,
      options: area.options.map((option) => ({ value: option.code, label: option.name })),
      ...(area.code === null ? {} : { value: area.code }),
      ...(area.missing ? { error: words.areaMissing } : {}),
      onChange: (code) => area.onArea({ area: code, district: null }),
    },
    {
      ...lists,
      label: words.district,
      options: [...districts],
      disabled: area.code === null,
      ...(area.district === null ? {} : { value: area.district }),
      onChange: (district) => {
        if (area.code !== null) area.onArea({ area: area.code, district });
      },
    },
  ];
}
