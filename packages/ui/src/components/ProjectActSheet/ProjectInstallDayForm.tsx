import { useState } from 'react';
import { DatePicker } from '../DatePicker';
import { dayOf } from '../LeadActSheet/LeadActParts';
import { NumberField } from '../NumberField';
import { Select } from '../Select';
import { Textarea } from '../Textarea';
import { TimeField } from '../TimeField';
import { INSTALL_DAYS, installDayOf } from './install-day';
import { footOf, sendWhen } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend';
import { useTypedDraft } from './use-typed-draft';

/**
 * The installation day (`F5-68`): the date promised — today at the earliest — and what the customer
 * is told with it: when the crew starts, how many days, what to expect and who leads. Only the date
 * is needed to save; each other fact can be added later, and an emptied one is cleared.
 */
export function InstallDayForm({ form, words, ...frame }: ProjectFormOf<'date'>) {
  const start = form.start !== null && form.start >= form.firstDay ? form.start : null;
  const [day, setDay] = useState<string | null>(start);
  const [time, setTime] = useState(form.install.startTime ?? '');
  const [days, setDays] = useState<number | null>(form.install.durationDays);
  const [lead, setLead] = useState(form.install.crewLeadId ?? '');
  const note = useTypedDraft(form.install.disturbance ?? '', frame.sending);
  const facts = installDayOf({ time, days, note: note.typed, lead });
  return (
    <>
      <DatePicker
        label={words.date.day}
        words={words.fields.date}
        value={day ?? undefined}
        min={form.firstDay}
        disabled={frame.sending}
        onChange={(value) => setDay(dayOf(value))}
      />
      <TimeField
        label={words.date.time}
        words={words.fields.time}
        value={time}
        onCommit={setTime}
        disabled={frame.sending}
      />
      <NumberField
        label={words.date.duration}
        words={words.fields.number}
        {...(days === null ? {} : { value: days })}
        onCommit={setDays}
        onClear={() => setDays(null)}
        commits="as-typed"
        {...INSTALL_DAYS}
        disabled={frame.sending}
      />
      {form.crew.length === 0 ? null : (
        <Select
          label={words.date.crewLead}
          placeholder={words.date.crewLeadPick}
          closeLabel={words.close}
          value={lead}
          options={form.crew.map((member) => ({ value: member.userId, label: member.name }))}
          onChange={setLead}
          disabled={frame.sending}
        />
      )}
      <Textarea
        label={words.date.disturbance}
        helper={words.date.disturbanceHint}
        {...note.field}
        rows={3}
      />
      <ProjectSheetSend
        label={words.date.send}
        {...footOf(frame)}
        {...sendWhen(day, (date) => form.onSend(date, facts))}
        glyph="calendar"
        destructive={false}
      />
    </>
  );
}
