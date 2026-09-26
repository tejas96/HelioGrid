import { UI_LANGUAGES } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import {
  CLOSED_VOCABULARY_GROUPS,
  membersReadAsOneWord,
  readerForm,
} from '../src/copy/closed-vocabularies';
import { createTranslator, type MessageRef } from '../src/runtime';

/**
 * `F3-12` — a closed vocabulary keeps its English identity and translates its display, and no
 * translation may merge two members into one word. "One word" is decided as a reader sees it.
 */
describe('closed vocabularies (F3-12)', () => {
  it.each([
    { language: 'en', a: 'Measured', b: 'measured' },
    { language: 'en', a: 'Measured', b: '  Measured ' },
    { language: 'hi', a: 'मान लिया गया', b: 'मान  लिया गया' },
    { language: 'hi', a: 'मान लिया गया', b: 'मान\u00a0लिया गया' },
    { language: 'mr', a: '\u0931', b: 'र\u093c' },
    { language: 'hi', a: '\u0958', b: 'क\u093c' },
    { language: 'mr', a: 'र्\u200dयाचे', b: 'र्याचे' },
    { language: 'hi', a: 'अनुमानित', b: 'अनु\u200bमानित' },
    { language: 'hi', a: 'अनुमानित', b: 'अनु\u00adमानित' },
  ] as const)('two words a reader cannot tell apart are one word', ({ language, a, b }) => {
    expect(readerForm(language, a)).toBe(readerForm(language, b));
  });

  it.each([
    { language: 'en', a: 'Measured', b: 'Derived' },
    { language: 'hi', a: 'अनुमानित', b: 'अस्थायी' },
    { language: 'mr', a: 'अंदाजित', b: 'अंदाजे' },
  ] as const)('two words a reader tells apart stay two words', ({ language, a, b }) => {
    expect(readerForm(language, a)).not.toBe(readerForm(language, b));
  });

  /* A stand-in translator that shows each message's English id, so a made-up group's words are
     exactly the ids written below. */
  const showId = (message: string | MessageRef) =>
    typeof message === 'string' ? message : message.id;
  const words = (...ids: string[]) =>
    Object.fromEntries(ids.map((id, i) => [String.fromCharCode(97 + i), { id }]));

  it.each([
    { tier: words('One', 'Two'), clashes: [] },
    { tier: words('Same', 'same '), clashes: [['tier.a', 'tier.b']] },
    {
      tier: words('Same', 'Same', 'Same'),
      clashes: [
        ['tier.a', 'tier.b'],
        ['tier.a', 'tier.c'],
      ],
    },
  ])('names both members of every clash', ({ tier, clashes }) => {
    const group = { surface: 'made up', vocabularies: { tier } };
    expect(membersReadAsOneWord('en', showId, group)).toEqual(clashes);
  });

  it("compares a group's words across all its vocabularies", () => {
    const group = {
      surface: 'made up',
      vocabularies: { tier: words('Same'), standing: words('Same') },
    };
    expect(membersReadAsOneWord('en', showId, group)).toEqual([['tier.a', 'standing.a']]);
  });

  it.each(UI_LANGUAGES)(
    'every closed vocabulary shows each member in its own words, in every language',
    async (language) => {
      const { t } = await createTranslator(language);
      for (const group of CLOSED_VOCABULARY_GROUPS) {
        const sameWord = membersReadAsOneWord(language, t, group);
        expect(sameWord, `${language} · ${group.surface}`).toEqual([]);
      }
    },
  );
});
