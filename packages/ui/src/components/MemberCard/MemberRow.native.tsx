import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { Text } from '../../primitives/Text/Text.native';
import { Avatar } from '../Avatar/Avatar.native';
import { CardRow, useCardRowAsideRoom } from '../CardRows/CardRows.native';
import { Badge } from '../Chip/Chip.native';
import { ProgressBar } from '../ProgressBar/ProgressBar.native';
import type { MemberInvite, MemberRowProps } from './MemberCard.types';

function InviteDays({ invite }: { invite: MemberInvite }) {
  return (
    <View style={styles.invite}>
      <ProgressBar value={invite.progress} />
      <View style={styles.inviteWords}>
        <Text variant="body-sm" color="secondary">
          {invite.day}
        </Text>
        <Text variant="body-sm">{invite.expires}</Text>
      </View>
    </View>
  );
}

/**
 * A person on the team, one row of the list's glass card (direction A): the face with its status
 * dot, the name with *You*, the status line, every preset held as a badge, an open invite's day of
 * seven — and the row's one act at its top end, outside the open target (`CardRow`).
 */
export function MemberRow({
  name,
  mark,
  youLabel,
  line,
  roles,
  invite,
  action,
  onOpen,
  first,
}: MemberRowProps) {
  return (
    <CardRow
      first={first}
      open={onOpen === undefined ? undefined : { name, onOpen }}
      aside={action}
    >
      <Lead>
        <Avatar name={name} size={FACE} mark={mark} />
        <View style={styles.words}>
          <View style={styles.title}>
            <Text variant="body" bold>
              {name}
            </Text>
            {youLabel === undefined ? null : (
              <Badge tone="accent" density="functional">
                {youLabel}
              </Badge>
            )}
          </View>
          <Text variant="body-sm" color="secondary">
            {line}
          </Text>
        </View>
      </Lead>
      {roles.length === 0 && invite === undefined ? null : (
        <View style={styles.under}>
          {roles.length === 0 ? null : (
            <View style={styles.roles}>
              {roles.map((role) => (
                <Badge key={role.label} tone={role.tone} density="functional">
                  {role.label}
                </Badge>
              ))}
            </View>
          )}
          {invite === undefined ? null : <InviteDays invite={invite} />}
        </View>
      )}
    </CardRow>
  );
}

/** The face's size; what sits under the first line starts past it, under the words. */
const FACE = 40;

/** The face and the words, kept clear of the row's act at its end. */
function Lead({ children }: { children: ReactNode }) {
  return <View style={[styles.lead, { paddingEnd: useCardRowAsideRoom() }]}>{children}</View>;
}

const styles = StyleSheet.create({
  lead: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  /* The roles and an invite's days run under the words and the act, to the row's end. */
  under: { gap: theme.spacing['sp-2'], marginStart: FACE + theme.spacing['sp-3'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  roles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: theme.spacing['sp-2'],
    rowGap: theme.spacing['sp-1'],
  },
  invite: { gap: theme.spacing['sp-3'] / 2 },
  inviteWords: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
});
