/**
 * The lead's timeline as `ActivityStream` draws it (`M02-35`, `packages/ui`'s `LeadTimelineWords`):
 * each entry with its actor and its words from `lead-timeline.ts`, the CRM's kinds by name, and the
 * stream's own words for its count, its days and each state of its read.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { ActivityActor } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { ACTIVITY_STREAM, activityStreamWords } from './activity-stream';
import { actorClassWords } from './actor-class';
import { crmVocabularyWords } from './crm-vocabulary';
import {
  type LeadTimelineEntryFacts,
  type LeadTimelineFormats,
  leadTimelineEntryWords,
} from './lead-timeline';
import { SHELL } from './shell';

type T = Translator['t'];

/** One entry as `ActivityStream` draws it (`packages/ui`'s `ActivityEntry`). */
export interface LeadTimelineStreamEntry {
  readonly id: string;
  /** The wire's kind for a known entry; `system` for one a newer server learned. */
  readonly kind: string;
  /** The server's apply moment: the stream is ordered by it, never by a device clock (`F4-19`). */
  readonly at: string;
  readonly actorClass: ActivityActor;
  readonly actor?: string;
  readonly summary: TranslatedText;
  readonly detail?: TranslatedText;
}

/** The timeline as `ActivityStream`'s entries, each with its actor and its words. */
export function leadTimelineStream(
  t: T,
  formats: LeadTimelineFormats,
  entries: readonly LeadTimelineEntryFacts[],
): LeadTimelineStreamEntry[] {
  return entries.map((entry) => {
    const { activity } = entry;
    const words = leadTimelineEntryWords(t, formats, entry);
    return {
      id: activity.id,
      kind: entry.known ? activity.kind : 'system',
      at: activity.appliedAt,
      actorClass: activity.actor.kind,
      ...(activity.actor.name === null ? {} : { actor: activity.actor.name }),
      summary: words.summary,
      ...(words.detail === null ? {} : { detail: words.detail }),
    };
  });
}

/** Every word the Timeline section says: its entries, its kinds and its stream's own. */
export function leadTimelineWords(t: T) {
  return {
    entries: (entries: readonly LeadTimelineEntryFacts[], formats: LeadTimelineFormats) =>
      leadTimelineStream(t, formats, entries),
    kind: crmVocabularyWords(t).activityKind,
    stream: {
      countLabel: t(ACTIVITY_STREAM.countLabel),
      todayLabel: t(ACTIVITY_STREAM.today),
      yesterdayLabel: t(ACTIVITY_STREAM.yesterday),
      emptyTitle: t(ACTIVITY_STREAM.emptyTitle),
      emptyDescription: t(ACTIVITY_STREAM.emptyDescription),
      filteredEmptyTitle: t(ACTIVITY_STREAM.filteredEmptyTitle),
      filteredEmptyDescription: t(ACTIVITY_STREAM.filteredEmptyDescription),
      errorTitle: t(ACTIVITY_STREAM.errorTitle),
      errorMessage: t(ACTIVITY_STREAM.errorMessage),
      retryLabel: t(SHELL.tryAgain),
      unavailableTitle: t(ACTIVITY_STREAM.unavailableTitle),
      words: activityStreamWords(t, actorClassWords(t)),
    },
  };
}
