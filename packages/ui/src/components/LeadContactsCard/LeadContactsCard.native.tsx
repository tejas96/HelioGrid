import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Card } from '../Card/Card.native';
import { CardHeader } from '../Card/CardHeader.native';
import { FoldHead } from '../FoldHead/FoldHead.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Select } from '../Select/Select.native';
import { Switch } from '../Switch/Switch.native';
import { LeadContactRowView } from './LeadContactRow.native';
import type { LeadContactsCardProps } from './LeadContactsCard.types';

// web-only parts: Avatar, NamedGap, PendingAction, StatusMark — each contact row is its child LeadContactRow.native.

/** The language field's "not set" choice: the one value no language has. */
const UNSET = '';

/**
 * The customer's contacts and calling facts on the phone (`M02-34`, `M02-37`), above the history:
 * each person with their role and the one primary, a call act for every number that may be called,
 * add and edit; then the do-not-call switch and the preferred language, each saved as it changes.
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
    <View style={styles.stack}>
      <Card>
        <View>
          {foldable ? (
            <View style={styles.head}>
              <View style={styles.title}>
                <FoldHead
                  title={words.title(contacts.length)}
                  open={open}
                  onToggle={() => setOpen(!open)}
                />
              </View>
              <IconButton label={words.add} onClick={onAdd} variant="ghost">
                <ShellGlyph name="user-plus" size="md" tone="primary" />
              </IconButton>
            </View>
          ) : (
            <CardHeader
              title={words.title(contacts.length)}
              action={
                <IconButton label={words.add} onClick={onAdd} variant="ghost">
                  <ShellGlyph name="user-plus" size="md" tone="primary" />
                </IconButton>
              }
            />
          )}
          {shown.map((contact) => (
            <LeadContactRowView
              key={contact.id ?? contact.phoneE164}
              contact={contact}
              onEdit={onEdit}
              onMakePrimary={onMakePrimary}
              primaryPending={primaryPending}
              onDial={onDial}
              words={words}
            />
          ))}
        </View>
      </Card>
      {open ? (
        <View style={styles.facts}>
          <Card density="functional">
            <Switch
              label={words.doNotCall}
              description={words.doNotCallHint}
              checked={doNotCall.value}
              onChange={(on) => doNotCall.onChange(on)}
              disabled={doNotCall.pending}
            />
          </Card>
          <Card density="functional">
            <Select
              density="functional"
              label={words.language}
              placeholder={words.languageUnset}
              closeLabel={words.close}
              value={language.value ?? UNSET}
              options={[{ value: UNSET, label: words.languageUnset }, ...language.options]}
              onChange={(value) => language.onChange(value === UNSET ? null : value)}
              disabled={language.pending || language.locked}
            />
          </Card>
        </View>
      ) : null}
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: theme.layout['tile-gap'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  title: { flex: 1 },
  facts: { gap: theme.layout['tile-gap'] },
});
