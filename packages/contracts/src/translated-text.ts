/**
 * Words the product says, already in the reader's language (`F3-07`). Every copy prop on a
 * `packages/ui` `.types.ts` takes this instead of `string`, so English typed into a component — a
 * literal, a template literal or a default — fails to compile.
 *
 * Declared here because `packages/ui` may import contracts and not i18n; minted ONLY by
 * `packages/i18n`'s translator. Plugin `brand-cast-i18n` refuses a cast to it anywhere else.
 * A fact — a name a person typed, a number, an id — is not product copy and stays `string`.
 */
declare const TRANSLATED: unique symbol;

export type TranslatedText = string & { readonly [TRANSLATED]: 'words' };
