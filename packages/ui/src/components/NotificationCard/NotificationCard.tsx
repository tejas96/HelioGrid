import type { ReactNode } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ActivityGlyph } from '../ActivityStream/ActivityGlyph';
import { Button } from '../Button/Button';
import { Badge } from '../Chip/Chip';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote';
import { LogoTile } from '../Wordmark/Wordmark';
import { notificationGlyph } from './NotificationCard.logic';
import type {
  NotificationAnnouncementProps,
  NotificationCardProps,
  NotificationLandingProps,
} from './NotificationCard.types';

/**
 * One notification (`SCR-SHELL-03`): its mark, the record's sentence and body, when, and whether
 * it is read. The face is a sibling button under the content, as `RecordCard`'s is, so an act in
 * the foot is a real control of its own and a tap on it never opens the card too.
 */
export function NotificationCard({
  type,
  title,
  body,
  time,
  unreadLabel,
  name,
  onOpen,
  act,
  sideAct,
}: NotificationCardProps) {
  return (
    <article className="hg-notification-card">
      <Face name={name} onOpen={onOpen} />
      <div className="hg-notification-top">
        <span className="hg-notification-glyph" aria-hidden="true">
          <ActivityGlyph name={notificationGlyph(type)} size={20} />
          {unreadLabel === undefined ? null : <span className="hg-notification-dot" />}
        </span>
        <Words title={title} body={body}>
          <Meta time={time} unreadLabel={unreadLabel} />
        </Words>
        {sideAct ? <span className="hg-notification-side">{sideAct}</span> : null}
      </div>
      {act ? <div className="hg-notification-foot">{act}</div> : null}
    </article>
  );
}

/** Product news (`F6.4`): the product's tile where a glyph would be, and who speaks, named. */
export function NotificationAnnouncement({
  overline,
  title,
  body,
  time,
  name,
  onOpen,
  act,
}: NotificationAnnouncementProps) {
  return (
    <article className="hg-notification-card">
      <Face name={name} onOpen={onOpen} />
      <div className="hg-notification-top">
        <span className="hg-notification-logo" aria-hidden="true">
          <LogoTile size={32} />
        </span>
        <Words title={title} body={body} overline={overline} />
      </div>
      <div className="hg-notification-foot" data-spread="true">
        <Text variant="mono" color="secondary" className="hg-notification-time">
          {time}
        </Text>
        {act}
      </div>
    </article>
  );
}

/** The honest landing (`F6-16`'s edge): the subject is out of reach, and the way back. */
export function NotificationLanding({
  title,
  message,
  backLabel,
  onBack,
}: NotificationLandingProps) {
  return (
    <div className="hg-notification-landing">
      <UnavailableNote variant="note" title={title} message={message} />
      <div className="hg-notification-landing-back">
        <Button variant="secondary" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
      </div>
    </div>
  );
}

/** The whole face as one control, drawn only when a tap does something. */
export function Face({ name, onOpen }: { name: string; onOpen?: () => void }) {
  if (onOpen === undefined) return null;
  return (
    <button type="button" className="hg-notification-face" onClick={onOpen} aria-label={name} />
  );
}

function Words({
  title,
  body,
  overline,
  children,
}: {
  title: string;
  body: string;
  overline?: string;
  children?: ReactNode;
}) {
  return (
    <div className="hg-notification-words">
      {overline === undefined ? null : (
        <Text variant="overline" color="secondary">
          {overline}
        </Text>
      )}
      <div className="hg-notification-sentence">
        <Text variant="body" bold className="hg-notification-title">
          {title}
        </Text>
        <Text variant="body-sm" color="secondary">
          {body}
        </Text>
      </div>
      {children}
    </div>
  );
}

export function Meta({ time, unreadLabel }: { time: string; unreadLabel?: string }) {
  return (
    <div className="hg-notification-meta">
      <Text variant="mono" color="secondary" className="hg-notification-time">
        {time}
      </Text>
      {unreadLabel === undefined ? null : <Badge tone="accent">{unreadLabel}</Badge>}
    </div>
  );
}
