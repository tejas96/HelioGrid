import { phoneDigitsMismatch } from '@heliogrid/domain';
import { useEffect, useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { LoadingBars } from '../LoadingBars';
import { useFormat } from '../MarketProvider';
import { PhoneField } from '../PhoneField';
import { Select } from '../Select';
import type { FormFrame } from './LeadActForms';
import { ActSend } from './LeadActParts';
import type { LeadActForm, LeadPhoneTaken } from './LeadActSheet.types';

type ContactForm = Extract<LeadActForm, { kind: 'contact' }>;

/**
 * A contact (`M02-34`): name, number and role label — a seeded one, the company's own, or one
 * added here. A number another customer holds comes back with that record's three facts and the
 * way to Merge; nothing was saved.
 */
export function LeadContactForm({
  form,
  pending,
  failure,
  fields,
}: FormFrame & { form: ContactForm }) {
  const { words, start } = form;
  const { pack } = useFormat();
  const [name, setName] = useState(start?.name ?? '');
  const [phone, setPhone] = useState(start?.phoneE164 ?? '');
  const [roleLabelId, setRoleLabelId] = useState(start?.roleLabelId ?? '');
  const [newRole, setNewRole] = useState('');
  const { addedLabelId } = form;
  useEffect(() => {
    if (addedLabelId === null) return;
    setRoleLabelId(addedLabelId);
    setNewRole('');
  }, [addedLabelId]);
  const typed = name.trim();
  const ready = typed !== '' && phone !== '' && phoneDigitsMismatch(pack, phone) === null;
  return (
    <>
      <Input label={words.name} value={name} onChange={setName} disabled={pending} />
      <PhoneField
        label={words.phone}
        words={fields.phone}
        value={phone}
        onChange={setPhone}
        disabled={pending}
      />
      <Roles form={form} value={roleLabelId} onChange={setRoleLabelId} disabled={pending} />
      <div className="hg-lead-act-new-role">
        <Input
          label={words.newRole}
          value={newRole}
          onChange={setNewRole}
          disabled={pending || form.addingLabel}
        />
        <Button
          variant="secondary"
          size="md"
          disabled={newRole.trim() === '' || pending}
          loading={form.addingLabel}
          onClick={() => form.onAddLabel(newRole.trim())}
        >
          {words.addRole}
        </Button>
      </div>
      {form.phoneTaken === null ? null : <PhoneTaken taken={form.phoneTaken} words={words} />}
      <ActSend
        label={words.send}
        ready={ready}
        pending={pending}
        failure={failure}
        onSend={() =>
          form.onSend({
            name: typed,
            phoneE164: phone,
            roleLabelId: roleLabelId === '' ? null : roleLabelId,
          })
        }
      />
    </>
  );
}

function Roles({
  form,
  value,
  onChange,
  disabled,
}: {
  form: ContactForm;
  value: string;
  onChange: (labelId: string) => void;
  disabled: boolean;
}) {
  const { words, labels } = form;
  if (labels.read.kind === 'loading') {
    return <LoadingBars label={words.role} bars={['control']} />;
  }
  if (labels.read.kind === 'failed') {
    return (
      <div className="hg-lead-act-read">
        <span className="hg-lead-act-label">{words.labelsFailed}</span>
        <Button variant="secondary" size="sm" onClick={labels.read.retry}>
          {words.retry}
        </Button>
      </div>
    );
  }
  return (
    <Select
      label={words.role}
      placeholder={words.rolePick}
      closeLabel={words.close}
      value={value}
      options={[{ value: '', label: words.noRole }, ...labels.options]}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

/** The record the number already belongs to: its three facts, and Merge when it may be opened. */
function PhoneTaken({ taken, words }: { taken: LeadPhoneTaken; words: ContactForm['words'] }) {
  return (
    <div className="hg-lead-act-taken" role="alert">
      <p className="hg-lead-act-taken-title">{words.takenTitle}</p>
      <p className="hg-lead-act-note">{words.takenLine}</p>
      <dl className="hg-lead-act-facts">
        <div>
          <dt>{words.name}</dt>
          <dd>{taken.name ?? (taken.onMerge === null ? words.outside : words.noName)}</dd>
        </div>
        <div>
          <dt>{words.ownerLabel}</dt>
          <dd>{taken.ownerName ?? words.noOwner}</dd>
        </div>
        <div>
          <dt>{words.stageLabel}</dt>
          <dd>{words.stage(taken.stage)}</dd>
        </div>
        <div>
          <dt>{words.lastContactLabel}</dt>
          <dd>{taken.lastContact}</dd>
        </div>
      </dl>
      {taken.onMerge === null ? null : (
        <Button variant="secondary" size="md" onClick={taken.onMerge}>
          {words.merge}
        </Button>
      )}
    </div>
  );
}
