import type { ProposalPhase } from '@heliogrid/domain';
import {
  createTranslator,
  proposalBankStepWords,
  proposalStepWords,
  provenanceWords,
} from '@heliogrid/i18n';
import {
  type FieldMarks,
  type FocusHandle,
  ProposalStep,
  type ProposalStepView,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { type RefObject, useRef, useState } from 'react';
import { stepView } from '../support/proposal-builder-sample';
import { OVER_LONG_TERMS } from '../support/proposal-long-terms';
import { DEFAULT_FAILED, MARK } from '../support/proposal-step-cases';

const en = await createTranslator('en');
const nothing = () => undefined;
const acts = { onPick: nothing, onEditPhase: nothing };

export type StepCase =
  | 'price-marked'
  | 'list-marked'
  | 'terms-over'
  | 'terms-saved'
  | 'terms-failed'
  | 'terms-other'
  | 'bank-off'
  | 'record'
  | 'client'
  | 'timeline'
  | 'performance'
  | 'components-empty';

const MARKS: Partial<Record<StepCase, FieldMarks>> = {
  'price-marked': { 'system.priceInclusive': MARK as never },
  'list-marked': { 'timeline.phases': MARK as never },
};

/** Step 4 as its hook runs it: a month typed over, and ↺ putting the filled figures back. */
function performanceCase(months: readonly number[], setMonths: (next: number[]) => void) {
  const view = stepView(en.t, 'performance', 'drawn', acts);
  if (view.step !== 'performance') return view;
  const filled = view.monthlyKwh ?? [];
  return {
    ...view,
    monthlyKwh: months,
    onMonth: (month: number, kwh: number) =>
      setMonths(months.map((one, at) => (at === month ? kwh : one))),
    onRefill: () => setMonths([...filled]),
  };
}

function caseView(
  kase: StepCase,
  phases: ProposalPhase[],
  setPhases: (next: ProposalPhase[]) => void,
) {
  if (kase === 'price-marked') return stepView(en.t, 'system', 'drawn', acts);
  if (kase === 'record') return stepView(en.t, 'achievements', 'drawn', acts);
  if (kase === 'client') return stepView(en.t, 'client', 'drawn', acts);
  if (kase === 'bank-off') {
    const bank = stepView(en.t, 'bank', 'owner', acts);
    return bank.step === 'bank'
      ? {
          ...bank,
          include: false,
          words: proposalBankStepWords(en.t, { include: false, owner: '', routingLabel: 'IFSC' }),
        }
      : bank;
  }
  if (kase === 'timeline' || kase === 'list-marked') {
    const timeline = stepView(en.t, 'timeline', 'drawn', acts);
    if (timeline.step !== 'timeline') return timeline;
    return {
      ...timeline,
      phases,
      onRemove: (index: number) => setPhases(phases.filter((_, at) => at !== index)),
      onMove: (index: number, by: -1 | 1) => {
        const next = [...phases];
        const [moved] = next.splice(index, 1);
        if (moved !== undefined) next.splice(index + by, 0, moved);
        setPhases(next);
      },
    };
  }
  const terms = stepView(en.t, 'terms', kase === 'terms-other' ? 'drawn' : 'owner', acts);
  if (terms.step !== 'terms') return terms;
  if (kase === 'terms-over') return { ...terms, terms: OVER_LONG_TERMS as typeof terms.terms };
  if (kase === 'terms-saved') return { ...terms, defaultSaved: true };
  if (kase === 'terms-failed') return { ...terms, defaultFailure: DEFAULT_FAILED as never };
  return terms;
}

/** One step in a case its view model reaches, under a title that takes focus as the frame's does. */
export function StepCaseStory({ kase, heading }: { kase: StepCase; heading: string }) {
  const title = useRef<HTMLHeadingElement | null>(null);
  const timeline = stepView(en.t, 'timeline', 'drawn', acts);
  const [phases, setPhases] = useState<ProposalPhase[]>(
    timeline.step === 'timeline' ? [...timeline.phases] : [],
  );
  const performance = stepView(en.t, 'performance', 'drawn', acts);
  const [months, setMonths] = useState<number[]>(
    performance.step === 'performance' ? [...(performance.monthlyKwh ?? [])] : [],
  );
  const view: ProposalStepView =
    kase === 'performance'
      ? performanceCase(months, setMonths)
      : kase === 'components-empty'
        ? stepView(en.t, 'components', 'empty', acts)
        : caseView(kase, phases, setPhases);
  return (
    <ProvenanceWordsProvider value={provenanceWords(en.t)}>
      <h2 ref={title} tabIndex={-1}>
        {heading}
      </h2>
      <ProposalStep
        wide={false}
        words={proposalStepWords(en.t)}
        read={{ kind: 'ready', value: view }}
        focusAfter={title as unknown as RefObject<FocusHandle | null>}
        {...(MARKS[kase] === undefined ? {} : { marks: MARKS[kase] })}
      />
    </ProvenanceWordsProvider>
  );
}
