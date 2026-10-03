import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { notificationRowKey, useOpenGroups } from './NotificationCard.logic';
import { NotificationAnnouncement, NotificationCard } from './NotificationCard.native';
import type { NotificationListProps, NotificationListRow } from './NotificationCard.types';
import { NotificationGroup } from './NotificationGroup.native';

/**
 * The centre's list: each day and its rows, then Show older or the horizon (`F6-19`). Pages load
 * by Show older, never by scrolling, so the rows render inside the sheet's own scroll rather than a
 * second scrolling list within it.
 */
export function NotificationList<T extends { id: string }>({
  days,
  onOpen,
  olderLabel,
  onShowOlder,
  loadingOlder = false,
  olderFailed,
  horizon,
}: NotificationListProps<T>) {
  const groups = useOpenGroups();
  return (
    <View style={styles.list}>
      {days.map((day) => (
        <View key={day.date} style={styles.day}>
          <Text variant="overline" color="tertiary">
            {day.label}
          </Text>
          {day.rows.map((row) => (
            <Row
              key={notificationRowKey(row)}
              row={row}
              open={row.kind === 'group' && groups.isOpen(row.key)}
              onToggle={groups.toggle}
              onOpen={onOpen}
            />
          ))}
        </View>
      ))}
      <View style={styles.tail}>
        {olderLabel === undefined ? (
          <Text variant="caption" color="secondary" style={styles.horizon}>
            {horizon}
          </Text>
        ) : (
          <>
            {olderFailed === undefined ? null : (
              <Text variant="caption" color="danger" live style={styles.horizon}>
                {olderFailed}
              </Text>
            )}
            <Button variant="secondary" size="sm" loading={loadingOlder} onClick={onShowOlder}>
              {olderLabel}
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

interface RowProps<T> {
  row: NotificationListRow<T>;
  open: boolean;
  onToggle: (key: string) => void;
  onOpen: (item: T) => void;
}

function Row<T>({ row, open, onToggle, onOpen }: RowProps<T>) {
  if (row.kind === 'announcement') {
    const { item, kind: _announcement, ...words } = row;
    return <NotificationAnnouncement {...words} onOpen={() => onOpen(item)} />;
  }
  if (row.kind === 'card') {
    const { item, kind: _card, ...words } = row;
    return <NotificationCard {...words} onOpen={() => onOpen(item)} />;
  }
  return (
    <NotificationGroup
      type={row.type}
      sentence={row.sentence}
      latest={row.latest}
      unreadLabel={row.unreadLabel}
      open={open}
      onToggle={() => onToggle(row.key)}
      toggleLabel={open ? row.hideLabel : row.showLabel}
      members={row.members.map(({ item, ...member }) => ({
        ...member,
        onOpen: () => onOpen(item),
      }))}
    />
  );
}

/* The board's m-default: days 20 apart, rows 12, the list's foot 24 above the sheet's end. */
const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-5'], paddingBottom: theme.spacing['sp-6'] },
  day: { gap: theme.spacing['sp-3'] },
  tail: { alignItems: 'center', gap: theme.spacing['sp-3'] },
  horizon: { textAlign: 'center' },
});
