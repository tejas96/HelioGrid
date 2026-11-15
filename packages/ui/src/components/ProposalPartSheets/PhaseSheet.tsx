import { Input } from '../Input/Input';
import { NumberField } from '../NumberField/NumberField';
import { Textarea } from '../Textarea/Textarea';
import { PartSheetFrame } from './PartSheetFrame';
import type { ProposalPhaseSheetProps } from './ProposalPartSheets.types';
import { phaseFields } from './sheet-fields';
import { useSheetDraft } from './use-sheet-draft';
import './ProposalPartSheets.css';

function PhaseFields({ fields }: { fields: ReturnType<typeof phaseFields> }) {
  return (
    <div className="hg-pps-body">
      <div className="hg-pps-field">
        <span className="hg-pps-field-top">
          <span className="hg-pps-field-label">{fields.name.label}</span>
          <span className="hg-pps-field-tag">{fields.name.tag}</span>
        </span>
        <Input {...fields.name.props} />
      </div>
      <div className="hg-pps-field">
        <span className="hg-pps-field-top">
          <span className="hg-pps-field-label">{fields.description.label}</span>
          <span className="hg-pps-field-tag">{fields.description.tag}</span>
        </span>
        <Textarea {...fields.description.props} />
      </div>
      {fields.duration === null ? null : <NumberField {...fields.duration} />}
    </div>
  );
}

/**
 * One timeline step (`M06-12`, `T-M06-008`): its name, its one sentence and how long it takes.
 * *Done* stands in the sheet's own foot, as every shipped sheet with a main act.
 */
export function ProposalPhaseSheet({
  open,
  onClose,
  words,
  phase,
  needsSentence = false,
  onDone,
}: ProposalPhaseSheetProps) {
  const [draft, setDraft] = useSheetDraft(open, phase);
  const fields = draft === null ? null : phaseFields(draft, words, setDraft, needsSentence);
  return (
    <PartSheetFrame
      open={open}
      onClose={onClose}
      words={words}
      done={
        fields === null ? null : { disabled: !fields.named, press: () => onDone(fields.finished) }
      }
    >
      {open && fields !== null ? <PhaseFields fields={fields} /> : null}
    </PartSheetFrame>
  );
}
