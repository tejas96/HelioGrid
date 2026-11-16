import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Input } from '../Input/Input';
import { NumberField } from '../NumberField/NumberField';
import { Select } from '../Select/Select';
import { Textarea } from '../Textarea/Textarea';
import { BrandMark } from './PartPicker';
import { PartSheetFrame } from './PartSheetFrame';
import type { ProposalPartEditProps } from './ProposalPartSheets.types';
import { type PartFactField, partFactRows } from './sheet-fields';
import { type PartEditing, usePartEdit } from './use-part-edit';
import './ProposalPartSheets.css';

function Field({ field }: { field: PartFactField }) {
  if (field.kind === 'number') return <NumberField {...field.props} />;
  if (field.kind === 'choice') return <Select {...field.props} />;
  return <Input {...field.props} />;
}

function EditFields({ edit, words }: { edit: PartEditing; words: ProposalPartEditProps['words'] }) {
  const { line, facts, description } = edit;
  return (
    <div className="hg-pps-body">
      <div className="hg-pps-brand hg-pps-tile">
        <BrandMark brand={line.brand} large />
        <span className="hg-pps-brand-name">{line.brand}</span>
        <span className="hg-pps-lock">
          <ShellGlyph name="lock" size="sm" />
          {words.brandFixed}
        </span>
      </div>
      <div className="hg-pps-fields">
        {partFactRows(facts).map((row) =>
          row.length === 1 && row[0] !== undefined ? (
            <Field key={row[0].key} field={row[0]} />
          ) : (
            <div key={row.map((field) => field.key).join(':')} className="hg-pps-pair">
              {row.map((field) => (
                <Field key={field.key} field={field} />
              ))}
            </div>
          ),
        )}
      </div>
      <div className="hg-pps-field">
        <span className="hg-pps-field-top">
          <span className="hg-pps-field-label">{description.label}</span>
          <span className="hg-pps-field-tag">{description.tag}</span>
        </span>
        <Textarea {...description.props} />
      </div>
      <p className="hg-pps-hint">
        <ShellGlyph name="info" size="sm" />
        <span>{words.staysHere}</span>
      </p>
    </div>
  );
}

/**
 * *Edit what prints* (`M06-29`): the brand is fixed; the kind's own facts and one line for the
 * customer are this proposal's alone — the catalog item never changes (`M06-31`).
 */
export function ProposalPartEdit({ open, onClose, words, line, onDone }: ProposalPartEditProps) {
  const edit = usePartEdit(open, line, words);
  return (
    <PartSheetFrame
      open={open}
      onClose={onClose}
      words={words}
      done={edit === null ? null : { disabled: false, press: () => onDone(edit.line) }}
    >
      {open && edit !== null ? <EditFields edit={edit} words={words} /> : null}
    </PartSheetFrame>
  );
}
