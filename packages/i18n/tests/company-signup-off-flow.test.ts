import { describe, expect, it } from 'vitest';
import { knownNumberWords, requestSentWords } from '../src/copy/company-signup-off-flow';
import { createTranslator } from '../src/runtime';

/**
 * The words of company signup's two frames off the flow (`SCR-M01-02`): the number that already
 * has an account (`M01-08`) and the request sent (`M01-09`). Both platforms draw what these return
 * and write none themselves.
 */
describe('knownNumberWords', () => {
  it.each([
    [
      'en',
      {
        title: 'That number already has an account',
        intro: 'Sign in to reach the company it belongs to.',
        finding: {
          title: 'Signing up again would not make a second company',
          body: 'To join another company, ask its owner to invite you.',
        },
        phoneLabel: 'Mobile number',
        enter: 'Sign in with this number',
        leave: 'Use a different number',
      },
      {
        label: 'About one account per number',
        title: 'One number, one account',
        pages: ['One mobile number is one HelioGrid account, whichever way you come in.'],
        nextLabel: 'Next',
        backLabel: 'Back',
      },
      '1 of 2',
    ],
    [
      'hi',
      {
        title: 'इस नंबर का खाता पहले से है',
        intro: 'जिस कंपनी का यह नंबर है, वहाँ पहुँचने के लिए साइन इन करें।',
        finding: {
          title: 'दोबारा साइन अप करने से दूसरी कंपनी नहीं बनेगी',
          body: 'किसी दूसरी कंपनी से जुड़ने के लिए, उसके मालिक से आपको आमंत्रित करने को कहें।',
        },
        phoneLabel: 'मोबाइल नंबर',
        enter: 'इस नंबर से साइन इन करें',
        leave: 'दूसरा नंबर इस्तेमाल करें',
      },
      {
        label: 'एक नंबर, एक खाते के बारे में',
        title: 'एक नंबर, एक खाता',
        pages: ['एक मोबाइल नंबर एक HelioGrid खाता है, आप किसी भी रास्ते से आएँ।'],
        nextLabel: 'आगे',
        backLabel: 'पीछे',
      },
      '2 में से 1',
    ],
    [
      'mr',
      {
        title: 'या नंबरचे खाते आधीच आहे',
        intro: 'हा नंबर ज्या कंपनीचा आहे तिथे पोहोचण्यासाठी साइन इन करा.',
        finding: {
          title: 'पुन्हा साइन अप केल्याने दुसरी कंपनी होणार नाही',
          body: 'दुसऱ्या कंपनीत सामील होण्यासाठी, तिच्या मालकाला तुम्हाला आमंत्रित करायला सांगा.',
        },
        phoneLabel: 'मोबाइल नंबर',
        enter: 'या नंबरने साइन इन करा',
        leave: 'दुसरा नंबर वापरा',
      },
      {
        label: 'एक नंबर, एक खाते याबद्दल',
        title: 'एक नंबर, एक खाते',
        pages: ['एक मोबाइल नंबर म्हणजे एक HelioGrid खाते, तुम्ही कोणत्याही मार्गाने आलात तरी.'],
        nextLabel: 'पुढे',
        backLabel: 'मागे',
      },
      '2 पैकी 1',
    ],
  ] as const)(
    'in %s: the finding, its rule behind the ask, the number as a fact and both roads',
    async (language, words, ask, position) => {
      const { t } = await createTranslator(language);
      const { explainer, ...rest } = knownNumberWords(t);
      expect(rest).toEqual(words);
      expect(explainer).toMatchObject(ask);
      expect(explainer.positionLabel(1, 2)).toBe(position);
    },
  );
});

describe('requestSentWords', () => {
  const company = { companyName: 'Suryodaya Solar Solutions Pvt Ltd', city: 'Pune' };

  it.each([
    [
      'en',
      {
        title: 'Your request is with the owner',
        body: 'When the owner of Suryodaya Solar Solutions Pvt Ltd, Pune adds you, an SMS to your number brings you straight in.',
        sentAs: 'Sent as',
        prompt: 'Changed your mind, or it is not the same company?',
        createInstead: 'Create your own company instead',
      },
    ],
    [
      'hi',
      {
        title: 'आपका अनुरोध मालिक के पास है',
        body: 'जब Suryodaya Solar Solutions Pvt Ltd, Pune के मालिक आपको जोड़ेंगे, तो आपके नंबर पर आया SMS आपको सीधे अंदर ले आएगा।',
        sentAs: 'इस नाम से भेजा',
        prompt: 'मन बदल गया, या यह वही कंपनी नहीं है?',
        createInstead: 'इसके बजाय अपनी कंपनी बनाएँ',
      },
    ],
    [
      'mr',
      {
        title: 'तुमची विनंती मालकाकडे आहे',
        body: 'Suryodaya Solar Solutions Pvt Ltd, Pune चे मालक तुम्हाला जोडतील, तेव्हा तुमच्या नंबरवर येणारा SMS तुम्हाला थेट आत आणेल.',
        sentAs: 'या नावाने पाठवली',
        prompt: 'विचार बदलला, किंवा ही तीच कंपनी नाही?',
        createInstead: 'त्याऐवजी तुमची स्वतःची कंपनी तयार करा',
      },
    ],
  ] as const)(
    'in %s: what was sent and to whom, naming the company and its city, and the one route back',
    async (language, words) => {
      const { t } = await createTranslator(language);
      expect(requestSentWords(t, company)).toEqual(words);
    },
  );
});
