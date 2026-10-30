import {
  BILLING_NOTICES,
  type BillingCapability,
  disclosesForfeiture,
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

/** The sentence that names the launch-price loss, as each language writes it. */
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
      const dayFour = billingNoticeWords(t, 'metered_paused', false).body;
      const { paused, stillWorks } = pauseNoticeOf('past_due_metered_paused');
      for (const name of [...names(paused), ...names(stillWorks)]) {
        expect(dayFour, `${language}: ${name}`).toContain(name);
      }
      const halt = billingNoticeWords(t, 'halted', false).body;
      for (const name of names(pauseNoticeOf('halted').stillWorks)) {
        expect(halt, `${language}: ${name}`).toContain(name);
      }
      for (const name of names(pauseNoticeOf('halted').paused)) {
        expect(halt, `${language}: ${name}`).not.toContain(name);
      }
    }
  });

  it('no billing notice in any language threatens deletion', async () => {
    for (const language of UI_LANGUAGES) {
      const { t } = await createTranslator(language);
      for (const notice of BILLING_NOTICES) {
        for (const whileProtected of [false, true]) {
          const { title, body } = billingNoticeWords(t, notice, whileProtected);
          const where = `${language} ${notice} protected=${whileProtected}`;
          expect(`${title} ${body}`, where).not.toMatch(THREATS[language]);
          expect(body.includes(LAUNCH_PRICE[language]), where).toBe(
            whileProtected && disclosesForfeiture(notice),
          );
        }
        const texts = IN_BILLING_NOTICE_TEXTS[notice];
        for (const label of [texts?.text, texts?.whileProtected]) {
          const sms = label?.[language] ?? '';
          expect(sms, `${language} ${notice} sms`).not.toMatch(THREATS[language]);
        }
      }
    }
  });
});
