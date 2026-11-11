import { COMPANY_PROFILE_FIELD_CAP, PERSON_NAME_CAP } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from '../Input/Input.native';
import { LeadActSend, type LeadFormFrame } from './LeadActSend.native';
import type { LeadActForm } from './LeadActSheet.types';

type DetailsForm = Extract<LeadActForm, { kind: 'details' }>;

/**
 * The lead's own details (`M02-03`) on the phone: its name and city, the gaps a capture left,
 * filled as the customer gives them. An emptied field goes back to its named gap.
 */
export function LeadDetailsForm({ form, frame }: { form: DetailsForm; frame: LeadFormFrame }) {
  const { words, start } = form;
  const [name, setName] = useState(start.name ?? '');
  const [city, setCity] = useState(start.city ?? '');
  const draft = { name: name.trim() || null, city: city.trim() || null };
  const changed = {
    ...(draft.name === start.name ? {} : { name: draft.name }),
    ...(draft.city === start.city ? {} : { city: draft.city }),
  };
  return (
    <View style={styles.form}>
      <Input
        label={words.name}
        value={name}
        maxLength={PERSON_NAME_CAP}
        onChange={setName}
        disabled={frame.pending}
      />
      <Input
        label={words.city}
        value={city}
        maxLength={COMPANY_PROFILE_FIELD_CAP.city}
        onChange={setCity}
        disabled={frame.pending}
      />
      <LeadActSend
        label={words.send}
        ready={Object.keys(changed).length > 0}
        pending={frame.pending}
        failure={frame.failure}
        onSend={() => form.onSend(changed)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
});
