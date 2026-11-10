import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Select } from '../Select/Select.native';
import { Switch } from '../Switch/Switch.native';
import { LeadContactRowView } from './LeadContactRow.native';
import type { LeadContactsCardProps } from './LeadContactsCard.types';

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
  words,
}: LeadContactsCardProps) {
  return (
    <View style={styles.stack}>
      <View style={[tileSurface, styles.card]}>
        <GroundProvider ground="tile">
          <View style={styles.head}>
            <Text variant="overline" color="secondary" style={styles.title}>
              {words.title(contacts.length)}
            </Text>
            <IconButton label={words.add} onClick={onAdd} variant="ghost">
              <ShellGlyph name="person-plus" size="md" tone="primary" />
            </IconButton>
          </View>
          {contacts.map((contact) => (
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
        </GroundProvider>
      </View>
      <View style={styles.facts}>
        <View style={[tileSurface, styles.fact]}>
          <GroundProvider ground="tile">
            <Switch
              label={words.doNotCall}
              description={words.doNotCallHint}
              checked={doNotCall.value}
              onChange={(on) => doNotCall.onChange(on)}
              disabled={doNotCall.pending}
            />
          </GroundProvider>
        </View>
        <View style={[tileSurface, styles.fact]}>
          <GroundProvider ground="tile">
            <Select
              label={words.language}
              placeholder={words.languageUnset}
              closeLabel={words.close}
              value={language.value ?? UNSET}
              options={[{ value: UNSET, label: words.languageUnset }, ...language.options]}
              onChange={(value) => language.onChange(value === UNSET ? null : value)}
              disabled={language.pending}
            />
          </GroundProvider>
        </View>
      </View>
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: theme.spacing['sp-3'] },
  card: {
    gap: theme.spacing['sp-1'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  title: { flex: 1 },
  facts: { gap: theme.spacing['sp-3'] },
  fact: {
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
});
