import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ActivityGlyph } from '../ActivityStream/ActivityGlyph.native';
import { IconButton } from '../IconButton/IconButton.native';
import type { NotificationHeadProps } from './NotificationCard.types';

/** The centre's head on the phone: the count, and Mark all read at the line's right end. */
export function NotificationHead({
  count,
  markAllName,
  onMarkAll,
  marking = false,
}: NotificationHeadProps) {
  return (
    <View style={styles.head}>
      <View style={styles.count}>
        <Text variant="body-sm" bold>
          {count}
        </Text>
      </View>
      {markAllName === undefined ? null : (
        <IconButton
          label={markAllName}
          size={44}
          variant="surface"
          onClick={marking ? undefined : onMarkAll}
        >
          <ActivityGlyph name="check-check" size={20} color={theme.colors['text-primary']} />
        </IconButton>
      )}
    </View>
  );
}

/* The board's m-default: one row, 12 between the count and the button, 8 under it. */
const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-2'],
  },
  count: { flex: 1, minWidth: 0 },
});
