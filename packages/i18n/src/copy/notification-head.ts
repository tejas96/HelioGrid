import type {
  MarkAllOutcome,
  NotificationReadFilter,
  NotificationTypeGroup,
} from '@heliogrid/domain';
import { NOTIFICATION_TYPE_GROUPS } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { centreHeadLine, NOTIFICATION_CENTRE, TYPE_GROUP_NAME } from './notifications';

/**
 * The centre's head, as both apps draw it (`SCR-SHELL-03`, `F6-17`): one count line, and Mark all
 * read's name while anything unread is listed — absent otherwise, so the control removes itself
 * (`F4-27`). The count carries no tier: it tallies the reader's own records (`F8-01` ruling).
 */
export function centreHeadWords(
  translate: Translator['t'],
  facts: {
    readState: NotificationReadFilter;
    filtered: boolean;
    match: number;
    /** Every unread record; null while the count is not known. */
    unread: number | null;
    /** The unread rows the list has loaded. */
    unreadListed: number;
    markAllShows: boolean;
  },
) {
  const { filtered, match, unread } = facts;
  return {
    count: centreHeadLine(translate, { filtered, match, unread, total: match }),
    markAllName: facts.markAllShows
      ? translate(NOTIFICATION_CENTRE.markAllReadName, { count: markAllCount(facts) })
      : undefined,
  };
}

/**
 * How many Mark all read will mark, as its name says it: under Unread every match is unread;
 * unfiltered, every unread record; under a type group alone, the unread rows listed.
 */
function markAllCount(facts: {
  readState: NotificationReadFilter;
  filtered: boolean;
  match: number;
  unread: number | null;
  unreadListed: number;
}): number {
  if (facts.readState === 'unread') return facts.match;
  if (!facts.filtered && facts.unread !== null) return facts.unread;
  return facts.unreadListed;
}

/** The filter bar's words: its name, the Unread toggle, and the five type groups in order. */
export function centreFilterWords(translate: Translator['t']) {
  return {
    label: translate(NOTIFICATION_CENTRE.filterBar),
    unread: {
      label: translate(NOTIFICATION_CENTRE.unread),
      name: translate(NOTIFICATION_CENTRE.unreadOnly),
    },
    groups: NOTIFICATION_TYPE_GROUPS.map((value: NotificationTypeGroup) => ({
      value,
      label: translate(TYPE_GROUP_NAME[value]),
    })),
  };
}

/** The toast an act's outcome raises; none when a second press was not sent (`F4-27`, `F6-07`). */
export function centreActToast(
  translate: Translator['t'],
  outcome: MarkAllOutcome | { readonly kind: 'read-failed' },
) {
  if (outcome.kind === 'busy') return null;
  if (outcome.kind === 'marked') {
    return {
      tone: 'success' as const,
      title: translate(NOTIFICATION_CENTRE.markedRead, { count: outcome.count }),
      description: translate(NOTIFICATION_CENTRE.nothingDeleted),
    };
  }
  const title =
    outcome.kind === 'failed' ? NOTIFICATION_CENTRE.markAllFailed : NOTIFICATION_CENTRE.readFailed;
  return {
    tone: 'danger' as const,
    title: translate(title),
    description: translate(NOTIFICATION_CENTRE.nothingChanged),
  };
}
