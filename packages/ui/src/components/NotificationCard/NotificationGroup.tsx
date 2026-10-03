import { Text } from '../../primitives/Text/Text';
import { ActivityGlyph } from '../ActivityStream/ActivityGlyph';
import { Button } from '../Button/Button';
import { Badge } from '../Chip/Chip';
import { Face, Meta } from './NotificationCard';
import { notificationGlyph } from './NotificationCard.logic';
import type { NotificationGroupProps, NotificationMemberProps } from './NotificationCard.types';

/**
 * Two or more of one type on one day (`F6-12`). The group card is not a link: grouping is
 * presentation only, so it has no subject of its own. Opened, its members stack under it at full
 * width, each its own record and its own link — nesting reads from position, never an indent.
 */
export function NotificationGroup({
  type,
  sentence,
  latest,
  unreadLabel,
  open,
  onToggle,
  toggleLabel,
  members,
}: NotificationGroupProps) {
  return (
    <div className="hg-notification-group">
      <article className="hg-notification-card">
        <div className="hg-notification-top">
          <span className="hg-notification-glyph" aria-hidden="true">
            <ActivityGlyph name={notificationGlyph(type)} size={20} />
            {unreadLabel === undefined ? null : <span className="hg-notification-dot" />}
          </span>
          <div className="hg-notification-words">
            <Text variant="body" bold className="hg-notification-title">
              {sentence}
            </Text>
            <Meta time={latest} unreadLabel={unreadLabel} />
          </div>
        </div>
        <div className="hg-notification-foot">
          <Button variant="secondary" size="sm" fullWidth expanded={open} onClick={onToggle}>
            {toggleLabel}
          </Button>
        </div>
      </article>
      {open ? (
        <div className="hg-notification-members">
          {members.map((member) => (
            <Member key={member.id} {...member} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Member({ title, line, unreadLabel, name, onOpen, sideAct }: NotificationMemberProps) {
  return (
    <div className="hg-notification-member">
      <Face name={name} onOpen={onOpen} />
      <div className="hg-notification-member-words">
        <Text variant="body-sm" bold className="hg-notification-title">
          {title}
        </Text>
        <div className="hg-notification-member-line">
          <Text variant="caption" color="secondary" className="hg-notification-member-detail">
            {line}
          </Text>
          {unreadLabel === undefined ? null : <Badge tone="accent">{unreadLabel}</Badge>}
        </div>
      </div>
      {sideAct ? <span className="hg-notification-side">{sideAct}</span> : null}
    </div>
  );
}
