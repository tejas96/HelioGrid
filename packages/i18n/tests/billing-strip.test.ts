import {
  BILLING_CAPABILITIES,
  FIGURE_SLOT,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { billingStripWords } from '../src/copy/billing-strip';
import { createTranslator } from '../src/runtime';

/** "Account limited" as each language would say it: no pause line may (`M12-31`). */
const GENERIC: Record<UiLanguage, RegExp> = {
  en: /account (is )?limited|account restricted/i,
  hi: /खाता सीमित/,
  mr: /खाते मर्यादित/,
};

/** Every line the strip and the denial can say with no figure in it, in one language. */
function everyLine(words: ReturnType<typeof billingStripWords>): string[] {
  const fixed = Object.values(words).flatMap((value: unknown) =>
    typeof value === 'string' ? [value] : [],
  );
  const denials = BILLING_CAPABILITIES.map((capability) => words.denied(capability));
  return [...fixed, ...denials];
}

describe('billingStripWords (M12-31, SCR-SHELL-06)', () => {
  it('no launch language says account limited, and every pause line names what, until when and the act', async () => {
    for (const language of UI_LANGUAGES) {
      const { t } = await createTranslator(language);
      const words = billingStripWords(t);
      for (const line of everyLine(words)) expect(line, language).not.toMatch(GENERIC[language]);
      // What: each capability's denial names it, never the catch-all.
      const catchAll = words.denied('a_capability_this_release_does_not_know');
      for (const capability of BILLING_CAPABILITIES) {
        expect(words.denied(capability), `${language}: ${capability}`).not.toBe(catchAll);
      }
      // What: a cap's pause names the meter and what paused.
      const paused = words.capPaused('proposals', words.usedPaused('proposals', '300', '300'));
      expect(paused, language).toContain(words.meterName('proposals'));
      // Until when: the day-4 and the final rows name their dates' facts.
      expect(words.until, language).not.toBe('');
      expect(words.accountHalts, language).not.toBe('');
      expect(words.cycleResets, language).not.toBe('');
      // The act: each money act places its one amount where the language puts it (`F7-09`).
      for (const act of [words.payNow(), words.payWith('UPI AutoPay'), words.reactivateWith()]) {
        expect(act.split(FIGURE_SLOT), `${language}: ${act}`).toHaveLength(2);
      }
      const onInvoice = words.amountOnInvoice().split(FIGURE_SLOT);
      expect(onInvoice, language).toHaveLength(3);
    }
  });
});
