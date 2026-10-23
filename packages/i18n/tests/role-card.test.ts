import {
  ROLE_PRESETS,
  type RoleCardNames,
  type RolePreset,
  roleCard,
  type UiLanguage,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { ROLE_CARD, roleCardWords } from '../src/copy/role-card';
import { presetName } from '../src/copy/shell';
import { createTranslator } from '../src/runtime';

const [OWNER, , SALES_EXECUTIVE, SURVEY_ENGINEER, DESIGN_ENGINEER, , FIELD_TECHNICIAN] =
  ROLE_PRESETS;

const BOARD: RoleCardNames = {
  companyName: 'Suryodaya Solar',
  setterName: 'Rajesh Kulkarni',
  owners: { names: ['Rajesh Kulkarni'], more: 0 },
};

async function wordsFor(
  roles: readonly RolePreset[],
  facts: Partial<RoleCardNames> = {},
  reader: UiLanguage = 'en',
) {
  const { t } = await createTranslator(reader);
  return roleCardWords(t, roleCard(roles), { ...BOARD, ...facts });
}

describe('roleCardWords — the board, word for word', () => {
  it('a Sales Executive alone (m-first-run)', async () => {
    const words = await wordsFor([SALES_EXECUTIVE]);
    expect(words.title).toBe('Your role at Suryodaya Solar');
    expect(words.presets).toBe('Sales Executive');
    expect(words.credit).toBe('Last set by Rajesh Kulkarni');
    expect(words.grants.map((line) => line.text)).toEqual([
      'See your own leads and follow-ups',
      'Add and edit leads',
      'Survey a site',
      'Build and edit proposals, discounts included',
      'Send proposals to customers',
      'Mark a lead won or lost',
    ]);
    expect(words.limits.map((line) => line.text)).toEqual([
      'Assign leads to others',
      'Delete leads',
      'Update project stages',
      'Record payments',
      'See reports beyond your own',
      'Change company settings',
    ]);
    expect(words.note).toEqual({
      title: 'Only Rajesh Kulkarni (owner) can add a teammate.',
      message: 'Ask them when you need one.',
    });
    expect(words.act).toBe('Go to my day');
    expect(words.atAct).toBe('Reopen anytime from Profile & preferences.');
    expect(words.surfaceTitle).toBe('Your role');
  });

  it('a stacked pair (m-stacked)', async () => {
    const words = await wordsFor([DESIGN_ENGINEER, SALES_EXECUTIVE]);
    expect(words.title).toBe('Your roles at Suryodaya Solar');
    expect(words.presets).toBe('Sales Executive and Design Engineer');
    expect(words.act).toBe('Go to my day');
    expect(words.atAct).toBe('Your designs are one switch away.');
    expect(words.surfaceTitle).toBe('Your roles');
  });

  it('the error card (m-error) names the setter in full', async () => {
    expect((await wordsFor([SALES_EXECUTIVE])).error).toEqual({
      title: "We couldn't load your role",
      body: 'You are still part of Suryodaya Solar. Try again, or ask Rajesh Kulkarni to check.',
      retry: 'Try again',
    });
  });
});

describe('roleCardWords — what the board does not draw', () => {
  it.each<{ reader: UiLanguage; names: string[]; more: number; title: string }>([
    {
      reader: 'en',
      names: ['Rajesh Kulkarni'],
      more: 0,
      title: 'Only Rajesh Kulkarni (owner) can add a teammate.',
    },
    {
      reader: 'en',
      names: ['Meera Shah', 'Rajesh Kulkarni'],
      more: 0,
      title: 'Only Meera Shah or Rajesh Kulkarni (owners) can add a teammate.',
    },
    {
      reader: 'en',
      names: ['Meera Shah', 'Rajesh Kulkarni'],
      more: 1,
      title: 'Only Meera Shah, Rajesh Kulkarni or 1 more (owners) can add a teammate.',
    },
    {
      reader: 'hi',
      names: ['Rajesh Kulkarni'],
      more: 0,
      title: 'सिर्फ़ Rajesh Kulkarni (मालिक) नया साथी जोड़ सकते हैं।',
    },
    {
      reader: 'hi',
      names: ['Meera Shah', 'Rajesh Kulkarni'],
      more: 0,
      title: 'सिर्फ़ Meera Shah या Rajesh Kulkarni (मालिक) नया साथी जोड़ सकते हैं।',
    },
    {
      reader: 'hi',
      names: ['Meera Shah', 'Rajesh Kulkarni'],
      more: 1,
      title: 'सिर्फ़ Meera Shah, Rajesh Kulkarni या 1 और (मालिक) नया साथी जोड़ सकते हैं।',
    },
    {
      reader: 'mr',
      names: ['Rajesh Kulkarni'],
      more: 0,
      title: 'फक्त Rajesh Kulkarni (मालक) नवीन सहकारी जोडू शकतात.',
    },
    {
      reader: 'mr',
      names: ['Meera Shah', 'Rajesh Kulkarni'],
      more: 0,
      title: 'फक्त Meera Shah किंवा Rajesh Kulkarni (मालक) नवीन सहकारी जोडू शकतात.',
    },
    {
      reader: 'mr',
      names: ['Meera Shah', 'Rajesh Kulkarni'],
      more: 1,
      title: 'फक्त Meera Shah, Rajesh Kulkarni किंवा आणखी 1 (मालक) नवीन सहकारी जोडू शकतात.',
    },
  ])(
    'joined names: $reader, $names and $more more owners',
    async ({ reader, names, more, title }) => {
      const words = await wordsFor([SALES_EXECUTIVE], { owners: { names, more } }, reader);
      expect(words.note?.title).toBe(title);
    },
  );

  it('no owner name yet, or none at all: no note', async () => {
    expect((await wordsFor([SALES_EXECUTIVE], { owners: null })).note).toBeNull();
    expect((await wordsFor([SALES_EXECUTIVE], { owners: { names: [], more: 0 } })).note).toBeNull();
  });

  it('an Owner has no note, however many owners there are', async () => {
    expect((await wordsFor([OWNER])).note).toBeNull();
    expect((await wordsFor([OWNER])).act).toBe('Go to the dashboard');
  });

  it.each<{ reader: UiLanguage; two: string; three: string }>([
    {
      reader: 'en',
      two: 'Sales Executive and Design Engineer',
      three: 'Sales Executive, Survey Engineer and Design Engineer',
    },
    { reader: 'hi', two: '{se} और {de}', three: '{se}, {su} और {de}' },
    { reader: 'mr', two: '{se} आणि {de}', three: '{se}, {su} आणि {de}' },
  ])('joined names: two and three presets in $reader', async ({ reader, two, three }) => {
    const { t } = await createTranslator(reader);
    const fill = (pattern: string) =>
      pattern
        .replace('{se}', presetName(t, SALES_EXECUTIVE))
        .replace('{su}', presetName(t, SURVEY_ENGINEER))
        .replace('{de}', presetName(t, DESIGN_ENGINEER));
    expect((await wordsFor([DESIGN_ENGINEER, SALES_EXECUTIVE], {}, reader)).presets).toBe(
      fill(two),
    );
    const all = await wordsFor([DESIGN_ENGINEER, SURVEY_ENGINEER, SALES_EXECUTIVE], {}, reader);
    expect(all.presets).toBe(fill(three));
  });

  it.each<UiLanguage>(['en', 'hi', 'mr'])(
    'two homes with one title name no switch (%s)',
    async (reader) => {
      const { t } = await createTranslator(reader);
      expect((await wordsFor([SALES_EXECUTIVE, FIELD_TECHNICIAN], {}, reader)).atAct).toBe(
        t(ROLE_CARD.reopen),
      );
    },
  );

  it.each<{ facts: Partial<RoleCardNames>; body: string }>([
    {
      facts: { setterName: null },
      body: 'You are still part of Suryodaya Solar. Try again in a moment.',
    },
    { facts: { companyName: null }, body: 'Your role has not changed. Try again in a moment.' },
  ])('the error with less to name: $body', async ({ facts, body }) => {
    expect((await wordsFor([SALES_EXECUTIVE], facts)).error.body).toBe(body);
  });

  it('the founder has no credit line, and a card with no company yet has a plain title', async () => {
    const words = await wordsFor([OWNER], { setterName: null, companyName: null });
    expect(words.credit).toBeNull();
    expect(words.title).toBe('Your role');
  });
});

describe('roleCardWords — Hindi and Marathi carry every word', () => {
  it.each<UiLanguage>(['hi', 'mr'])('%s', async (reader) => {
    const english = await wordsFor([DESIGN_ENGINEER, SALES_EXECUTIVE], {}, 'en');
    const words = await wordsFor([DESIGN_ENGINEER, SALES_EXECUTIVE], {}, reader);
    const texts = (w: typeof words) => [
      w.title,
      w.presets,
      w.credit,
      w.canDo,
      w.cannotDo,
      w.region,
      w.loading,
      ...w.grants.map((line) => line.text),
      ...w.limits.map((line) => line.text),
      w.note?.title,
      w.note?.message,
      w.act,
      w.atAct,
      w.error.title,
      w.error.body,
    ];
    const translated = texts(words);
    texts(english).forEach((text, index) => {
      expect(translated[index], text ?? '').not.toBe(text);
    });
    expect(words.title).toContain('Suryodaya Solar');
    expect(words.note?.title).toContain('Rajesh Kulkarni');
  });
});
