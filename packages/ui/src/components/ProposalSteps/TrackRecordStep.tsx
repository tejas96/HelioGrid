import { NumberField } from '../NumberField/NumberField';
import { Textarea } from '../Textarea/Textarea';
import type { TrackRecordStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine, StepHint } from './StepParts';
import { trackRecordCells } from './step-fields';
import { useAboutDraft } from './use-about-draft';

function About({ view, shared }: { view: TrackRecordStepView; shared: ProposalStepWords }) {
  const { about, words } = view;
  const { text, change, leave } = useAboutDraft(view);
  if (about === undefined) return null;
  return (
    <div className="hg-pst-field">
      <span className="hg-pst-field-top">
        <span className="hg-pst-field-label">{words.about}</span>
        <span className="hg-pst-field-tag">{words.aboutCount(text.length, about.max)}</span>
      </span>
      <Textarea
        label={words.about}
        labelSpokenOnly
        value={text}
        onChange={change}
        onLeave={leave}
        maxLength={about.max}
        rows={4}
      />
      <FieldSaveLine save={view.saves?.about} words={shared} />
    </div>
  );
}

/**
 * Step 2 (`M06-08`, `T-M06-004`): the three figures the customer reads are the fields. Numbers
 * only; each figure's unit is the word under it.
 */
export function TrackRecordStep({
  view,
  shared,
}: {
  view: TrackRecordStepView;
  shared: ProposalStepWords;
}) {
  const { words } = view;
  return (
    <div className="hg-pst-controls">
      <div className="hg-pst-counts hg-pst-tile">
        {trackRecordCells(view, shared).map((cell) => (
          <div className="hg-pst-count" key={cell.count}>
            <NumberField {...cell.field} />
            <span className="hg-pst-count-unit">{cell.unit}</span>
            <FieldSaveLine save={cell.save} words={shared} />
          </div>
        ))}
      </div>
      <About view={view} shared={shared} />
      <StepHint>{words.hint}</StepHint>
    </div>
  );
}
