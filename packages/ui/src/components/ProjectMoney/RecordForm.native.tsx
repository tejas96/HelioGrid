import { Text } from '../../primitives/Text/Text.native';
import { DatePicker } from '../DatePicker/DatePicker.native';
import { Input } from '../Input/Input.native';
import { NumberField } from '../NumberField/NumberField.native';
import { PhotoField } from '../PhotoField/PhotoField.native';
import { ProjectSheetSend } from '../ProjectActSheet/ProjectSheetSend.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { type RecordProps, useRecordForm } from './use-record-form';

/**
 * Record money that arrived, on the phone (`M11-33`…`M11-39`): the amount starts as what the part
 * still owes, the mode is one the market declares, the UTR or cheque number is kept to stop one
 * payment being recorded twice, and a photo may ride with it. The server says how the part stands
 * after the save (`M11-10`).
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
        {...(draft.amount === null ? {} : { value: draft.amount })}
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
        {...(form.photo === null
          ? {}
          : { src: form.photo.preview, name: form.photo.name, onRemove: form.onRemovePhoto })}
        onChoose={form.onPickPhoto}
        chooseLabel={words.addPhoto}
        replaceLabel={words.replacePhoto}
        removeLabel={words.removePhoto}
        actIcon="camera"
        disabled={sending}
      />
      <ProjectSheetSend {...draft.send} />
      <Text variant="body-sm" color="secondary">
        {words.savedAs(form.recorder)}
      </Text>
    </>
  );
}
