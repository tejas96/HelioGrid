import { describe, expect, it } from 'vitest';
import { setupWhatYouSellWords } from '../src/copy/setup-what-you-sell';
import { createTranslator } from '../src/runtime';

/**
 * The words of the second setup step (`SCR-M01-04`, `M01-23`). Both platforms draw what this
 * returns and write none themselves. The Hindi and Marathi of the failed save, the cards, the
 * group, the helper line, the field's label and the size's source are the board's working words.
 * The board draws the other lines in English alone, so these are drafted the same way for the
 * localisation pass: the title, the questions' ask, the line at Continue, the checking reason and
 * the two field errors.
 */
const WORDS = {
  en: {
    title: 'What do you sell?',
    ask: {
      label: 'About these questions',
      title: 'Why we ask',
      pages: [
        'Your answers set the starting point for every proposal HelioGrid builds.',
        'You can change both later in your company profile, the next step. Proposals you have already sent never change.',
      ],
      nextLabel: 'Next',
      backLabel: 'Back',
    },
    group: 'Who you sell to',
    options: [
      {
        value: 'residential',
        title: 'Residential',
        description: 'Homes and individual rooftops, sold to the owner living under the system.',
      },
      {
        value: 'ci',
        title: 'Commercial & industrial (C&I)',
        description: 'Factories, warehouses and offices — bigger rooftops, sold to a business.',
      },
      {
        value: 'both',
        title: 'Both',
        description: 'You sell to homes and businesses, and pick which one each proposal is for.',
      },
    ],
    pickOne: 'Pick the one that describes your work.',
    sizeHelper: 'Your most common job, not your biggest.',
    sizeLabel: 'Typical system size',
    sizeSource: 'Declared by you',
    addSize: 'Add the size you sell most often.',
    continue: 'Continue',
    savesBoth: 'Saves both; you can change them in your company profile.',
    stillChecking: 'Still checking whether you have answered this.',
    notSavedTitle: 'Your answers did not save',
    notSavedBody: 'Try again, or finish this in your company profile.',
    errorAsk: {
      label: 'About this error',
      title: 'Nothing was lost',
      pages: [
        'Your answers are still on this screen, and nothing about your account changed.',
        'Finish later takes you to your company profile, the next step. You can finish both answers there.',
      ],
    },
    tryAgain: 'Try again',
    finishLater: 'Finish later',
    untilYouFinish: 'Until you finish, proposals start without your answers.',
  },
  hi: {
    title: 'आप क्या बेचते हैं?',
    ask: {
      label: 'इन सवालों के बारे में',
      title: 'हम क्यों पूछते हैं',
      pages: [
        'आपके जवाब HelioGrid के बनाए हर प्रस्ताव का शुरुआती बिंदु तय करते हैं।',
        'दोनों को आप बाद में अगले चरण, कंपनी प्रोफ़ाइल में बदल सकते हैं। जो प्रस्ताव आप भेज चुके हैं, वे कभी नहीं बदलते।',
      ],
      nextLabel: 'आगे',
      backLabel: 'पीछे',
    },
    group: 'आप किसे बेचते हैं',
    options: [
      {
        value: 'residential',
        title: 'आवासीय',
        description: 'घर और निजी छतें — उस मालिक को बेची जाती हैं जो खुद उस सिस्टम के नीचे रहता है।',
      },
      {
        value: 'ci',
        title: 'वाणिज्यिक और औद्योगिक (C&I)',
        description: 'कारखाने, गोदाम और दफ़्तर — बड़ी छतें, किसी व्यवसाय को बेची जाती हैं।',
      },
      {
        value: 'both',
        title: 'दोनों',
        description: 'आप घरों और व्यवसायों, दोनों को बेचते हैं, और हर प्रस्ताव किसके लिए है यह चुनते हैं।',
      },
    ],
    pickOne: 'वह चुनें जो आपके काम को बताता है।',
    sizeHelper: 'आपका सबसे आम काम, सबसे बड़ा नहीं।',
    sizeLabel: 'सामान्य सिस्टम आकार',
    sizeSource: 'आपके द्वारा बताया गया',
    addSize: 'वह आकार जोड़ें जो आप सबसे ज़्यादा बेचते हैं।',
    continue: 'आगे बढ़ें',
    savesBoth: 'दोनों सहेजता है; आप इन्हें अपनी कंपनी प्रोफ़ाइल में बदल सकते हैं।',
    stillChecking: 'अभी जाँच रहे हैं कि आपने इसका जवाब दिया है या नहीं।',
    notSavedTitle: 'आपके जवाब सहेजे नहीं गए',
    notSavedBody: 'फिर से कोशिश करें, या इसे कंपनी प्रोफ़ाइल में पूरा करें।',
    errorAsk: {
      label: 'इस त्रुटि के बारे में',
      title: 'कुछ भी नहीं खोया',
      pages: [
        'आपके जवाब इसी स्क्रीन पर हैं, और आपके खाते में कुछ नहीं बदला।',
        'बाद में पूरा करें आपको अगले चरण, कंपनी प्रोफ़ाइल पर ले जाता है। दोनों जवाब वहाँ पूरे कर सकते हैं।',
      ],
    },
    tryAgain: 'फिर से कोशिश करें',
    finishLater: 'बाद में पूरा करें',
    untilYouFinish: 'पूरा करने तक प्रस्ताव आपके जवाबों के बिना शुरू होंगे।',
  },
  mr: {
    title: 'तुम्ही काय विकता?',
    ask: {
      label: 'या प्रश्नांबद्दल',
      title: 'आम्ही का विचारतो',
      pages: [
        'तुमची उत्तरे HelioGrid तयार करत असलेल्या प्रत्येक प्रस्तावाचा सुरुवातीचा बिंदू ठरवतात.',
        'दोन्ही तुम्ही नंतर पुढच्या पायरीत, कंपनी प्रोफाइलमध्ये बदलू शकता. तुम्ही आधीच पाठवलेले प्रस्ताव कधीही बदलत नाहीत.',
      ],
      nextLabel: 'पुढे',
      backLabel: 'मागे',
    },
    group: 'तुम्ही कोणाला विकता',
    options: [
      {
        value: 'residential',
        title: 'निवासी',
        description: 'घरे आणि वैयक्तिक छते — जिथे मालक स्वतः त्या सिस्टीमखाली राहतो.',
      },
      {
        value: 'ci',
        title: 'व्यावसायिक व औद्योगिक (C&I)',
        description: 'कारखाने, गोदामे आणि कार्यालये — मोठी छते, व्यवसायाला विकलेली.',
      },
      {
        value: 'both',
        title: 'दोन्ही',
        description: 'तुम्ही घरे आणि व्यवसाय दोघांना विकता, आणि प्रत्येक प्रस्ताव कोणासाठी आहे ते निवडता.',
      },
    ],
    pickOne: 'तुमच्या कामाचे वर्णन करणारा पर्याय निवडा.',
    sizeHelper: 'तुमचे सर्वात नेहमीचे काम, सर्वात मोठे नाही.',
    sizeLabel: 'सामान्य सिस्टम आकार',
    sizeSource: 'तुम्ही सांगितलेले',
    addSize: 'तुम्ही सर्वाधिक विकता तो आकार भरा.',
    continue: 'पुढे चला',
    savesBoth: 'दोन्ही साठवते; तुम्ही ती तुमच्या कंपनी प्रोफाइलमध्ये बदलू शकता.',
    stillChecking: 'तुम्ही याचे उत्तर दिले आहे का ते अजून तपासत आहोत.',
    notSavedTitle: 'तुमची उत्तरे साठवली गेली नाहीत',
    notSavedBody: 'पुन्हा प्रयत्न करा, किंवा हे कंपनी प्रोफाइलमध्ये पूर्ण करा.',
    errorAsk: {
      label: 'या त्रुटीबद्दल',
      title: 'काहीही हरवले नाही',
      pages: [
        'तुमची उत्तरे याच स्क्रीनवर आहेत, आणि तुमच्या खात्यात काहीही बदलले नाही.',
        'नंतर पूर्ण करा तुम्हाला पुढच्या पायरीवर, कंपनी प्रोफाइलमध्ये नेते. दोन्ही उत्तरे तिथे पूर्ण करता येतात.',
      ],
    },
    tryAgain: 'पुन्हा प्रयत्न करा',
    finishLater: 'नंतर पूर्ण करा',
    untilYouFinish: 'पूर्ण करेपर्यंत प्रस्ताव तुमच्या उत्तरांशिवाय सुरू होतात.',
  },
} as const;

const LANGUAGES = ['en', 'hi', 'mr'] as const;
const AT_REST = { checking: false, refused: [], failed: false } as const;

describe('setupWhatYouSellWords', () => {
  it.each(LANGUAGES)(
    'in %s: the two questions — three kinds of business in the set’s order, and a size in kWp',
    async (language) => {
      const { t } = await createTranslator(language);
      const words = setupWhatYouSellWords(t, AT_REST);
      expect(words).toMatchObject({
        title: WORDS[language].title,
        group: WORDS[language].group,
        options: WORDS[language].options,
        sizeHelper: WORDS[language].sizeHelper,
        sizeLabel: WORDS[language].sizeLabel,
        unit: 'kWp',
        sizeSource: WORDS[language].sizeSource,
      });
      expect(words.explainer).toMatchObject(WORDS[language].ask);
    },
  );

  it.each(LANGUAGES)(
    'in %s: at rest there is one way on, what it does in one line, and nothing refused',
    async (language) => {
      const { t } = await createTranslator(language);
      expect(setupWhatYouSellWords(t, AT_REST)).toMatchObject({
        failure: null,
        groupError: null,
        sizeError: null,
        primary: WORDS[language].continue,
        waiting: null,
        secondary: null,
        actLine: WORDS[language].savesBoth,
      });
    },
  );

  it.each(LANGUAGES)(
    'in %s: while the stored answers are read, the way on says why it waits, and no other line does',
    async (language) => {
      const { t } = await createTranslator(language);
      expect(setupWhatYouSellWords(t, { ...AT_REST, checking: true })).toMatchObject({
        primary: WORDS[language].continue,
        waiting: WORDS[language].stillChecking,
        actLine: null,
      });
    },
  );

  it.each(
    LANGUAGES.flatMap(
      (language) =>
        [
          { language, refused: ['segment', 'size'], group: true, size: true },
          { language, refused: ['segment'], group: true, size: false },
          { language, refused: ['size'], group: false, size: true },
        ] as const,
    ),
  )(
    'in $language: refused at $refused, each owed question says its fix and the act says nothing',
    async ({ language, refused, group, size }) => {
      const { t } = await createTranslator(language);
      expect(setupWhatYouSellWords(t, { ...AT_REST, refused })).toMatchObject({
        title: WORDS[language].title,
        groupError: group ? WORDS[language].pickOne : null,
        sizeError: size ? WORDS[language].addSize : null,
        primary: WORDS[language].continue,
        actLine: null,
      });
    },
  );

  it.each(LANGUAGES)(
    'in %s: a save that failed takes the title, with what fixes it, its own ask and two ways on',
    async (language) => {
      const { t } = await createTranslator(language);
      const words = setupWhatYouSellWords(t, { ...AT_REST, failed: true });
      expect(words).toMatchObject({
        title: WORDS[language].notSavedTitle,
        failure: WORDS[language].notSavedBody,
        primary: WORDS[language].tryAgain,
        secondary: WORDS[language].finishLater,
        actLine: WORDS[language].untilYouFinish,
      });
      expect(words.explainer).toMatchObject(WORDS[language].errorAsk);
    },
  );

  it.each(LANGUAGES)(
    'in %s: a failed save refused again keeps the failure and names the owed question',
    async (language) => {
      const { t } = await createTranslator(language);
      expect(
        setupWhatYouSellWords(t, { checking: false, refused: ['size'], failed: true }),
      ).toMatchObject({
        title: WORDS[language].notSavedTitle,
        failure: WORDS[language].notSavedBody,
        sizeError: WORDS[language].addSize,
        groupError: null,
        actLine: WORDS[language].untilYouFinish,
      });
    },
  );
});
