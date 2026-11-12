import { DatePicker } from '../DatePicker';
import { Input } from '../Input';
import { NumberField } from '../NumberField';
import { PhotoField } from '../PhotoField';
import { ProjectSheetSend } from '../ProjectActSheet/ProjectSheetSend';
import { SegmentedControl } from '../SegmentedControl';
import { type RecordProps, useRecordForm } from './use-record-form';

/**
 * Record money that arrived (`M11-33`…`M11-39`): the amount starts as what the part still owes,
 * the mode is one the market declares, the UTR or cheque number is kept to stop one payment being
 * recorded twice, and a photo may ride with it. Nothing is typed as a status — the server says how
 * the part stands after the save (`M11-10`).
 */
export function RecordForm(props: RecordProps) {
  const { form, words, sending } = props;
  const draft = useRecordForm(props);
  return (
    <>
      <NumberField
        words={words.number}
        label={words.amount}
        hint={draft.amountHint}
        currency
        precision={draft.digits}
        min={0}
        value={draft.amount ?? undefined}
        commits="as-typed"
        disabled={sending}
        onCommit={draft.setAmount}
        onClear={draft.clearAmount}
      />
      <SegmentedControl
        label={words.paidBy}
        value={draft.mode ?? ''}
        onChange={draft.setMode}
        options={draft.modeOptions}
      />
      <Input
        label={words.reference}
        helper={draft.referenceHelper}
        error={draft.referenceError}
        value={draft.reference}
        onChange={draft.typeReference}
        disabled={sending}
        mono
      />
      <DatePicker
        words={words.calendar}
        label={words.receivedOn}
        value={draft.receivedOn}
        max={form.today}
        disabled={sending}
        onChange={draft.pickDate}
      />
      <PhotoField
        label={words.photo}
        src={form.photo?.preview}
        name={form.photo?.name}
        onChoose={form.onPickPhoto}
        onRemove={form.photo === null ? undefined : form.onRemovePhoto}
        chooseLabel={words.addPhoto}
        replaceLabel={words.replacePhoto}
        removeLabel={words.removePhoto}
        actIcon="camera"
        disabled={sending}
      />
      <ProjectSheetSend {...draft.send} />
      <p className="hg-money-quiet">{words.savedAs(form.recorder)}</p>
    </>
  );
}
