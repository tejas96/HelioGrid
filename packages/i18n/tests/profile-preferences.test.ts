import {
  IN_FORMATS,
  type ProfilePreference,
  profilePreferencesView,
  ROLE_PRESETS,
  type SessionUser,
  type UiLanguage,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { profilePreferencesWords } from '../src/copy/profile-preferences';
import { createTranslator } from '../src/runtime';

const [, , SALES_EXECUTIVE, SURVEY_ENGINEER, DESIGN_ENGINEER] = ROLE_PRESETS;

/** Profile & preferences' words (`SCR-M01-11`): the board's, word for word, in the reader's language. */
const anjali: SessionUser = {
  id: '8f0c2d1e-0000-4000-8000-0000000000a1',
  name: 'Anjali Kulkarni',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
  unitPreference: 'metric',
  tenant: { id: 't', roles: [SALES_EXECUTIVE] },
};

async function wordsFor(
  reader: UiLanguage,
  user: SessionUser,
  refused: readonly ProfilePreference[] = [],
) {
  const { t } = await createTranslator(reader);
  const view = profilePreferencesView({ user, device: 'en', marketUnits: 'metric' });
  return profilePreferencesWords(t, view, { reader, pack: IN_FORMATS, refused });
}

describe('profilePreferencesWords', () => {
  it('reads the board at rest: inherited lines name the device and the market', async () => {
    const words = await wordsFor('en', anjali);
    expect(words.roles).toEqual({
      title: 'Your role',
      badges: [{ preset: SALES_EXECUTIVE, label: 'Sales Executive' }],
    });
    expect(words.language.options.map((option) => option.label)).toEqual([
      'English',
      'हिन्दी',
      'मराठी',
    ]);
    expect(words.language.source).toBe("Your device's language");
    expect(words.units.source).toBe('Default for India');
    expect(words.language.error).toBeNull();
  });

  it('names each language in its own script whatever the reader reads', async () => {
    const words = await wordsFor('mr', anjali);
    expect(words.language.options.map((option) => [option.label, option.lang])).toEqual([
      ['English', 'en'],
      ['हिन्दी', 'hi'],
      ['मराठी', 'mr'],
    ]);
  });

  it("names the market in the reader's language", async () => {
    const words = await wordsFor('hi', anjali);
    expect(words.units.source).toContain('भारत');
  });

  it.each([
    ['the language', ['language'], 'Not saved. Try again.', null],
    ['the units', ['units'], null, 'Not saved. Try again.'],
    ['both', ['language', 'units'], 'Not saved. Try again.', 'Not saved. Try again.'],
    ['neither', [], null, null],
  ] as const)(
    'a refused save of %s shows on its own control',
    async (_, refused, language, units) => {
      const words = await wordsFor('en', anjali, refused);
      expect([words.language.error, words.units.error]).toEqual([language, units]);
    },
  );

  it('a person holding several presets reads "Your roles" over every badge', async () => {
    const user = { ...anjali, tenant: { id: 't', roles: [SURVEY_ENGINEER, DESIGN_ENGINEER] } };
    const words = await wordsFor('en', user);
    expect(words.roles.title).toBe('Your roles');
    expect(words.roles.badges).toHaveLength(2);
  });

  it('a moved choice reads "Your choice"', async () => {
    const words = await wordsFor('en', {
      ...anjali,
      interfaceLanguage: 'hi',
      unitPreference: 'imperial',
    });
    expect([words.language.source, words.units.source]).toEqual(['Your choice', 'Your choice']);
  });
});
