import type { NotificationType, NotificationTypeGroup } from '@heliogrid/domain';
import { NOTIFICATION_CENTRE_HORIZON_DAYS } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { SHELL } from './shell';

/**
 * Every word the notification centre shows (`SCR-SHELL-03`), authored once for both platforms in
 * three languages. The board's frames are the source. A notification's own title and body are
 * NOT here: they were rendered at emit, in the reader's language then (`F6-08`), and are shown as
 * they were stored.
 */
export const NOTIFICATION_CENTRE = {
  title: SHELL.notifications,
  bellName: /*i18n*/ {
    id: '{count, plural, =0 {Notifications} one {Notifications, # unread} other {Notifications, # unread}}',
  },
  headUnread: /*i18n*/ { id: '{unread} unread · {total} in the last {days} days' },
  headNothingUnread: /*i18n*/ { id: 'Nothing unread · {total} in the last {days} days' },
  headMatch: /*i18n*/ { id: '{match} match · {unread} unread in all' },
  headSource: /*i18n*/ { id: 'Counted from the records, never from push' },
  groupSource: /*i18n*/ { id: 'Counted from the records' },
  markAllRead: /*i18n*/ { id: 'Mark all read' },
  markAllReadName: /*i18n*/ {
    id: '{count, plural, one {Mark the # unread notification read} other {Mark all # unread notifications read}}',
  },
  filtersInForce: /*i18n*/ { id: 'Filters in force: {filters}' },
  clearFilters: /*i18n*/ { id: 'Clear filters' },
  clearFiltersName: /*i18n*/ { id: 'Clear the read-state and type-group filters' },
  readState: /*i18n*/ { id: 'Read state' },
  all: /*i18n*/ { id: 'All' },
  unread: /*i18n*/ { id: 'Unread' },
  typeGroup: /*i18n*/ { id: 'Type group' },
  today: SHELL.today,
  yesterday: /*i18n*/ { id: 'Yesterday · {date}' },
  earlierDay: /*i18n*/ { id: '{weekday} · {date}' },
  latest: /*i18n*/ { id: '{time} latest' },
  groupUnread: /*i18n*/ { id: '{count} unread' },
  showGroup: /*i18n*/ { id: 'Show these {count}' },
  hideGroup: /*i18n*/ { id: 'Hide these {count}' },
  announcement: /*i18n*/ { id: 'From HelioGrid · product news' },
  showOlder: /*i18n*/ { id: 'Show older' },
  showOlderMatches: /*i18n*/ { id: 'Show older matches' },
  horizon: /*i18n*/ {
    id: 'The centre keeps the last {days} days. It is an inbox, not an archive — each of these facts also lives on its own record’s timeline, for good.',
  },
  markedRead: /*i18n*/ { id: '{count} marked read' },
  nothingDeleted: /*i18n*/ { id: 'Nothing was deleted — every notification is still in the list.' },
  emptyTitle: /*i18n*/ { id: 'Nothing has reached you yet' },
  emptyMessage: /*i18n*/ {
    id: 'Anything that needs you, or changes on work you hold, lands here — newest first, with the one thing you can do about it.',
  },
  goToLeads: /*i18n*/ { id: 'Go to your leads' },
  errorTitle: /*i18n*/ { id: 'Couldn’t load your notifications' },
  errorMessage: SHELL.keepsFailing,
  tryAgain: SHELL.tryAgain,
  landingTitle: /*i18n*/ { id: 'Not available here' },
  landing: /*i18n*/ {
    id: 'This record is no longer in your scope, or was removed. The notification stays here because it reached you.',
  },
  backToList: /*i18n*/ { id: 'Back to the list' },
  cardName: /*i18n*/ { id: '{title}. {body}. {time}.' },
  unreadCardName: /*i18n*/ { id: 'Unread. {title}. {body}. {time}.' },
} as const;

/** The five type groups' names (`F6-15`, `F6-17`) — the filter's chips and its "in force" line. */
export const TYPE_GROUP_NAME: Record<NotificationTypeGroup, MessageRef> = {
  sales: /*i18n*/ { id: 'Sales' },
  delivery: /*i18n*/ { id: 'Delivery' },
  payments: /*i18n*/ { id: 'Payments' },
  team: /*i18n*/ { id: 'Team' },
  billing: /*i18n*/ { id: 'Billing' },
};

/**
 * What a group says it holds (`F6-12`: "3 proposals opened"). The day it happened is the section
 * above it, so the sentence carries no day. An immediate type never groups; its line exists
 * because every type is written out.
 */
const GROUP_SENTENCE: Record<NotificationType, MessageRef> = {
  proposal_opened: /*i18n*/ {
    id: '{count, plural, one {# proposal opened} other {# proposals opened}}',
  },
  agent_escalation: /*i18n*/ {
    id: '{count, plural, one {# call handed to you} other {# calls handed to you}}',
  },
  follow_up_due: /*i18n*/ {
    id: '{count, plural, one {# follow-up due} other {# follow-ups due}}',
  },
  survey_submitted: /*i18n*/ {
    id: '{count, plural, one {# survey submitted} other {# surveys submitted}}',
  },
  design_returned: /*i18n*/ {
    id: '{count, plural, one {# design returned} other {# designs returned}}',
  },
  signoff_requested: /*i18n*/ {
    id: '{count, plural, one {# sign-off requested} other {# sign-offs requested}}',
  },
  payment_due: /*i18n*/ { id: '{count, plural, one {# payment due} other {# payments due}}' },
  lead_unassigned_24h: /*i18n*/ {
    id: '{count, plural, one {# lead unassigned for a day} other {# leads unassigned for a day}}',
  },
  system: /*i18n*/ {
    id: '{count, plural, one {# product update} other {# product updates}}',
  },
};

const ANY_GROUP: MessageRef = /*i18n*/ {
  id: '{count, plural, one {# notification} other {# notifications}}',
};

/** A group's sentence; a type this build does not know still reads as a count of notifications. */
export function groupSentence(translate: Translator['t'], type: string, count: number): string {
  const sentence = (GROUP_SENTENCE as Record<string, MessageRef | undefined>)[type] ?? ANY_GROUP;
  return translate(sentence, { count });
}

/**
 * The head's count line (`F6-17`, `F6-19`). Under a filter it names the matches and every unread
 * the bell counts; otherwise the unread and everything inside the horizon.
 */
export function centreHeadLine(
  translate: Translator['t'],
  facts: { filtered: boolean; match: number; unread: number; total: number },
): string {
  const days = NOTIFICATION_CENTRE_HORIZON_DAYS;
  if (facts.filtered) {
    return translate(NOTIFICATION_CENTRE.headMatch, { match: facts.match, unread: facts.unread });
  }
  if (facts.unread === 0) {
    return translate(NOTIFICATION_CENTRE.headNothingUnread, { total: facts.total, days });
  }
  return translate(NOTIFICATION_CENTRE.headUnread, {
    unread: facts.unread,
    total: facts.total,
    days,
  });
}

/** A day's overline: today and yesterday by word, any earlier day by its name; `date` formatted. */
export function centreDayLabel(
  translate: Translator['t'],
  day: { daysAgo: number; date: string; weekday: string },
): string {
  if (day.daysAgo === 0) return translate(NOTIFICATION_CENTRE.today, { date: day.date });
  if (day.daysAgo === 1) return translate(NOTIFICATION_CENTRE.yesterday, { date: day.date });
  return translate(NOTIFICATION_CENTRE.earlierDay, { weekday: day.weekday, date: day.date });
}

/** "Filters in force: Unread · Sales, Delivery" — the read state first, then the groups. */
export function filtersInForce(
  translate: Translator['t'],
  filters: { unreadOnly: boolean; groups: readonly NotificationTypeGroup[] },
): string {
  const groups = filters.groups.map((group) => translate(TYPE_GROUP_NAME[group])).join(', ');
  const parts = [filters.unreadOnly ? translate(NOTIFICATION_CENTRE.unread) : '', groups];
  return translate(NOTIFICATION_CENTRE.filtersInForce, {
    filters: parts.filter((part) => part !== '').join(' · '),
  });
}

/** The horizon sentence, its number read from the one constant the reads are bounded by. */
export function centreHorizonLine(translate: Translator['t']): string {
  return translate(NOTIFICATION_CENTRE.horizon, { days: NOTIFICATION_CENTRE_HORIZON_DAYS });
}

/** A card's whole-face name: the sentence a screen reader hears, unread first when it is. */
export function notificationCardName(
  translate: Translator['t'],
  card: { title: string; body: string; time: string; unread: boolean },
): string {
  const { title, body, time } = card;
  const name = card.unread ? NOTIFICATION_CENTRE.unreadCardName : NOTIFICATION_CENTRE.cardName;
  return translate(name, { title, body, time });
}
