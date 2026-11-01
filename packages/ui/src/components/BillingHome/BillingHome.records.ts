import type { BillingHistory, BillingReminders, TranslatedText } from '@heliogrid/contracts';
import type { BillingState } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { BillingTimelineItem } from './BillingHome.parts.types';

/**
 * The two timelines' entries (decision 13). A notice reads as its own title, and a reminder a
 * payment cleared is followed by that payment; the ladder's next notice leads, as upcoming.
 */
export function reminderItemsOf(
  reminders: readonly BillingReminders['items'][number][],
  upcoming: BillingReminders['next'],
  words: {
    readonly noticeTitle: (notice: string) => TranslatedText;
    readonly paymentReceived: TranslatedText;
    readonly next: TranslatedText;
  },
  format: MarketFormat,
): BillingTimelineItem[] {
  const next: BillingTimelineItem[] =
    upcoming === null
      ? []
      : [
          {
            id: `next-${upcoming.dueAt}`,
            label: words.noticeTitle(upcoming.notice),
            meta: format.date(upcoming.dueAt),
            description: words.next,
            status: 'upcoming',
            figure: null,
          },
        ];
  const told = reminders.flatMap((reminder): BillingTimelineItem[] => [
    ...(reminder.paidAt === null
      ? []
      : [
          {
            id: `paid-${reminder.id}`,
            label: words.paymentReceived,
            meta: format.date(reminder.paidAt),
            description: null,
            status: 'done' as const,
            figure: null,
          },
        ]),
    {
      id: reminder.id,
      label: words.noticeTitle(reminder.notice),
      meta: format.date(reminder.firedAt),
      description: null,
      status: 'done',
      figure: null,
    },
  ]);
  return [...next, ...told];
}

/** Every state entered, newest first, with why — the current state marked as current. */
export function historyItemsOf(
  entries: readonly BillingHistory['items'][number][],
  words: {
    readonly stateWord: (state: BillingState) => TranslatedText;
    readonly cause: (cause: string) => TranslatedText;
  },
  format: MarketFormat,
): BillingTimelineItem[] {
  return entries.map((entry, index) => ({
    id: entry.id,
    label: words.stateWord(entry.state),
    meta: format.date(entry.enteredAt),
    description: words.cause(entry.cause),
    status: index === 0 ? 'current' : 'done',
    figure: null,
  }));
}
