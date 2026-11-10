import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { DatePicker } from '../DatePicker/DatePicker.native';
import type { ISODate } from '../DatePicker/DatePicker.types';
import { Input } from '../Input/Input.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { Select } from '../Select/Select.native';
import { TimeField } from '../TimeField/TimeField.native';
import { LeadActSend, type LeadFormFrame } from './LeadActSend.native';
import type { LeadActForm } from './LeadActSheet.types';
import { dayOf } from './LeadParkForms.native';

type VisitForm = Extract<LeadActForm, { kind: 'visit' }>;

/**
 * Book visit (`M02-46`) — or a no-show's reschedule (`M02-48`), starting from the booked visit's
 * surveyor and address: the day, the time, who surveys and the address as the customer confirmed
 * it, all four required.
 */
export function LeadVisitForm({ form, frame }: { form: VisitForm; frame: LeadFormFrame }) {
  const { words, start } = form;
  const [date, setDate] = useState<ISODate | null>(start.date ?? null);
  const [time, setTime] = useState(start.time ?? '');
  const [surveyorId, setSurveyorId] = useState(start.surveyorId ?? '');
  const [address, setAddress] = useState(start.address ?? '');
  const confirmed = address.trim();
  const ready = date !== null && time !== '' && surveyorId !== '' && confirmed !== '';
  return (
    <View style={styles.form}>
      <DatePicker
        words={frame.fields.date}
        label={words.date}
        min={form.firstDay}
        {...(date === null ? {} : { value: date })}
        onChange={(value) => setDate(dayOf(value))}
        disabled={frame.pending}
      />
      <TimeField
        words={frame.fields.time}
        label={words.time}
        value={time}
        onCommit={setTime}
        disabled={frame.pending}
      />
      <Surveyors form={form} value={surveyorId} onChange={setSurveyorId} pending={frame.pending} />
      <Input
        label={words.address}
        helper={words.addressHint}
        value={address}
        onChange={setAddress}
        disabled={frame.pending}
      />
      <LeadActSend
        label={words.send}
        ready={ready}
        pending={frame.pending}
        failure={frame.failure}
        onSend={() => {
          if (date !== null && ready) {
            form.onSend({ date, time, surveyorId, address: confirmed });
          }
        }}
      />
    </View>
  );
}

/** Who can survey: the read's states, then the people as one pick. */
function Surveyors({
  form,
  value,
  onChange,
  pending,
}: {
  form: VisitForm;
  value: string;
  onChange: (surveyorId: string) => void;
  pending: boolean;
}) {
  const { words, surveyors } = form;
  const { read } = surveyors;
  switch (read.kind) {
    case 'loading':
      return <LoadingBars label={words.surveyorsLoading} bars={['control']} />;
    case 'failed':
      return (
        <View style={styles.state}>
          <Text variant="body-sm" color="danger">
            {words.surveyorsFailed}
          </Text>
          <Button variant="secondary" size="sm" onClick={read.retry}>
            {words.retry}
          </Button>
        </View>
      );
    case 'empty':
    case 'unavailable':
      return <NamedGap gap={words.noSurveyors} />;
    case 'ready':
      return (
        <Select
          label={words.surveyor}
          placeholder={words.surveyorPick}
          closeLabel={words.close}
          options={[...surveyors.options]}
          value={value}
          onChange={onChange}
          disabled={pending}
        />
      );
  }
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  state: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
});
