import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { PartSheetFrame } from './PartSheetFrame';
import type { ProposalPaymentPartSheetProps } from './ProposalPartSheets.types';
import { paymentPartFields } from './sheet-fields';
import { useSheetDraft } from './use-sheet-draft';
import './ProposalPartSheets.css';

function PartFields({
  fields,
  hint,
}: {
  fields: ReturnType<typeof paymentPartFields>;
  hint: ProposalPaymentPartSheetProps['words']['hint'];
}) {
  return (
    <div className="hg-pps-body">
      <div className="hg-pps-field">
        <span className="hg-pps-field-top">
          <span className="hg-pps-field-label">{fields.name.label}</span>
          <span className="hg-pps-field-tag">{fields.name.tag}</span>
        </span>
        <Input {...fields.name.props} />
      </div>
      <Select {...fields.due} />
      <p className="hg-pps-hint">
        <ShellGlyph name="info-circle" size="sm" />
        <span>{hint}</span>
      </p>
    </div>
  );
}

/**
 * One payment part (`M06-13`, `T-M06-009`): its name, and the stage it falls due on. *Done*
 * stands in the sheet's own foot.
 */
export function ProposalPaymentPartSheet({
  open,
  onClose,
  words,
  part,
  stages,
  onDone,
}: ProposalPaymentPartSheetProps) {
  const [draft, setDraft] = useSheetDraft(open, part);
  const fields = draft === null ? null : paymentPartFields(draft, words, stages, setDraft);
  return (
    <PartSheetFrame
      open={open}
      onClose={onClose}
      words={words}
      done={
        fields === null ? null : { disabled: !fields.named, press: () => onDone(fields.finished) }
      }
    >
      {open && fields !== null ? <PartFields fields={fields} hint={words.hint} /> : null}
    </PartSheetFrame>
  );
}
