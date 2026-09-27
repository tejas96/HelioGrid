import { UI_LANGUAGES, type UiLanguage } from '@heliogrid/contracts';
import { TRANSPORT_FAILURES, type TransportFailure } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { attemptFailureMessageId } from '../src/copy/api-error';
import { createTranslator } from '../src/runtime';

/**
 * `F8-36` — the words for an attempt the server gave no readable answer to, as ruled at
 * `T-FPLAT-032`'s `/start`, in each language. Copied from the ticket and NOT from the catalog, so a
 * catalog entry that drifts from the ruling — a translation that says the save failed — fails here.
 */
const EN_CHECK = 'If you were saving, check whether it saved before trying again.';
const HI_CHECK = 'अगर आप कुछ सेव कर रहे थे, तो दोबारा कोशिश करने से पहले देख लें कि वह सेव हुआ या नहीं।';
const MR_CHECK = 'तुम्ही काही सेव्ह करत असाल, तर पुन्हा प्रयत्न करण्यापूर्वी ते सेव्ह झाले का ते तपासा.';
const RULED: Record<UiLanguage, Record<TransportFailure, string>> = {
  en: {
    no_connection: `HelioGrid could not be reached, from your side or ours. ${EN_CHECK}`,
    no_answer: `HelioGrid did not answer in time. ${EN_CHECK}`,
    unreadable_answer: `HelioGrid's answer could not be read. ${EN_CHECK}`,
    cancelled: `This stopped before HelioGrid answered. ${EN_CHECK}`,
  },
  hi: {
    no_connection: `HelioGrid तक पहुँचा नहीं जा सका — आपकी ओर से या हमारी ओर से। ${HI_CHECK}`,
    no_answer: `HelioGrid ने समय पर जवाब नहीं दिया। ${HI_CHECK}`,
    unreadable_answer: `HelioGrid का जवाब पढ़ा नहीं जा सका। ${HI_CHECK}`,
    cancelled: `HelioGrid के जवाब देने से पहले यह रुक गया। ${HI_CHECK}`,
  },
  mr: {
    no_connection: `HelioGrid पर्यंत पोहोचता आले नाही — तुमच्या बाजूने किंवा आमच्या. ${MR_CHECK}`,
    no_answer: `HelioGrid ने वेळेत उत्तर दिले नाही. ${MR_CHECK}`,
    unreadable_answer: `HelioGrid चे उत्तर वाचता आले नाही. ${MR_CHECK}`,
    cancelled: `HelioGrid ने उत्तर देण्यापूर्वी हे थांबले. ${MR_CHECK}`,
  },
};

describe('the words for a failed attempt', () => {
  it.each(TRANSPORT_FAILURES)(
    'names the reason for each failed attempt the server did not answer, in every language (F8-36) — %s',
    async (failure) => {
      /* No `code`: a client failure carries none, and the lookup must take one as it is. */
      const id = attemptFailureMessageId({ failure });
      expect(id).toBeDefined();
      for (const language of UI_LANGUAGES) {
        const { t } = await createTranslator(language);
        expect(t(id ?? '')).toBe(RULED[language][failure]);
      }
    },
  );

  it.each([
    /* The server described the refusal: its code's words, never a transport failure's. */
    ['ENTITLEMENT_BLOCKED', null, "Your current plan doesn't include this."],
    /* A server code spelled like a failure is still the server's, and has no words here. */
    ['no_answer', null, undefined],
    /* A failure the client saw is worded as that failure, whatever code rode along. */
    ['ENTITLEMENT_BLOCKED', 'no_answer', RULED.en.no_answer],
  ] as const)(
    "a server's refusal keeps its own words, whatever its code (F8-36) — code %s, failure %s",
    async (code, failure, expected) => {
      const { t } = await createTranslator('en');
      const id = attemptFailureMessageId({ failure, code });
      expect(id === undefined ? undefined : t(id)).toBe(expected);
    },
  );
});
