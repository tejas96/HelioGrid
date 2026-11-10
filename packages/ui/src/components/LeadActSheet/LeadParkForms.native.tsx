import { DISQUALIFY_REASONS, type DisqualifyReason } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { DatePicker } from '../DatePicker/DatePicker.native';
import type { CalendarValue, ISODate } from '../DatePicker/DatePicker.types';
import { TimeField } from '../TimeField/TimeField.native';
import { LeadActSend, type LeadFormFrame } from './LeadActSend.native';
import type { LeadActForm } from './LeadActSheet.types';
import { LeadChoiceChips } from './LeadChoiceChips.native';

type FormOf<K extends LeadActForm['kind']> = {
  form: Extract<LeadActForm, { kind: K }>;
  frame: LeadFormFrame;
};

/** The one day a single-day picker answers. */
export function dayOf(value: CalendarValue): ISODate | null {
  return typeof value === 'string' ? value : null;
}

/** Snooze (`M02-51`): the wake day is required — the send sleeps until one is picked. */
export function LeadSnoozeForm({ form, frame }: FormOf<'snooze'>) {
  const [wakeOn, setWakeOn] = useState<ISODate | null>(null);
  return (
    <View style={styles.form}>
      <DatePicker
        words={frame.fields.date}
        label={form.words.wakeOn}
        min={form.firstDay}
        {...(wakeOn === null ? {} : { value: wakeOn })}
        onChange={(value) => setWakeOn(dayOf(value))}
        disabled={frame.pending}
      />
      <LeadActSend
        label={form.words.send}
        ready={wakeOn !== null}
        pending={frame.pending}
        failure={frame.failure}
        onSend={() => {
          if (wakeOn !== null) form.onSend(wakeOn);
        }}
      />
    </View>
  );
}

/** Disqualify (`M02-42`): one of the six reasons is required, and the act cannot leave without it. */
export function LeadDisqualifyForm({ form, frame }: FormOf<'disqualify'>) {
  const [reason, setReason] = useState<DisqualifyReason | null>(null);
  return (
    <View style={styles.form}>
      <LeadChoiceChips
        label={form.words.reasonLabel}
        choices={DISQUALIFY_REASONS}
        chosen={reason}
        word={(each) => form.words.reason[each]}
        onChoose={setReason}
        disabled={frame.pending}
      />
      {reason === 'wrong_number' ? (
        <Text variant="body-sm" color="secondary">
          {form.words.wrongNumberLine}
        </Text>
      ) : null}
      <LeadActSend
        label={form.words.send}
        ready={reason !== null}
        pending={frame.pending}
        failure={frame.failure}
        variant="destructive"
        onSend={() => {
          if (reason !== null) form.onSend(reason);
        }}
      />
    </View>
  );
}

/** Junk (`M02-55`): it leaves every queue, is never deleted, and can be reopened — said, then sent. */
export function LeadJunkForm({ form, frame }: FormOf<'junk'>) {
  return (
    <View style={styles.form}>
      <LeadActSend
        label={form.words.send}
        ready
        pending={frame.pending}
        failure={frame.failure}
        variant="destructive"
        onSend={form.onSend}
      />
    </View>
  );
}

/** A call-back (`M07-05`): its day and time on the tenant's clock, both required. */
export function LeadCallBackForm({ form, frame }: FormOf<'callBack'>) {
  const [date, setDate] = useState<ISODate | null>(null);
  const [time, setTime] = useState('');
  return (
    <View style={styles.form}>
      <DatePicker
        words={frame.fields.date}
        label={form.words.date}
        min={form.firstDay}
        {...(date === null ? {} : { value: date })}
        onChange={(value) => setDate(dayOf(value))}
        disabled={frame.pending}
      />
      <TimeField
        words={frame.fields.time}
        label={form.words.time}
        value={time}
        onCommit={setTime}
        disabled={frame.pending}
      />
      <LeadActSend
        label={form.words.send}
        ready={date !== null && time !== ''}
        pending={frame.pending}
        failure={frame.failure}
        onSend={() => {
          if (date !== null && time !== '') form.onSend({ date, time });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
});
