import type { TranslatedText } from '@heliogrid/contracts';

/**
 * A line this package put together from words its translator already gave and facts beside them —
 * a spec line's figures after its kind, a list's names around the language's *and*. Only a copy
 * module calls it, and never on English it typed itself: that is a message (`F3-07`). Not exported
 * from the package, so nothing outside `packages/i18n` mints words this way.
 */
export function assembled(line: string): TranslatedText {
  return line as TranslatedText;
}

/**
 * An answer the catalog holds no words for — the api's own message for a code this package does not
 * name, or a form refusal `validation.ts`'s map left to zod — shown as sent: `F3-05`'s fallback, the
 * one way English reaches a reader on purpose.
 */
export function shownAsSent(message: string): TranslatedText;
export function shownAsSent(message: string | undefined): TranslatedText | undefined;
export function shownAsSent(message: string | undefined): TranslatedText | undefined {
  return message as TranslatedText | undefined;
}

/** No words: a slot that draws nothing — a member never seen has no *last active* line. */
export const NO_WORDS = '' as TranslatedText;

/** A language's name in itself (`F3-03`): read the same in every language, so never translated. */
export function namedInItself(endonym: string): TranslatedText {
  return endonym as TranslatedText;
}
