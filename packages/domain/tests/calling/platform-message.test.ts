import { describe, expect, it } from 'vitest';
import {
  type CallingRulesPack,
  IN_CALLING_RULES,
  PLATFORM_MESSAGE_KINDS,
} from '../../src/calling/pack';
import { platformMessage } from '../../src/calling/platform-message';
import { UI_LANGUAGES } from '../../src/format/languages';

const NEVER_CALL = {
  en: 'We never call to ask for this code.',
  hi: 'हम यह कोड पूछने के लिए कभी कॉल नहीं करते।',
  mr: 'आम्ही कधीही कॉल करत नाही.',
} as const;

const VARIABLES = {
  sign_in_code: { code: '482913' },
  team_invite: {
    inviter: 'Rajesh Sharma',
    company: 'Suryodaya Solar',
    link: 'https://app.heliogrid.in/invite/t0k3n',
  },
} as const;

describe('platformMessage — every registered template, every language (M01-06, M01-13, F1-38)', () => {
  it.each(
    PLATFORM_MESSAGE_KINDS.flatMap((kind) => UI_LANGUAGES.map((language) => ({ kind, language }))),
  )(
    '$kind in $language names the product and fills every slot exactly once',
    ({ kind, language }) => {
      const message = platformMessage(IN_CALLING_RULES, kind, language, VARIABLES[kind]);
      expect(message).toContain('HelioGrid');
      for (const value of Object.values(VARIABLES[kind]))
        expect(message.split(value)).toHaveLength(2);
      expect(message).not.toMatch(/\{\w+\}/);
    },
  );

  it.each(UI_LANGUAGES)(
    'the sign-in code in %s carries the never-call line (M01-06)',
    (language) => {
      expect(
        platformMessage(IN_CALLING_RULES, 'sign_in_code', language, VARIABLES.sign_in_code),
      ).toContain(NEVER_CALL[language]);
    },
  );

  it('writes a value holding a replacement pattern verbatim', () => {
    const message = platformMessage(IN_CALLING_RULES, 'team_invite', 'en', {
      ...VARIABLES.team_invite,
      company: 'A$& B',
    });
    expect(message).toContain('A$& B');
  });

  it('refuses a slot no variable fills — a raw placeholder never reaches a phone', () => {
    expect(() =>
      platformMessage(IN_CALLING_RULES, 'team_invite', 'en', { inviter: 'R', company: 'S' }),
    ).toThrow('{link}');
  });

  it('falls back to English for a language the template has not authored (F3-05)', () => {
    const englishOnly: CallingRulesPack = {
      ...IN_CALLING_RULES,
      messaging: {
        ...IN_CALLING_RULES.messaging,
        templates: {
          ...IN_CALLING_RULES.messaging.templates,
          sign_in_code: { en: 'Code {code}.' },
        },
      },
    };
    expect(platformMessage(englishOnly, 'sign_in_code', 'mr', { code: '111111' })).toBe(
      'Code 111111.',
    );
  });
});
