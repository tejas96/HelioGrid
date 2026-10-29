import type { TranslatedText } from '@heliogrid/contracts';
import type { TeamRow, TeamRowStatus } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { NO_WORDS } from './assembled';

/**
 * The Team screen's words (`SCR-M01-12`), chosen once for both apps (Law 11). A row's words come
 * from its facts; the screens add only where each one sits.
 */
export const TEAM = {
  find: /*i18n*/ { id: 'Find in this list' },
  statusFilter: /*i18n*/ { id: 'Status' },
  all: /*i18n*/ { id: 'All' },
  you: /*i18n*/ { id: 'You' },
  loading: /*i18n*/ { id: 'Loading your team' },
  loadFailed: /*i18n*/ { id: 'The team list didn’t load' },
  alone: /*i18n*/ { id: 'It’s just you so far' },
  aloneLine: /*i18n*/ { id: 'Invite the people who sell, survey, design and install.' },
  clearSearch: /*i18n*/ { id: 'Clear search' },
  showAll: /*i18n*/ { id: 'Show all' },
  noMatch: /*i18n*/ { id: 'No one matches “{query}”' },
  everyone: /*i18n*/ { id: 'Everyone at {company}' },
  everyoneMatching: /*i18n*/ { id: 'Everyone at {company} matching {query}' },
  headCount: /*i18n*/ {
    id: '{people, plural, one {# person} other {# people}} · {invites, plural, one {# invite} other {# invites}}',
  },
  person: /*i18n*/ { id: 'Person' },
  roles: /*i18n*/ { id: 'Roles' },
  lastActive: /*i18n*/ { id: 'Last active' },
} as const;

/** A row's status in words — the Status chips and each row show them side by side (`F3-12`). */
export const TEAM_STATUS_WORD: Record<TeamRowStatus, { id: string }> = {
  invited: /*i18n*/ { id: 'Invited' },
  expired: /*i18n*/ { id: 'Expired' },
  active: /*i18n*/ { id: 'Active' },
  deactivated: /*i18n*/ { id: 'Deactivated' },
};

/** What a Status chip with nobody under it says, under that chip (owner ruling, `SCR-M01-12`). */
export const TEAM_EMPTY_CHIP: Record<TeamRowStatus, { id: string }> = {
  invited: /*i18n*/ { id: 'No open invites' },
  expired: /*i18n*/ { id: 'No expired invites' },
  active: /*i18n*/ { id: 'No one active' },
  deactivated: /*i18n*/ { id: 'No one deactivated' },
};

const ROW = {
  day: /*i18n*/ { id: 'Day {day} of {days}' },
  expires: /*i18n*/ { id: 'Expires {date}' },
  expired: /*i18n*/ { id: 'Expired {date}' },
  activeSeen: /*i18n*/ { id: 'Active · last seen {date}' },
  activeSeenToday: /*i18n*/ { id: 'Active · last seen today' },
  deactivatedSeen: /*i18n*/ { id: 'Deactivated · last seen {date}' },
  deactivatedSeenToday: /*i18n*/ { id: 'Deactivated · last seen today' },
  today: /*i18n*/ { id: 'Today, {time}' },
  dated: /*i18n*/ { id: '{date}, {time}' },
} as const;

/** The market's formatters the words need — `useFormat()`'s, on the tenant's clock. */
export interface TeamClock {
  dayMonth(value: string): string;
  clockAt(value: string): string;
  isToday(value: string): boolean;
}

export interface TeamRowWords {
  readonly status: TranslatedText;
  /** The phone card's line under the name. */
  readonly line: TranslatedText;
  /** An open invite's day of seven and its expiry, on the phone card; null otherwise. */
  readonly day: TranslatedText | null;
  readonly expires: TranslatedText | null;
  /** The 1536 table's last cell; empty for a member never seen. */
  readonly lastActive: TranslatedText;
}

export function teamStatusWord(translate: Translator['t'], status: TeamRowStatus): TranslatedText {
  return translate(TEAM_STATUS_WORD[status]);
}

function seenLine(translate: Translator['t'], row: TeamRow, clock: TeamClock): TranslatedText {
  const active = row.status === 'active';
  if (row.lastActiveAt === null) return teamStatusWord(translate, row.status);
  if (clock.isToday(row.lastActiveAt)) {
    return translate(active ? ROW.activeSeenToday : ROW.deactivatedSeenToday);
  }
  const date = clock.dayMonth(row.lastActiveAt);
  return translate(active ? ROW.activeSeen : ROW.deactivatedSeen, { date });
}

function memberLastActive(translate: Translator['t'], at: string | null, clock: TeamClock) {
  if (at === null) return NO_WORDS;
  const time = clock.clockAt(at);
  return clock.isToday(at)
    ? translate(ROW.today, { time })
    : translate(ROW.dated, { date: clock.dayMonth(at), time });
}

/** One row's words: the phone's line and invite bar, the table's last cell (`SCR-M01-12`). */
export function teamRowWords(
  translate: Translator['t'],
  row: TeamRow,
  clock: TeamClock,
  inviteDays: number,
): TeamRowWords {
  const status = teamStatusWord(translate, row.status);
  if (row.expiresAt !== null) {
    const date = clock.dayMonth(row.expiresAt);
    const open = row.status === 'invited';
    const expires = translate(open ? ROW.expires : ROW.expired, { date });
    return {
      status,
      line: open ? status : expires,
      day:
        row.inviteDay === null
          ? null
          : translate(ROW.day, { day: row.inviteDay, days: inviteDays }),
      expires: open ? expires : null,
      lastActive: expires,
    };
  }
  return {
    status,
    line: seenLine(translate, row, clock),
    day: null,
    expires: null,
    lastActive: memberLastActive(translate, row.lastActiveAt, clock),
  };
}
