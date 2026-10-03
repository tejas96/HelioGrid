import type { CentreDay, CentreNotification, CentreRow } from '@heliogrid/domain';
import { isAnnouncement } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import {
  centreDayLabel,
  groupSentence,
  NOTIFICATION_CENTRE,
  notificationCardName,
} from './notifications';

/** A notification as the list words it: its record's own title and body (`F6-08`). */
type Worded = CentreNotification & { readonly title: string; readonly body: string };

/** The market's formatters the words need — `useFormat()`'s, on the tenant's clock. */
export interface CentreClock {
  clockAt(value: string): string;
  date(value: string): string;
  weekday(value: string): string;
}

/**
 * The list's words, chosen once for both apps (`SCR-SHELL-03`): each day's overline and each
 * row's card, group or announcement. The screens add only what a tap does.
 */
export function centreListWords<T extends Worded>(
  translate: Translator['t'],
  days: readonly CentreDay<T>[],
  clock: CentreClock,
) {
  return days.map((day) => {
    /* The day's own items name its date: a bare calendar date would be read at UTC midnight. */
    const first = firstItem(day.rows[0]);
    const at = first?.emittedAt ?? day.date;
    const label = centreDayLabel(translate, {
      daysAgo: day.daysAgo,
      date: clock.date(at),
      weekday: clock.weekday(at),
    });
    return { date: day.date, label, rows: day.rows.map((row) => rowWords(translate, row, clock)) };
  });
}

function rowWords<T extends Worded>(
  translate: Translator['t'],
  row: CentreRow<T>,
  clock: CentreClock,
) {
  if (row.kind === 'group') {
    const [latest] = row.members;
    const count = row.members.length;
    return {
      kind: 'group' as const,
      key: row.key,
      type: latest.type,
      sentence: groupSentence(translate, latest.type, count),
      latest: translate(NOTIFICATION_CENTRE.latest, { time: clock.clockAt(latest.emittedAt) }),
      unreadLabel:
        row.unread === 0
          ? undefined
          : translate(NOTIFICATION_CENTRE.groupUnread, { count: row.unread }),
      showLabel: translate(NOTIFICATION_CENTRE.showGroup, { count }),
      hideLabel: translate(NOTIFICATION_CENTRE.hideGroup, { count }),
      members: row.members.map((member) => memberWords(translate, member, clock)),
    };
  }
  const { item } = row;
  const time = clock.clockAt(item.emittedAt);
  const { title, body } = item;
  if (isAnnouncement(item.type)) {
    const overline = translate(NOTIFICATION_CENTRE.announcement);
    const name = notificationCardName(translate, { title, body, time, unread: false });
    return { kind: 'announcement' as const, item, overline, title, body, time, name };
  }
  const unread = item.readAt === null;
  return {
    kind: 'card' as const,
    item,
    type: item.type,
    title,
    body,
    time,
    unreadLabel: unread ? translate(NOTIFICATION_CENTRE.unread) : undefined,
    name: notificationCardName(translate, { title, body, time, unread }),
  };
}

function memberWords<T extends Worded>(translate: Translator['t'], member: T, clock: CentreClock) {
  const time = clock.clockAt(member.emittedAt);
  const { title, body } = member;
  const unread = member.readAt === null;
  return {
    item: member,
    id: member.id,
    title,
    line: translate(NOTIFICATION_CENTRE.memberLine, { time, body }),
    unreadLabel: unread ? translate(NOTIFICATION_CENTRE.unread) : undefined,
    name: notificationCardName(translate, { title, body, time, unread }),
  };
}

function firstItem<T extends Worded>(row: CentreRow<T> | undefined): T | undefined {
  if (row === undefined) return undefined;
  return row.kind === 'group' ? row.members[0] : row.item;
}
