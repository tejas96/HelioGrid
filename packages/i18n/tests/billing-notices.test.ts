import {
  BILLING_NOTICES,
  type BillingCapability,
  IN_BILLING_NOTICE_TEXTS,
  pauseNoticeOf,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { billingCapabilityName, billingNoticeWords } from '../src/copy/billing-notices';
import { createTranslator } from '../src/runtime';

/**
 * Words that would threaten a loss of data (`M12-41`): nothing is ever deleted (`BM-32`), so no
 * notice may name one, in any language.
 */
const THREATS: Record<UiLanguage, RegExp> = {
  en: /delet|eras|remov|wipe|destroy|\blos[et]\b|purge/i,
  hi: /हटा|मिटा|डिलीट|नष्ट|खो /,
  mr: /हटव|पुस|डिलीट|नष्ट|गमाव/,
};

/** A launch price, as each language writes it: no company keeps one (`BM-42`), so no notice names it. */
const LAUNCH_PRICE: Record<UiLanguage, string> = {
  en: 'launch price',
  hi: 'लॉन्च कीमत',
  mr: 'लॉन्च किंमत',
};

describe('billingNoticeWords (M12-39, M12-41)', () => {
  it('the day-4 notice names what the matrix pauses and the halt notice what still works', async () => {
    for (const language of UI_LANGUAGES) {
      const { t } = await createTranslator(language);
      const names = (capabilities: readonly BillingCapability[]) =>
        capabilities.map((capability) => billingCapabilityName(t, capability));
      const dayFour = billingNoticeWords(t, 'metered_paused').body;
      const { paused, stillWorks } = pauseNoticeOf('past_due_metered_paused');
      for (const name of [...names(paused), ...names(stillWorks)]) {
        expect(dayFour, `${language}: ${name}`).toContain(name);
      }
      const halt = billingNoticeWords(t, 'halted').body;
      for (const name of names(pauseNoticeOf('halted').stillWorks)) {
        expect(halt, `${language}: ${name}`).toContain(name);
      }
      for (const name of names(pauseNoticeOf('halted').paused)) {
        expect(halt, `${language}: ${name}`).not.toContain(name);
      }
    }
  });

  it('no billing notice in any language threatens deletion or speaks of a launch price', async () => {
    for (const language of UI_LANGUAGES) {
      const { t } = await createTranslator(language);
      for (const notice of BILLING_NOTICES) {
        const { title, body } = billingNoticeWords(t, notice);
        const where = `${language} ${notice}`;
        expect(`${title} ${body}`, where).not.toMatch(THREATS[language]);
        expect(`${title} ${body}`, where).not.toContain(LAUNCH_PRICE[language]);
        const sms = IN_BILLING_NOTICE_TEXTS[notice]?.text[language] ?? '';
        expect(sms, `${language} ${notice} sms`).not.toMatch(THREATS[language]);
        expect(sms, `${language} ${notice} sms`).not.toContain(LAUNCH_PRICE[language]);
      }
    }
  });
});
