import type { TranslatedText } from '@heliogrid/contracts';
/**
 * Lists joined with the reader's *and* — authored once for every sentence that names several
 * things (the role card's presets, Assign Roles' clauses). Hermes ships no list formatter, so the
 * joiner is a message each language writes (`presetLine`, `shell.ts`).
 */

import type { Translator } from '../runtime';
import { assembled } from './assembled';

export const LIST_JOIN = {
  twoAnd: /*i18n*/ { id: '{first} and {second}' },
  listAnd: /*i18n*/ { id: '{list} and {last}' },
};

/** A run of a sentence: plain, or marked strong — never markup, so both platforms draw it. */
export interface TextPart {
  readonly text: string;
  readonly strong: boolean;
}

export function joinAnd(translate: Translator['t'], names: readonly string[]): TranslatedText {
  return assembled(
    joinParts(
      translate,
      names.map((text) => ({ text, strong: false })),
    )
      .map((part) => part.text)
      .join(''),
  );
}

/** Each item kept whole, with the language's joining words between them as plain parts. */
export function joinParts(
  translate: Translator['t'],
  items: readonly TextPart[],
): readonly TextPart[] {
  if (items.length <= 1) return items;
  const slot = items.map((_, index) => slotMark(index));
  const joined =
    items.length === 2
      ? translate(LIST_JOIN.twoAnd, { first: slot[0], second: slot[1] })
      : translate(LIST_JOIN.listAnd, {
          list: slot.slice(0, -1).join(', '),
          last: slot[slot.length - 1],
        });
  return fillSlots(
    joined,
    items.map((item) => [item]),
  );
}

/**
 * A translated template with each slot replaced by its parts. A slot is a private-use character
 * no translation contains, so a translator may move it anywhere in the sentence.
 */
export function fillSlots(
  template: string,
  slots: readonly (readonly TextPart[])[],
): readonly TextPart[] {
  const parts: TextPart[] = [];
  let plain = '';
  for (const char of template) {
    const filled = slots[slotIndex(char) ?? -1];
    if (filled === undefined) {
      plain += char;
      continue;
    }
    if (plain !== '') parts.push({ text: plain, strong: false });
    plain = '';
    parts.push(...filled);
  }
  if (plain !== '') parts.push({ text: plain, strong: false });
  return parts;
}

const FIRST_SLOT = 0xe000;

export function slotMark(index: number): string {
  return String.fromCodePoint(FIRST_SLOT + index);
}

function slotIndex(char: string): number | null {
  const point = char.codePointAt(0) ?? 0;
  return point >= FIRST_SLOT && point < FIRST_SLOT + 0x100 ? point - FIRST_SLOT : null;
}
