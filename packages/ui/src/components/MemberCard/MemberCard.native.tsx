import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { Text } from '../../primitives/Text/Text.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Badge } from '../Chip/Chip.native';
import { RecordCard } from '../NextAction/RecordCard.native';
import { ProgressBar } from '../ProgressBar/ProgressBar.native';
import type { MemberCardProps, MemberInvite } from './MemberCard.types';

const styles = StyleSheet.create({
  invite: { gap: theme.spacing['sp-3'] / 2 },
  words: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing['sp-3'] },
});

function InviteDays({ invite }: { invite: MemberInvite }) {
  return (
    <View style={styles.invite}>
      <ProgressBar value={invite.progress} />
      <View style={styles.words}>
        <Text variant="body-sm" color="secondary">
          {invite.day}
        </Text>
        <Text variant="body-sm">{invite.expires}</Text>
      </View>
    </View>
  );
}

/** A person on the team, on a phone (`SCR-M01-12`): a stacked `RecordCard`. */
export function MemberCard({
  name,
  mark,
  youLabel,
  line,
  roles,
  invite,
  action,
  onOpen,
}: MemberCardProps) {
  return (
    <RecordCard
      layout="stacked"
      name={name}
      avatar={<Avatar name={name} size={48} mark={mark} />}
      badge={
        youLabel === undefined ? undefined : (
          <Badge tone="accent" density="functional">
            {youLabel}
          </Badge>
        )
      }
      line={line}
      marks={roles.map((role) => (
        <Badge key={role.label} tone={role.tone} density="functional">
          {role.label}
        </Badge>
      ))}
      detail={invite === undefined ? undefined : <InviteDays invite={invite} />}
      action={action}
      onClick={onOpen}
    />
  );
}
