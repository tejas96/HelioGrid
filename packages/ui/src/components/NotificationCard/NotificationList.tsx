import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { NotificationAnnouncement, NotificationCard } from './NotificationCard';
import { notificationRowKey, useOpenGroups } from './NotificationCard.logic';
import type { NotificationListProps, NotificationListRow } from './NotificationCard.types';
import { NotificationGroup } from './NotificationGroup';

/** The centre's list: each day and its rows, then Show older or the horizon (`F6-19`). */
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
    <div className="hg-notification-list">
      {days.map((day) => (
        <section key={day.date} className="hg-notification-day" aria-label={day.label}>
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
        </section>
      ))}
      <div className="hg-notification-tail">
        {olderLabel === undefined ? (
          <Text variant="caption" color="secondary">
            {horizon}
          </Text>
        ) : (
          <>
            {olderFailed === undefined ? null : (
              <Text variant="caption" color="danger" live>
                {olderFailed}
              </Text>
            )}
            <Button variant="secondary" size="sm" loading={loadingOlder} onClick={onShowOlder}>
              {olderLabel}
            </Button>
          </>
        )}
      </div>
    </div>
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
