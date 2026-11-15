import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Input } from '../Input/Input.native';
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
