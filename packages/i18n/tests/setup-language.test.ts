import { describe, expect, it } from 'vitest';
import { setupLanguageWords } from '../src/copy/setup-language';
import { createTranslator } from '../src/runtime';

/**
 * The words of the first setup step (`SCR-M01-03`, `F3-03`). Both platforms draw what this returns
 * and write none themselves. The Hindi and Marathi are the board's working words, and five
 * strings it does not draw are drafted the same way: `Continue` in Hindi, both pills' `Chosen for
 * you`, and both not-in-set lines.
 */
const NAMES = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' } as const;

const WORDS = {
  en: {
    title: 'Choose your language',
    group: 'Language',
    devicePill: 'Your device’s language',
    chosenPill: 'Chosen for you',
    notice: 'Your device’s language isn’t in HelioGrid yet, so the app started in English.',
    continue: 'Continue',
    failure: {
      title: 'Your language was not saved',
      body: 'Try again, or continue and be asked again at your next sign-in.',
    },
    tryAgain: 'Try again',
    continueAnyway: 'Continue anyway',
    ask: {
      label: 'About your language',
      title: 'Your language',
      pages: [
        'Your language belongs to you, not to this device. It follows you wherever you sign in.',
        'Change it any time in Profile & preferences.',
      ],
      nextLabel: 'Next',
      backLabel: 'Back',
    },
  },
  hi: {
    title: 'अपनी भाषा चुनें',
    group: 'भाषा',
    devicePill: 'आपके डिवाइस की भाषा',
    chosenPill: 'आपके लिए चुनी गई',
    notice: 'आपके डिवाइस की भाषा अभी HelioGrid में नहीं है, इसलिए ऐप अंग्रेज़ी में शुरू हुआ।',
    continue: 'आगे बढ़ें',
    failure: {
      title: 'आपकी भाषा सहेजी नहीं गई',
      body: 'फिर से कोशिश करें, या आगे बढ़ें — अगली बार साइन इन करने पर यह फिर पूछा जाएगा।',
    },
    tryAgain: 'फिर से कोशिश करें',
    continueAnyway: 'फिर भी आगे बढ़ें',
    ask: {
      label: 'अपनी भाषा के बारे में',
      title: 'आपकी भाषा',
      pages: [
        'आपकी भाषा आपकी है, इस डिवाइस की नहीं। आप जहाँ भी साइन इन करें, यह आपके साथ रहती है।',
        'इसे कभी भी प्रोफ़ाइल और प्राथमिकताएँ में बदलें।',
      ],
      nextLabel: 'आगे',
      backLabel: 'पीछे',
    },
  },
  mr: {
    title: 'तुमची भाषा निवडा',
    group: 'भाषा',
    devicePill: 'तुमच्या डिव्हाइसची भाषा',
    chosenPill: 'तुमच्यासाठी निवडलेली',
    notice: 'तुमच्या डिव्हाइसची भाषा अजून HelioGrid मध्ये नाही, म्हणून ॲप इंग्रजीत सुरू झाले.',
    continue: 'पुढे चला',
    failure: {
      title: 'तुमची भाषा जतन झाली नाही',
      body: 'पुन्हा प्रयत्न करा, किंवा पुढे चला — पुढच्या साइन-इनला हे पुन्हा विचारले जाईल.',
    },
    tryAgain: 'पुन्हा प्रयत्न करा',
    continueAnyway: 'तरीही पुढे चला',
    ask: {
      label: 'तुमच्या भाषेबद्दल',
      title: 'तुमची भाषा',
      pages: [
        'ही भाषा तुमची आहे, या डिव्हाइसची नाही. तुम्ही जिथे साइन इन करता तिथे ती तुमच्यासोबत येते.',
        'प्रोफाइल आणि प्राधान्ये मध्ये ती कधीही बदला.',
      ],
      nextLabel: 'पुढे',
      backLabel: 'मागे',
    },
  },
} as const;

const LANGUAGES = ['en', 'hi', 'mr'] as const;

describe('setupLanguageWords', () => {
  it.each(LANGUAGES)(
    'in %s: each language keeps its own name and its own tag, and nothing sits beside it',
    async (language) => {
      const { t } = await createTranslator(language);
      const { options } = setupLanguageWords(t, { device: null, failed: false });
      expect(options.map(({ value, title, lang }) => ({ value, title, lang }))).toEqual(
        LANGUAGES.map((code) => ({ value: code, title: NAMES[code], lang: code })),
      );
    },
  );

  it.each(LANGUAGES)(
    'in %s: a device in the set puts its pill on its own card, and says nothing more',
    async (language) => {
      const { t } = await createTranslator(language);
      const words = setupLanguageWords(t, { device: 'hi', failed: false });
      expect(words.options).toEqual([
        { value: 'en', title: NAMES.en, lang: 'en' },
        {
          value: 'hi',
          title: NAMES.hi,
          lang: 'hi',
          current: true,
          currentLabel: WORDS[language].devicePill,
        },
        { value: 'mr', title: NAMES.mr, lang: 'mr' },
      ]);
      expect(words.notice).toBeNull();
    },
  );

  it.each(LANGUAGES)(
    'in %s: a device outside the set puts “chosen for you” on English and says why in one line',
    async (language) => {
      const { t } = await createTranslator(language);
      const words = setupLanguageWords(t, { device: null, failed: false });
      expect(words.options[0]).toEqual({
        value: 'en',
        title: NAMES.en,
        lang: 'en',
        current: true,
        currentLabel: WORDS[language].chosenPill,
      });
      expect(words.options.slice(1).every((option) => !('current' in option))).toBe(true);
      expect(words.notice).toBe(WORDS[language].notice);
    },
  );

  it.each(LANGUAGES)(
    'in %s: the question, its ask and one way on — and no banner while nothing failed',
    async (language) => {
      const { t } = await createTranslator(language);
      const { explainer, ...words } = setupLanguageWords(t, { device: 'en', failed: false });
      expect(words).toMatchObject({
        title: WORDS[language].title,
        group: WORDS[language].group,
        failure: null,
        primary: WORDS[language].continue,
        secondary: null,
      });
      expect(explainer).toMatchObject(WORDS[language].ask);
    },
  );

  it.each(LANGUAGES)(
    'in %s: a save that failed says what went wrong and what fixes it, with two ways on',
    async (language) => {
      const { t } = await createTranslator(language);
      const words = setupLanguageWords(t, { device: 'en', failed: true });
      expect(words).toMatchObject({
        failure: WORDS[language].failure,
        primary: WORDS[language].tryAgain,
        secondary: WORDS[language].continueAnyway,
      });
    },
  );
});
