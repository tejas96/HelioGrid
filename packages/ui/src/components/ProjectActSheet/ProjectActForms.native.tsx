import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DatePicker } from '../DatePicker/DatePicker.native';
import type { ISODate } from '../DatePicker/DatePicker.types';
import { Input } from '../Input/Input.native';
import { dayOf } from '../LeadActSheet/LeadParkForms.native';
import { Textarea } from '../Textarea/Textarea.native';
import { footOf, sendWhen } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend.native';
import { useTypedDraft } from './use-typed-draft';

/** *Not needed* on a checklist row: one line of reason is required, and the row then counts as done. */
export function NotNeededForm({ form, words, ...frame }: ProjectFormOf<'notNeeded'>) {
  const reason = useTypedDraft('', frame.sending);
  return (
    <View style={styles.form}>
      <Input label={words.notNeeded.reason} {...reason.field} />
      <ProjectSheetSend
        label={words.notNeeded.send}
        {...footOf(frame)}
        {...sendWhen(reason.typed, form.onSend)}
        glyph={null}
        destructive={false}
      />
    </View>
  );
}

/** A new install date — today at the earliest; a promised day already behind today is not offered. */
export function DateForm({ form, words, ...frame }: ProjectFormOf<'date'>) {
  const start = form.start !== null && form.start >= form.firstDay ? form.start : null;
  const [day, setDay] = useState<ISODate | null>(start);
  return (
    <View style={styles.form}>
      <DatePicker
        words={words.fields.date}
        min={form.firstDay}
        {...(day === null ? {} : { value: day })}
        onChange={(value) => setDay(dayOf(value))}
        disabled={frame.sending}
      />
      <ProjectSheetSend
        label={words.date.send}
        {...footOf(frame)}
        {...sendWhen(day, form.onSend)}
        glyph="calendar"
        destructive={false}
      />
    </View>
  );
}

/** How the crew gets in — keys, gate, who to call; an emptied note clears it. */
export function AccessForm({ form, words, ...frame }: ProjectFormOf<'access'>) {
  const note = useTypedDraft(form.start ?? '', frame.sending);
  return (
    <View style={styles.form}>
      <Textarea label={words.access.title} {...note.field} rows={4} />
      <ProjectSheetSend
        label={words.access.send}
        ready
        {...footOf(frame)}
        onSend={() => form.onSend(note.typed)}
        glyph={null}
        destructive={false}
      />
    </View>
  );
}

/** A picked file's name, as it will read on the project — the picker's name to start with. */
export function FileNameForm({ form, words, ...frame }: ProjectFormOf<'fileName'>) {
  const name = useTypedDraft(form.start, frame.sending);
  return (
    <View style={styles.form}>
      <Input label={words.file.name} labelSpokenOnly {...name.field} />
      <ProjectSheetSend
        label={words.file.send}
        {...footOf(frame)}
        {...sendWhen(name.typed, form.onSend)}
        glyph="upload"
        destructive={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
});
