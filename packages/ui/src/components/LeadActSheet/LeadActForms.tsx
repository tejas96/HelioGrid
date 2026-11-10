import type { TranslatedText } from '@heliogrid/contracts';
import {
  CALL_OUTCOMES,
  type CallOutcome,
  DISQUALIFY_REASONS,
  type DisqualifyReason,
} from '@heliogrid/domain';
import { useState } from 'react';
import { DatePicker } from '../DatePicker';
import { SegmentedControl } from '../SegmentedControl';
import { Textarea } from '../Textarea';
import { TimeField } from '../TimeField';
import { ActSend, ChoiceChips, dayOf } from './LeadActParts';
import type { LeadActForm, LeadActSheetProps } from './LeadActSheet.types';

/** What every form takes beside its own: whether its send is out, why it came back, field words. */
export interface FormFrame {
  pending: boolean;
  failure: TranslatedText | null;
  fields: LeadActSheetProps['fields'];
}

type FormOf<K extends LeadActForm['kind']> = Extract<LeadActForm, { kind: K }>;

/** Log activity (`M02-43`): a call and how it ended, with an optional note — or a note alone. */
export function LogForm({ form, pending, failure }: FormFrame & { form: FormOf<'log'> }) {
  const { words } = form;
  const [kind, setKind] = useState<'call' | 'note'>('call');
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [note, setNote] = useState('');
  const text = note.trim();
  const ready = kind === 'call' ? outcome !== null : text !== '';
  return (
    <>
      <SegmentedControl
        ariaLabel={words.kindLabel}
        value={kind}
        options={[
          { value: 'call', label: words.call },
          { value: 'note', label: words.note },
        ]}
        onChange={(value) => {
          if (!pending) setKind(value === 'note' ? 'note' : 'call');
        }}
      />
      {kind === 'call' ? (
        <ChoiceChips
          label={words.outcomeLabel}
          options={CALL_OUTCOMES.map((value) => ({ value, label: words.outcome[value] }))}
          value={outcome}
          onChange={setOutcome}
          disabled={pending}
        />
      ) : null}
      {kind === 'call' && outcome === 'no_answer' ? (
        <p className="hg-lead-act-note">{words.noAnswerLine}</p>
      ) : null}
      <Textarea
        label={words.noteLabel}
        placeholder={words.notePlaceholder}
        value={note}
        onChange={setNote}
        rows={3}
        disabled={pending}
      />
      <ActSend
        label={kind === 'call' ? words.send : words.sendNote}
        ready={ready}
        pending={pending}
        failure={failure}
        onSend={() => {
          if (kind === 'note') form.onSend({ kind: 'note', text });
          else if (outcome !== null) {
            form.onSend({ kind: 'call', outcome, note: text === '' ? null : text });
          }
        }}
      />
    </>
  );
}

/** Snooze (`M02-51`): the wake day is required, tomorrow at the earliest. */
export function SnoozeForm({
  form,
  pending,
  failure,
  fields,
}: FormFrame & { form: FormOf<'snooze'> }) {
  const [day, setDay] = useState<string | null>(null);
  return (
    <>
      <DatePicker
        label={form.words.wakeOn}
        words={fields.date}
        value={day ?? undefined}
        min={form.firstDay}
        disabled={pending}
        onChange={(value) => setDay(dayOf(value))}
      />
      <ActSend
        label={form.words.send}
        ready={day !== null}
        pending={pending}
        failure={failure}
        onSend={() => {
          if (day !== null) form.onSend(day);
        }}
      />
    </>
  );
}

/** Disqualify (`M02-42`): one of the six reasons, or the act cannot complete. */
export function DisqualifyForm({
  form,
  pending,
  failure,
}: FormFrame & { form: FormOf<'disqualify'> }) {
  const { words } = form;
  const [reason, setReason] = useState<DisqualifyReason | null>(null);
  return (
    <>
      <ChoiceChips
        label={words.reasonLabel}
        options={DISQUALIFY_REASONS.map((value) => ({ value, label: words.reason[value] }))}
        value={reason}
        onChange={setReason}
        disabled={pending}
      />
      {reason === 'wrong_number' ? (
        <p className="hg-lead-act-note">{words.wrongNumberLine}</p>
      ) : null}
      <ActSend
        label={words.send}
        ready={reason !== null}
        pending={pending}
        failure={failure}
        onSend={() => {
          if (reason !== null) form.onSend(reason);
        }}
      />
    </>
  );
}

/** Junk (`M02-55`): what it does is the sheet's line; the send is the one act. */
export function JunkForm({ form, pending, failure }: FormFrame & { form: FormOf<'junk'> }) {
  return (
    <ActSend
      label={form.words.send}
      ready
      pending={pending}
      failure={failure}
      destructive
      onSend={form.onSend}
    />
  );
}

/** A call-back: the day and the time it is due, on the tenant's clock. */
export function CallBackForm({
  form,
  pending,
  failure,
  fields,
}: FormFrame & { form: FormOf<'callBack'> }) {
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState('');
  return (
    <>
      <DatePicker
        label={form.words.date}
        words={fields.date}
        value={day ?? undefined}
        min={form.firstDay}
        disabled={pending}
        onChange={(value) => setDay(dayOf(value))}
      />
      <TimeField
        label={form.words.time}
        words={fields.time}
        value={time}
        onCommit={setTime}
        disabled={pending}
      />
      <ActSend
        label={form.words.send}
        ready={day !== null && time !== ''}
        pending={pending}
        failure={failure}
        onSend={() => {
          if (day !== null && time !== '') form.onSend({ date: day, time });
        }}
      />
    </>
  );
}
