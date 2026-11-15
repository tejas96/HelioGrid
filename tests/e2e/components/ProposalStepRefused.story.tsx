import type { ProposalStep as StepKey } from '@heliogrid/domain';
import { createTranslator, proposalStepWords, provenanceWords } from '@heliogrid/i18n';
import {
  type FocusHandle,
  ProposalStep,
  type ProposalStepView,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { type BuilderCase, stepView } from '../support/proposal-builder-sample';
import { refusalOf } from '../support/proposal-step-cases';

const en = await createTranslator('en');
const nothing = () => undefined;

/** The parts a sample view leaves out, given where the case refuses a field inside them. */
const WITH_FIELD: Readonly<Record<string, object>> = {
  about: { about: { max: 500, onCommit: nothing } },
  area: {
    area: {
      options: [{ code: 'IN-MH', name: 'Maharashtra', districts: ['Pune', 'Nashik'] }],
      code: 'IN-MH',
      district: 'Pune',
      onArea: nothing,
    },
  },
};

/** One step with one field the server refused, as `fieldStateOf` hands it to the step's view. */
export function StepRefusedStory({
  step,
  field,
  kase = 'owner',
}: {
  step: StepKey;
  field: string;
  kase?: BuilderCase;
}) {
  const title = useRef<FocusHandle | null>(null);
  const drawn = stepView(en.t, step, kase, { onPick: nothing, onEditPhase: nothing });
  const view = {
    ...drawn,
    ...WITH_FIELD[field],
    saves: { [field]: { kind: 'refused', reason: refusalOf(field) } },
  } as ProposalStepView;
  return (
    <ProvenanceWordsProvider value={provenanceWords(en.t)}>
      <ProposalStep
        wide={false}
        words={proposalStepWords(en.t)}
        read={{ kind: 'ready', value: view }}
        focusAfter={title}
      />
    </ProvenanceWordsProvider>
  );
}
