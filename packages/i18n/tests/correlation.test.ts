import { UI_LANGUAGES } from '@heliogrid/contracts';
import { AGENT_CALL_WINDOW } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { AGENT_CALL_CORRELATION, agentCallCorrelation } from '../src/copy/correlation';
import { createTranslator } from '../src/runtime';

/**
 * `F8-30` — the caption the agent's impact block carries. Copied from the PRD row and NOT from the
 * catalog, so a catalog id that drifts from the row fails here.
 */
const F8_30_CAPTION =
  'The agent called and the customer responded within 3 days. We cannot prove the call caused it.';

describe('the agent call correlation caption', () => {
  it("prints the agent's caption in English exactly as F8-30 words it", async () => {
    const { t } = await createTranslator('en');
    expect(agentCallCorrelation(t, AGENT_CALL_WINDOW)).toBe(F8_30_CAPTION);
  });

  it("prints the agent's caption in Hindi and Marathi (F8-30)", async () => {
    const hindi = await createTranslator('hi');
    const marathi = await createTranslator('mr');
    /* A missing translation falls back to English and would still print a line. */
    expect(agentCallCorrelation(hindi.t, AGENT_CALL_WINDOW)).toMatch(/\p{Script=Devanagari}/u);
    expect(agentCallCorrelation(marathi.t, AGENT_CALL_WINDOW)).toMatch(/\p{Script=Devanagari}/u);
    expect(agentCallCorrelation(marathi.t, AGENT_CALL_WINDOW)).not.toBe(
      agentCallCorrelation(hindi.t, AGENT_CALL_WINDOW),
    );
  });

  it.each(UI_LANGUAGES)(
    'states the window it is given, in Latin digits, in every language (F8-32)',
    async (language) => {
      const { t } = await createTranslator(language);
      /* Each plural branch, and windows the catalog was never written with: a branch that wrote a
         number instead of its slot, or printed `#` — `१` in Marathi, beside figures that print `1` —
         shows digits other than the window's own. */
      for (const days of [0, 1, 5]) {
        const digits = t(AGENT_CALL_CORRELATION, { days })
          .match(/\p{Nd}/gu)
          ?.join('');
        expect(digits).toBe(String(days));
      }
    },
  );

  it('takes only a window the domain states (F8-32)', async () => {
    const { t } = await createTranslator('en');
    // @ts-expect-error — a bare number is not an `ObservationWindow`: only `packages/domain` states one.
    expect(agentCallCorrelation(t, 3)).toBe(F8_30_CAPTION);
  });
});
