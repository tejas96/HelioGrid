import { Text } from '../../primitives/Text/Text';
import { ActivityGlyph } from '../ActivityStream/ActivityGlyph';
import { IconButton } from '../IconButton/IconButton';
import type { NotificationHeadProps } from './NotificationCard.types';

/** The centre's head on the web: the count, and Mark all read at the line's right end. */
export function NotificationHead({
  count,
  markAllName,
  onMarkAll,
  marking = false,
}: NotificationHeadProps) {
  return (
    <div className="hg-notification-head">
      <Text variant="body-sm" bold className="hg-notification-head-count">
        {count}
      </Text>
      {markAllName === undefined ? null : (
        <IconButton
          label={markAllName}
          size={44}
          variant="surface"
          onClick={marking ? undefined : onMarkAll}
        >
          <ActivityGlyph name="check-check" size={20} />
        </IconButton>
      )}
    </div>
  );
}
