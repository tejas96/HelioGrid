/**
 * `ActivityStream`'s own words (`packages/ui`'s `ActivityStreamWords`): its loading name, the
 * count line, *Show more*, *Clear filters*, the default kinds' names and the actor filter's hint —
 * authored once, in three languages (`F3-07`). `ACTIVITY_STREAM` holds the words
 * the stream said before a caller named its own.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { TEMPLATE } from './proposal-template';
import { SHELL } from './shell';

export const ACTIVITY_STREAM = {
  countLabel: /*i18n*/ { id: 'entries' },
  today: /*i18n*/ { id: 'Today' },
  yesterday: /*i18n*/ { id: 'Yesterday' },
  emptyTitle: /*i18n*/ { id: 'No activity yet' },
  emptyDescription: /*i18n*/ {
    id: 'Notes, calls, stage changes and payments all land here as they happen.',
  },
  filteredEmptyTitle: /*i18n*/ { id: 'Nothing matches these filters' },
  filteredEmptyDescription: /*i18n*/ {
    id: 'There is activity on this record — none of it is of the kinds you have picked.',
  },
  errorTitle: /*i18n*/ { id: "Couldn't load the activity" },
  errorMessage: SHELL.keepsFailing,
  unavailableTitle: /*i18n*/ { id: 'No activity is kept here' },
  /** The filter's two dimensions, named. */
  kindLabel: /*i18n*/ { id: 'Kind' },
  actorLabel: /*i18n*/ { id: 'Who' },
} as const;

const STREAM = {
  loading: /*i18n*/ { id: 'Loading activity' },
  clearFilters: /*i18n*/ { id: 'Clear filters' },
  loadingMore: /*i18n*/ { id: 'Loading…' },
  showMore: /*i18n*/ { id: 'Show {count} more' },
  count: /*i18n*/ { id: '{total} {noun}' },
  countOf: /*i18n*/ { id: '{shown} of {total} {noun}' },
  countOfMatching: /*i18n*/ { id: '{shown} of {total} {noun} match these filters' },
  actorHint: /*i18n*/ {
    id: 'The agent and the system are different actors, and so is the customer.',
  },
} as const;

/** The default registry's kinds (`SCR-M02-04`'s thirteen, with dunning and reversal). */
const KIND: Readonly<Record<string, { id: string }>> = {
  note: /*i18n*/ { id: 'Note' },
  call: /*i18n*/ { id: 'Call' },
  'agent-call': /*i18n*/ { id: 'Agent call' },
  stage: /*i18n*/ { id: 'Stage change' },
  assignment: /*i18n*/ { id: 'Assignment' },
  proposal: TEMPLATE.proposal,
  'link-open': /*i18n*/ { id: 'Link opened' },
  survey: /*i18n*/ { id: 'Survey' },
  design: /*i18n*/ { id: 'Design' },
  'sign-off': /*i18n*/ { id: 'Sign-off' },
  payment: /*i18n*/ { id: 'Payment' },
  document: TEMPLATE.document,
  task: /*i18n*/ { id: 'Task' },
  system: /*i18n*/ { id: 'System' },
  dunning: /*i18n*/ { id: 'Dunning' },
  reversal: /*i18n*/ { id: 'Reversal' },
};

/**
 * A kind no registry names: its code with the dashes as spaces and a capital, shown as sent
 * (`F3-05`) until the screen that owns the kind names it.
 */
function unnamedKind(kind: string): TranslatedText {
  const words = kind.replace(/[-_]/g, ' ');
  return shownAsSent(words.charAt(0).toUpperCase() + words.slice(1));
}

/**
 * Every word `ActivityStream` draws or speaks of its own, in the reader's language — with the
 * actor line's words, `actorClassWords(t)`, handed in.
 */
export function activityStreamWords<ActorWords>(t: Translator['t'], actor: ActorWords) {
  return {
    loading: t(STREAM.loading),
    clearFilters: t(STREAM.clearFilters),
    loadingMore: t(STREAM.loadingMore),
    showMore: (count: number) => t(STREAM.showMore, { count }),
    count: (total: string, noun: string) => t(STREAM.count, { total, noun }),
    countOf: (shown: string, total: string, noun: string, filtered: boolean) =>
      t(filtered ? STREAM.countOfMatching : STREAM.countOf, { shown, total, noun }),
    kind: (kind: string) => {
      const named = KIND[kind];
      return named === undefined ? unnamedKind(kind) : t(named);
    },
    actor,
    actorHint: t(STREAM.actorHint),
  };
}
