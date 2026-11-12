import { COMPANY_PROFILE_FIELD_CAP, PERSON_NAME_CAP } from '@heliogrid/domain';
import { useState } from 'react';
import { Input } from '../Input';
import type { FormFrame } from './LeadActForms';
import { ActSend } from './LeadActParts';
import type { LeadActForm } from './LeadActSheet.types';

type DetailsForm = Extract<LeadActForm, { kind: 'details' }>;

/**
 * The lead's own details (`M02-03`): its name and city, the gaps a capture left, filled as the
 * customer gives them. An emptied field goes back to its named gap; only a changed field is
 * sent, each within its limit.
 */
export function LeadDetailsForm({ form, pending, failure }: FormFrame & { form: DetailsForm }) {
  const { words, start } = form;
  const [name, setName] = useState(start.name ?? '');
  const [city, setCity] = useState(start.city ?? '');
  const draft = { name: name.trim() || null, city: city.trim() || null };
  const changed = {
    ...(draft.name === start.name ? {} : { name: draft.name }),
    ...(draft.city === start.city ? {} : { city: draft.city }),
  };
  return (
    <>
      <Input
        label={words.name}
        value={name}
        maxLength={PERSON_NAME_CAP}
        onChange={setName}
        disabled={pending}
      />
      <Input
        label={words.city}
        value={city}
        maxLength={COMPANY_PROFILE_FIELD_CAP.city}
        onChange={setCity}
        disabled={pending}
      />
      <ActSend
        label={words.send}
        ready={Object.keys(changed).length > 0}
        pending={pending}
        failure={failure}
        onSend={() => form.onSend(changed)}
      />
    </>
  );
}
