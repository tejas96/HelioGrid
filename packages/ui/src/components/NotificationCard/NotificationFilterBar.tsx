import { nextOpenGroup } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ActivityGlyph } from '../ActivityStream/ActivityGlyph';
import { groupGlyph } from './NotificationCard.logic';
import type { NotificationFilterBarProps } from './NotificationCard.types';

/** The centre's filter bar on the web: icon buttons whose name slides out when switched on. */
export function NotificationFilterBar({
  label,
  unread,
  unreadOn,
  onUnread,
  groups,
  openGroup,
  onGroup,
}: NotificationFilterBarProps) {
  return (
    <div className="hg-notification-filters">
      <div role="toolbar" aria-label={label} className="hg-notification-filter-row">
        <FilterButton
          label={unread.label}
          name={unread.name}
          on={unreadOn}
          onPress={() => onUnread(!unreadOn)}
        >
          <span className="hg-notification-filter-dot" />
        </FilterButton>
        <span aria-hidden="true" className="hg-notification-filter-rule" />
        {groups.map((group) => (
          <FilterButton
            key={group.value}
            label={group.label}
            name={group.label}
            on={openGroup === group.value}
            onPress={() => onGroup(nextOpenGroup(openGroup, group.value))}
          >
            <ActivityGlyph name={groupGlyph(group.value)} size={18} />
          </FilterButton>
        ))}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  name: string;
  on: boolean;
  onPress: () => void;
  children: ReactNode;
}

/** On, it is a dark pill with its name; off, a 44 circle with its icon — styled from aria-pressed. */
function FilterButton({ label, name, on, onPress, children }: FilterButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected: on }}
      className="hg-notification-filter"
      onPress={onPress}
    >
      <span className="hg-notification-filter-icon" aria-hidden="true">
        {children}
      </span>
      <span className="hg-notification-filter-label" aria-hidden="true">
        {label}
      </span>
    </Pressable>
  );
}
