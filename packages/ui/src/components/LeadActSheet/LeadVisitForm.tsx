import { useState } from 'react';
import { Button } from '../Button';
import { DatePicker } from '../DatePicker';
import { Input } from '../Input';
import { LoadingBars } from '../LoadingBars';
import { NamedGap } from '../NamedGap';
import { Select } from '../Select';
import { TimeField } from '../TimeField';
import type { FormFrame } from './LeadActForms';
import { ActSend, dayOf } from './LeadActParts';
import type { LeadActForm } from './LeadActSheet.types';

type VisitForm = Extract<LeadActForm, { kind: 'visit' }>;

/**
 * Book visit (`M02-46`) — or, with one booked, the no-show reschedule (`M02-48`): the day, the time,
 * who goes and the address the customer confirmed. The send sleeps until all four are given.
 */
export function LeadVisitForm({ form, pending, failure, fields }: FormFrame & { form: VisitForm }) {
  const { words, start } = form;
  const [day, setDay] = useState<string | null>(start.date ?? null);
  const [time, setTime] = useState(start.time ?? '');
  const [surveyorId, setSurveyorId] = useState(start.surveyorId ?? '');
  const [address, setAddress] = useState(start.address ?? '');
  const place = address.trim();
  const ready = day !== null && time !== '' && surveyorId !== '' && place !== '';
  return (
    <>
      <DatePicker
        label={words.date}
        words={fields.date}
        value={day ?? undefined}
        min={form.firstDay}
        disabled={pending}
        onChange={(value) => setDay(dayOf(value))}
      />
      <TimeField
        label={words.time}
        words={fields.time}
        value={time}
        onCommit={setTime}
        disabled={pending}
      />
      <Surveyors form={form} value={surveyorId} onChange={setSurveyorId} disabled={pending} />
      <Input
        label={words.address}
        helper={words.addressHint}
        value={address}
        onChange={setAddress}
        disabled={pending}
      />
      <ActSend
        label={words.send}
        ready={ready}
        pending={pending}
        failure={failure}
        onSend={() => {
          if (day !== null && ready) form.onSend({ date: day, time, surveyorId, address: place });
        }}
      />
    </>
  );
}

/** Who can survey: the list while it is read, its failure with Try again, none yet, or the pick. */
function Surveyors({
  form,
  value,
  onChange,
  disabled,
}: {
  form: VisitForm;
  value: string;
  onChange: (userId: string) => void;
  disabled: boolean;
}) {
  const { words, surveyors } = form;
  const { read } = surveyors;
  if (read.kind === 'loading') {
    return <LoadingBars label={words.surveyorsLoading} bars={['control']} />;
  }
  if (read.kind === 'failed') {
    return (
      <div className="hg-lead-act-read">
        <span className="hg-lead-act-label">{words.surveyorsFailed}</span>
        <Button variant="secondary" size="sm" onClick={read.retry}>
          {words.retry}
        </Button>
      </div>
    );
  }
  if (read.kind === 'empty' || read.kind === 'unavailable') {
    return <NamedGap gap={words.noSurveyors} />;
  }
  return (
    <Select
      label={words.surveyor}
      placeholder={words.surveyorPick}
      closeLabel={words.close}
      value={value}
      options={[...surveyors.options]}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
