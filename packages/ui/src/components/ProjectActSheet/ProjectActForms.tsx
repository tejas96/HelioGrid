import { type FormEvent, type ReactNode, useState } from 'react';
import { DatePicker } from '../DatePicker';
import { Input } from '../Input';
import { dayOf } from '../LeadActSheet/LeadActParts';
import { Textarea } from '../Textarea';
import { footOf, sendWhen } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend';
import { useTypedDraft } from './use-typed-draft';

/**
 * A one-line form on the web: Enter in its field sends it, as its button does — Esc closes the
 * sheet, which `EditorSurface` holds.
 */
function OneLine({ onSend, children }: { onSend: () => void; children: ReactNode }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };
  return (
    <form className="hg-project-act-form" noValidate onSubmit={submit}>
      {children}
    </form>
  );
}

/** *Not needed* on a checklist row: one line of reason is required, and the row then counts as done. */
export function NotNeededForm({ form, words, ...frame }: ProjectFormOf<'notNeeded'>) {
  const reason = useTypedDraft('', frame.sending);
  const send = sendWhen(reason.typed, form.onSend);
  return (
    <OneLine onSend={() => !frame.sending && send.onSend()}>
      <Input label={words.notNeeded.reason} {...reason.field} />
      <ProjectSheetSend
        label={words.notNeeded.send}
        {...footOf(frame)}
        {...send}
        glyph={null}
        destructive={false}
      />
    </OneLine>
  );
}

/**
 * A new install date — the day promised to the customer, today at the earliest. A promised day
 * already behind today is not offered again: the person picks a new one.
 */
export function DateForm({ form, words, ...frame }: ProjectFormOf<'date'>) {
  const start = form.start !== null && form.start >= form.firstDay ? form.start : null;
  const [day, setDay] = useState<string | null>(start);
  return (
    <>
      <DatePicker
        words={words.fields.date}
        value={day ?? undefined}
        min={form.firstDay}
        disabled={frame.sending}
        onChange={(value) => setDay(dayOf(value))}
      />
      <ProjectSheetSend
        label={words.date.send}
        {...footOf(frame)}
        {...sendWhen(day, form.onSend)}
        glyph="calendar"
        destructive={false}
      />
    </>
  );
}

/** How the crew gets in — keys, gate, who to call; an emptied note clears it. */
export function AccessForm({ form, words, ...frame }: ProjectFormOf<'access'>) {
  const note = useTypedDraft(form.start ?? '', frame.sending);
  return (
    <>
      <Textarea label={words.access.title} {...note.field} rows={4} />
      <ProjectSheetSend
        label={words.access.send}
        ready
        {...footOf(frame)}
        onSend={() => form.onSend(note.typed)}
        glyph={null}
        destructive={false}
      />
    </>
  );
}

/** A picked file's name, as it will read on the project — the picker's name to start with. */
export function FileNameForm({ form, words, ...frame }: ProjectFormOf<'fileName'>) {
  const name = useTypedDraft(form.start, frame.sending);
  const send = sendWhen(name.typed, form.onSend);
  return (
    <OneLine onSend={() => !frame.sending && send.onSend()}>
      <Input label={words.file.name} labelSpokenOnly {...name.field} />
      <ProjectSheetSend
        label={words.file.send}
        {...footOf(frame)}
        {...send}
        glyph="upload"
        destructive={false}
      />
    </OneLine>
  );
}
