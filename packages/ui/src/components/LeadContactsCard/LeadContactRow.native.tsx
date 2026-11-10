import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { IconButton } from '../IconButton/IconButton.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import type { LeadContactRow, LeadContactsCardProps } from './LeadContactsCard.types';

interface LeadContactRowProps
  extends Pick<
    LeadContactsCardProps,
    'onEdit' | 'onMakePrimary' | 'primaryPending' | 'onDial' | 'words'
  > {
  readonly contact: LeadContactRow;
}

/**
 * One person to reach: their face, name or its gap, the Primary mark or their role, the number in
 * mono; a call act while the number may be called, *make primary* for any row that is not — inert,
 * with its line, while a primary is being named — and edit for a contact.
 */
export function LeadContactRowView({
  contact,
  onEdit,
  onMakePrimary,
  primaryPending,
  onDial,
  words,
}: LeadContactRowProps) {
  const who = contact.name ?? contact.phone;
  const naming = primaryPending !== undefined;
  return (
    <View style={styles.row}>
      <View style={styles.line}>
        <Avatar name={contact.name ?? undefined} size={40} />
        <View style={styles.words}>
          {contact.name === null ? (
            <NamedGap gap={words.noName} />
          ) : (
            <Text variant="body" bold>
              {contact.name}
            </Text>
          )}
          <View style={styles.meta}>
            {contact.primary ? (
              <StatusMark tone="success" label={words.primary} />
            ) : contact.role === null ? null : (
              <Text variant="body-sm" color="secondary">
                {contact.role}
              </Text>
            )}
            <Text variant="mono" color="secondary">
              {contact.phone}
            </Text>
          </View>
        </View>
        {contact.dial ? (
          <IconButton
            label={words.call(who)}
            variant="ghost"
            onClick={() => onDial(contact.phoneE164)}
          >
            <ShellGlyph name="phone" size="md" tone="primary" />
          </IconButton>
        ) : null}
        {contact.primary ? null : (
          <IconButton
            label={words.makePrimary(who)}
            variant="ghost"
            disabled={naming}
            onClick={() => onMakePrimary(contact.id)}
          >
            <ShellGlyph name="star" size="md" tone="primary" />
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
            <ShellGlyph name="pencil" size="md" tone="primary" />
          </IconButton>
        )}
      </View>
      {primaryPending === contact.id ? <PendingAction label={words.makingPrimary} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: theme.spacing['sp-1'],
    paddingVertical: theme.spacing['sp-2'],
    borderTopWidth: 1,
    borderTopColor: colors['line-soft'],
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
