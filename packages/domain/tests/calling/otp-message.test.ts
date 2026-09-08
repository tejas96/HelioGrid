import { describe, expect, it } from 'vitest';
import { OTP_CODE_SLOT, otpMessage } from '../../src/calling/otp-message';
import { type CallingRulesPack, IN_CALLING_RULES } from '../../src/calling/pack';
import { UI_LANGUAGES } from '../../src/format/languages';

const NEVER_CALL = {
  en: 'We never call to ask for this code.',
  hi: 'हम यह कोड पूछने के लिए कभी कॉल नहीं करते।',
  mr: 'आम्ही कधीही कॉल करत नाही.',
} as const;

describe('otpMessage — the registered template, the code in its slot (M01-06, F1-38)', () => {
  it.each(UI_LANGUAGES)(
    'in %s names the product, the code once, and the never-call line',
    (language) => {
      const message = otpMessage(IN_CALLING_RULES, language, '482913');
      expect(message).toContain('HelioGrid');
      expect(message).toContain(NEVER_CALL[language]);
      expect(message.split('482913')).toHaveLength(2);
      expect(message).not.toContain(OTP_CODE_SLOT);
    },
  );

  it('falls back to English for a language the template has not authored (F3-05)', () => {
    const englishOnly: CallingRulesPack = {
      ...IN_CALLING_RULES,
      messaging: { ...IN_CALLING_RULES.messaging, otpMessage: { en: `Code ${OTP_CODE_SLOT}.` } },
    };
    expect(otpMessage(englishOnly, 'mr', '111111')).toBe('Code 111111.');
  });
});
