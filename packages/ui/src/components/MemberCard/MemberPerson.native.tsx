import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { Text } from '../../primitives/Text/Text.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Badge } from '../Chip/Chip.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import type { MemberPersonProps } from './MemberCard.types';

const styles = StyleSheet.create({
  person: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'], minWidth: 0 },
  who: { alignItems: 'flex-start', gap: theme.spacing['sp-1'], minWidth: 0, flexShrink: 1 },
  name: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: theme.spacing['sp-6'],
  },
});

/** A person in the team table's first cell (`SCR-M01-12`, `d-default`). */
export function MemberPerson({ name, youLabel, status, tone }: MemberPersonProps) {
  return (
    <View style={styles.person}>
      <Avatar name={name} size={40} />
      <View style={styles.who}>
        <View style={styles.name}>
          <Text variant="body" bold>
            {name}
          </Text>
          {youLabel === undefined ? null : (
            <Badge tone="accent" density="functional">
              {youLabel}
            </Badge>
          )}
        </View>
        <StatusChip label={status} tone={tone} density="functional" />
      </View>
    </View>
  );
}
