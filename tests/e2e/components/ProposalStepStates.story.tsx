import { createTranslator, proposalStepWords, provenanceWords } from '@heliogrid/i18n';
import {
  type FocusHandle,
  ProposalStep,
  type ProposalStepView,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { stepView } from '../support/proposal-builder-sample';

const en = await createTranslator('en');
const nothing = () => undefined;

export type StepState = 'updating' | 'refused' | 'part-row';

/** A step in the states its view model reaches: a save out, a value refused, a payment row. */
export function StepStateStory({ state }: { state: StepState }) {
  const title = useRef<FocusHandle | null>(null);
  const acts = { onPick: nothing, onEditPhase: nothing };
  const system = stepView(en.t, 'system', 'drawn', acts);
  const payment = stepView(en.t, 'payment', 'drawn', acts);
  const view: ProposalStepView =
    state === 'part-row' && payment.step === 'payment'
      ? { ...payment, onOpen: (index) => document.body.setAttribute('data-opened', String(index)) }
      : state === 'refused' && system.step === 'system'
        ? {
            ...system,
            saves: { price: { kind: 'refused', reason: 'The price must be above zero.' as never } },
          }
        : system;
  return (
    <ProvenanceWordsProvider value={provenanceWords(en.t)}>
      <ProposalStep
        wide={false}
        words={proposalStepWords(en.t)}
        read={{ kind: 'ready', value: view }}
        focusAfter={title}
        {...(state === 'updating' ? { updating: 'Updating…' as never } : {})}
      />
    </ProvenanceWordsProvider>
  );
}
