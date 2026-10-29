/**
 * `Transcript`'s own words (`packages/ui`'s `TranscriptWords`): its loading name, the language
 * sentence and the in-flow switch marker, the count line, each turn's seek name, and the reveal
 * control — authored once, in three languages (`F3-07`). `TRANSCRIPT` holds the words
 * the transcript said before a caller named its own.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';
import { joinAnd } from './list-join';

export const TRANSCRIPT = {
  title: /*i18n*/ { id: 'Transcript' },
  emptyTitle: /*i18n*/ { id: 'No transcript for this call' },
  emptyDescription: /*i18n*/ {
    id: "The call connected but nothing was transcribed. The recording and the rep's notes are on this record.",
  },
  errorMessage: /*i18n*/ { id: "Couldn't load the transcript. Nothing has been lost — try again." },
  unavailableTitle: /*i18n*/ { id: 'No transcript on this call' },
  unavailableMessage: /*i18n*/ {
    id: 'This call was not transcribed. The recording is the only record of it.',
  },
} as const;

const WORDS = {
  loading: /*i18n*/ { id: 'Loading the transcript' },
  languageNotRecorded: /*i18n*/ { id: 'Language not recorded' },
  inLanguage: /*i18n*/ { id: 'In {language}' },
  switchedFrom: /*i18n*/ { id: 'In {language}, switched to {switches}' },
  switchAt: /*i18n*/ { id: '{language} at {time}' },
  thenSwitch: /*i18n*/ { id: '{earlier}, then {later}' },
  switchedTo: /*i18n*/ { id: 'Switched to {language}' },
  switchedToAt: /*i18n*/ { id: 'Switched to {language} · {time}' },
  turns: /*i18n*/ { id: '{count, plural, one {# turn} other {# turns}}' },
  turnsBy: /*i18n*/ { id: '{count, plural, one {# turn} other {# turns}} · {names}' },
  agentTurn: /*i18n*/ { id: 'Agent turn' },
  customerTurn: /*i18n*/ { id: 'Customer turn' },
  playFrom: /*i18n*/ { id: 'Play the call from {offset}, {turn}' },
  loadingMore: /*i18n*/ { id: 'Loading…' },
  showRest: /*i18n*/ { id: 'Show the rest of the call · {count} more' },
  showMore: /*i18n*/ { id: 'Show more of the call' },
} as const;

/** A mid-call change of language, as the transcript knows it: where to, and when (`m:ss`). */
interface SpokenSwitch {
  readonly to: string;
  readonly at: string | null;
}

/** "In Hindi" — or, when the call changed language, every change in the order it happened. */
function languageLine(
  t: Translator['t'],
  language: string,
  switches: readonly SpokenSwitch[],
): TranslatedText {
  if (switches.length === 0) return t(WORDS.inLanguage, { language });
  const changes = switches.map((change) =>
    change.at === null ? change.to : t(WORDS.switchAt, { language: change.to, time: change.at }),
  );
  const joined = changes.reduce((earlier, later) => t(WORDS.thenSwitch, { earlier, later }));
  return t(WORDS.switchedFrom, { language, switches: joined });
}

/**
 * Every word `Transcript` draws or speaks of its own, in the reader's language — with the speakers'
 * words, `actorClassWords(t)`, handed in.
 */
export function transcriptWords<ActorWords>(t: Translator['t'], actor: ActorWords) {
  return {
    loading: t(WORDS.loading),
    languageNotRecorded: t(WORDS.languageNotRecorded),
    language: (language: string, switches: readonly SpokenSwitch[]) =>
      languageLine(t, language, switches),
    switchedTo: (language: string, time: string | null) =>
      time === null ? t(WORDS.switchedTo, { language }) : t(WORDS.switchedToAt, { language, time }),
    count: (count: number, names: readonly string[]) =>
      names.length === 0
        ? t(WORDS.turns, { count })
        : t(WORDS.turnsBy, { count, names: joinAnd(t, names) }),
    actor,
    turn: { agent: t(WORDS.agentTurn), customer: t(WORDS.customerTurn) },
    playFrom: (offset: string, turn: string) => t(WORDS.playFrom, { offset, turn }),
    loadingMore: t(WORDS.loadingMore),
    showRest: (count: number) => t(WORDS.showRest, { count }),
    showMore: t(WORDS.showMore),
  };
}
