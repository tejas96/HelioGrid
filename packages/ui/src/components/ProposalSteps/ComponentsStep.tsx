import { ProgressRing } from '../ProgressRing/ProgressRing';
import { ProposalPartsBlock } from '../ProposalBlocks/ProposalBlocks';
import type { ComponentsStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine } from './StepParts';

/** The fraction printed inside the ring: a mark between two counts, not a word. */
const OF = '/';

/**
 * Step 8 (`M06-27`, `T-M06-010`): the ring that counts the kinds picked, then one tile per kind —
 * the proposal's own parts block, in which an empty kind says so in words and opens its picker.
 */
export function ComponentsStep({
  view,
  shared,
}: {
  view: ComponentsStepView;
  shared: ProposalStepWords;
}) {
  const { words, picked, required } = view;
  return (
    <>
      <div className="hg-pst-controls">
        <div className="hg-pst-ring">
          <ProgressRing
            size="sm"
            share={required === 0 ? 0 : picked / required}
            value={`${picked}${OF}${required}`}
            caption={words.ring}
            spokenName={words.ring}
          />
          <span className="hg-pst-ring-words">
            <span className="hg-pst-ring-title">{words.title}</span>
            <span className="hg-pst-ring-line">{words.line}</span>
          </span>
        </div>
        <FieldSaveLine save={view.saves?.components} words={shared} />
      </div>
      <ProposalPartsBlock mode="app" {...view.parts} />
    </>
  );
}
