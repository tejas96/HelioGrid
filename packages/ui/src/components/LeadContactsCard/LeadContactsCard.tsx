import { useState } from 'react';
import { StatusMark } from '../../primitives/StatusMark';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Card } from '../Card';
import { FoldHead } from '../FoldHead';
import { IconButton } from '../IconButton';
import { NamedGap } from '../NamedGap';
import { PendingAction } from '../PendingAction';
import { Select } from '../Select';
import { Switch } from '../Switch';
import type { LeadContactRow, LeadContactsCardProps } from './LeadContactsCard.types';

/**
 * The customer's contacts and calling facts (`M02-34`, `M02-37`): each person with their role or
 * the primary mark, their number in mono and a call act; add, edit and make primary; then the
 * do-not-call switch and the preferred language, each its own small tile.
 */
export function LeadContactsCard({
  contacts,
  onAdd,
  onEdit,
  onMakePrimary,
  primaryPending,
  onDial,
  doNotCall,
  language,
  failure,
  foldable,
  words,
}: LeadContactsCardProps) {
  const [open, setOpen] = useState(!foldable);
  const shown = open ? contacts : contacts.filter((contact) => contact.primary);
  return (
    <div className="hg-lead-contacts">
      <Card className="hg-lead-contacts-card">
        <div className="hg-lead-contacts-head">
          {foldable ? (
            <span className="hg-lead-contacts-fold">
              <FoldHead
                title={words.title(contacts.length)}
                open={open}
                onToggle={() => setOpen(!open)}
              />
            </span>
          ) : (
            <span className="hg-lead-contacts-title">
              <Text variant="h3">{words.title(contacts.length)}</Text>
            </span>
          )}
          <IconButton label={words.add} variant="ghost" onClick={onAdd}>
            <ShellGlyph name="user-plus" size="md" tone="primary" />
          </IconButton>
        </div>
        {shown.map((contact) => (
          <ContactRow
            key={contact.id ?? 'customer'}
            contact={contact}
            onEdit={onEdit}
            onMakePrimary={onMakePrimary}
            primaryPending={primaryPending}
            onDial={onDial}
            words={words}
          />
        ))}
        {failure === null ? null : (
          <p className="hg-lead-contacts-failure" role="alert">
            {failure}
          </p>
        )}
      </Card>
      {open ? (
        <div className="hg-lead-contacts-facts">
          <Card className="hg-lead-contacts-fact" density="functional">
            <Switch
              label={words.doNotCall}
              description={words.doNotCallHint}
              checked={doNotCall.value}
              disabled={doNotCall.pending}
              onChange={doNotCall.onChange}
            />
          </Card>
          <Card className="hg-lead-contacts-fact" density="functional">
            <Select
              label={words.language}
              placeholder={words.languageUnset}
              closeLabel={words.close}
              density="functional"
              disabled={language.pending}
              value={language.value ?? ''}
              options={[{ value: '', label: words.languageUnset }, ...language.options]}
              onChange={(value) => language.onChange(value === '' ? null : value)}
            />
          </Card>
        </div>
      ) : null}
    </div>
  );
}

interface ContactRowProps
  extends Pick<
    LeadContactsCardProps,
    'onEdit' | 'onMakePrimary' | 'primaryPending' | 'onDial' | 'words'
  > {
  contact: LeadContactRow;
}

function ContactRow({
  contact,
  onEdit,
  onMakePrimary,
  primaryPending,
  onDial,
  words,
}: ContactRowProps) {
  const who = contact.name ?? contact.phone;
  const naming = primaryPending !== undefined;
  return (
    <div className="hg-lead-contact" aria-busy={primaryPending === contact.id ? true : undefined}>
      <Avatar name={contact.name ?? undefined} size={40} />
      <div className="hg-lead-contact-words">
        <span className="hg-lead-contact-name">
          {contact.name === null ? <NamedGap gap={words.noName} scale="cell" /> : contact.name}
        </span>
        <span className="hg-lead-contact-line">
          {contact.primary ? <StatusMark tone="success" label={words.primary} /> : null}
          {!contact.primary && contact.role !== null ? <span>{contact.role}</span> : null}
          <span className="hg-lead-contact-phone">{contact.phone}</span>
        </span>
        {primaryPending === contact.id ? <PendingAction label={words.makingPrimary} /> : null}
      </div>
      <div className="hg-lead-contact-acts">
        {contact.primary ? null : (
          <IconButton
            label={words.makePrimary(who)}
            variant="ghost"
            disabled={naming}
            onClick={() => onMakePrimary(contact.id)}
          >
            <ShellGlyph name="star" size="md" tone="secondary" />
          </IconButton>
        )}
        {contact.id === null ? null : (
          <IconButton
            label={words.edit(who)}
            variant="ghost"
            onClick={() => {
              if (contact.id !== null) onEdit(contact.id);
            }}
          >
            <ShellGlyph name="pencil" size="md" tone="secondary" />
          </IconButton>
        )}
        {contact.dial ? (
          <IconButton
            label={words.call(who)}
            variant="ghost"
            onClick={() => onDial(contact.phoneE164)}
          >
            <ShellGlyph name="phone" size="md" tone="primary" />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}
