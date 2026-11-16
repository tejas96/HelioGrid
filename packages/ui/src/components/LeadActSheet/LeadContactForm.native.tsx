import { PERSON_NAME_CAP, phoneDigitsMismatch } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { Input } from '../Input/Input.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider/market-context';
import { PhoneField } from '../PhoneField/PhoneField.native';
import { Select } from '../Select/Select.native';
import { LeadActSend, type LeadFormFrame } from './LeadActSend.native';
import type { LeadActForm } from './LeadActSheet.types';
import { LeadPhoneTakenNote } from './LeadPhoneTaken.native';
import { firstMissing } from './missing-field';

type ContactForm = Extract<LeadActForm, { kind: 'contact' }>;

/** The role field's "no role" choice: the one value no label has. */
const NO_ROLE = '';

/**
 * A contact (`M02-34`): name, number and role label — the company's own added in place — saved
 * onto this customer. A number another customer holds comes back with that record's three facts,
 * pointing to Merge (`M02-02`); nothing was saved.
 */
export function LeadContactForm({ form, frame }: { form: ContactForm; frame: LeadFormFrame }) {
  const { words, start, labels } = form;
  const [name, setName] = useState(start?.name ?? '');
  const [phoneE164, setPhoneE164] = useState(start?.phoneE164 ?? '');
  const [roleLabelId, setRoleLabelId] = useState(start?.roleLabelId ?? NO_ROLE);
  const [newRole, setNewRole] = useState('');
  /* A label just added is the one picked: the person added it to use it. */
  useEffect(() => {
    if (form.addedLabelId !== null) {
      setRoleLabelId(form.addedLabelId);
      setNewRole('');
    }
  }, [form.addedLabelId]);
  const { pack } = useFormat();
  const typed = name.trim();
  const waitingFor = firstMissing(frame.fields.needs, [
    [typed === '', words.name],
    [phoneE164 === '' || phoneDigitsMismatch(pack, phoneE164) !== null, words.phone],
  ]);
  const ready = waitingFor === null;
  return (
    <View style={styles.form}>
      <Input
        label={words.name}
        value={name}
        onChange={setName}
        disabled={frame.pending}
        maxLength={PERSON_NAME_CAP}
      />
      <PhoneField
        label={words.phone}
        words={frame.fields.phone}
        value={phoneE164}
        onChange={setPhoneE164}
        disabled={frame.pending}
      />
      {labels.read.kind === 'ready' || labels.read.kind === 'empty' ? (
        <Select
          label={words.role}
          placeholder={words.rolePick}
          closeLabel={words.close}
          options={[{ value: NO_ROLE, label: words.noRole }, ...labels.options]}
          value={roleLabelId}
          onChange={setRoleLabelId}
          disabled={frame.pending}
        />
      ) : labels.read.kind === 'failed' ? (
        <View style={styles.state}>
          <Text variant="body-sm" color="danger">
            {words.labelsFailed}
          </Text>
          <Button variant="secondary" size="sm" onClick={labels.read.retry}>
            {words.retry}
          </Button>
        </View>
      ) : (
        <LoadingBars label={words.role} bars={['control']} />
      )}
      <View style={styles.newRole}>
        <View style={styles.newRoleField}>
          <Input
            label={words.newRole}
            value={newRole}
            onChange={setNewRole}
            disabled={frame.pending || form.addingLabel}
          />
        </View>
        <Button
          variant="secondary"
          size="md"
          disabled={newRole.trim() === ''}
          loading={form.addingLabel}
          onClick={() => {
            if (newRole.trim() !== '') form.onAddLabel(newRole.trim());
          }}
        >
          {words.addRole}
        </Button>
      </View>
      {form.phoneTaken === null ? null : (
        <LeadPhoneTakenNote taken={form.phoneTaken} words={words} />
      )}
      <LeadActSend
        label={words.send}
        ready={ready}
        waitingFor={waitingFor}
        pending={frame.pending}
        failure={frame.failure}
        onSend={() => {
          if (ready) {
            form.onSend({
              name: typed,
              phoneE164,
              roleLabelId: roleLabelId === NO_ROLE ? null : roleLabelId,
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  state: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  newRole: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing['sp-2'] },
  newRoleField: { flex: 1, minWidth: 0 },
});
