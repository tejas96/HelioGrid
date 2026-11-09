import { SETTINGS_GROUPS, SETTINGS_ROWS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { settingsRowName, settingsWords } from '../src/copy/settings';
import { createTranslator } from '../src/runtime';

/**
 * The settings list behind `More` (`SCR-SHELL-01`, *More: the settings list*): the title, the six
 * groups in the person's words and the twelve rows, each its screen's register name shortened. The
 * Hindi and Marathi are the catalog's working words.
 */
const WORDS = {
  en: {
    title: 'Settings',
    summary: 'You, your team and your company, in one place.',
    hints: {
      profile: 'Your photo, language and theme',
      team: 'Who works here and what they can do',
      roles: 'What each role sees and does',
      company_profile: 'Address, tax number and bank',
      branding: 'Logo and colours on every proposal',
      proposal_templates: 'How your proposals read and look',
      payment_terms: 'The stages your customers pay in',
      catalog: 'Items and prices your proposals use',
      agent: 'The voice that calls your leads',
      collections: 'Payments due and received',
      billing: 'Your plan, invoices and payment method',
      usage: 'What this cycle has used',
    },
    groups: {
      you: 'You',
      team: 'Your team',
      company: 'Your company',
      catalog: 'What you sell',
      agent: 'Customer calls',
      money: 'Money',
    },
    rows: {
      profile: 'Profile & preferences',
      team: 'Team',
      roles: 'Roles reference',
      company_profile: 'Business profile',
      branding: 'Branding',
      proposal_templates: 'Proposal template',
      payment_terms: 'Payment terms',
      catalog: 'Catalog',
      agent: 'Agent & voice',
      collections: 'Collections',
      billing: 'Billing',
      usage: 'Usage',
    },
  },
  hi: {
    title: 'सेटिंग्स',
    summary: 'आप, आपकी टीम और आपकी कंपनी, एक ही जगह।',
    hints: {
      profile: 'आपकी फ़ोटो, भाषा और थीम',
      team: 'यहाँ कौन काम करता है और वे क्या कर सकते हैं',
      roles: 'हर भूमिका क्या देखती और करती है',
      company_profile: 'पता, टैक्स नंबर और बैंक',
      branding: 'हर प्रस्ताव पर लोगो और रंग',
      proposal_templates: 'आपके प्रस्ताव कैसे पढ़े और दिखें',
      payment_terms: 'वे चरण जिनमें आपके ग्राहक भुगतान करते हैं',
      catalog: 'आपके प्रस्तावों में लगने वाले आइटम और कीमतें',
      agent: 'वह आवाज़ जो आपकी लीड्स को कॉल करती है',
      collections: 'बाकी और मिले भुगतान',
      billing: 'आपका प्लान, इनवॉइस और भुगतान का तरीका',
      usage: 'इस चक्र में क्या इस्तेमाल हुआ',
    },
    groups: {
      you: 'आप',
      team: 'आपकी टीम',
      company: 'आपकी कंपनी',
      catalog: 'आप क्या बेचते हैं',
      agent: 'ग्राहक कॉल',
      money: 'पैसा',
    },
    rows: {
      profile: 'प्रोफ़ाइल और पसंद',
      team: 'टीम',
      roles: 'भूमिकाओं की जानकारी',
      company_profile: 'व्यवसाय प्रोफ़ाइल',
      branding: 'ब्रांडिंग',
      proposal_templates: 'प्रस्ताव टेम्पलेट',
      payment_terms: 'भुगतान की शर्तें',
      catalog: 'कैटलॉग',
      agent: 'एजेंट और आवाज़',
      collections: 'वसूली',
      billing: 'बिलिंग',
      usage: 'उपयोग',
    },
  },
  mr: {
    title: 'सेटिंग्ज',
    summary: 'तुम्ही, तुमची टीम आणि तुमची कंपनी, एकाच ठिकाणी.',
    hints: {
      profile: 'तुमचा फोटो, भाषा आणि थीम',
      team: 'इथे कोण काम करते आणि ते काय करू शकतात',
      roles: 'प्रत्येक भूमिका काय पाहते आणि करते',
      company_profile: 'पत्ता, कर क्रमांक आणि बँक',
      branding: 'प्रत्येक प्रस्तावावर लोगो आणि रंग',
      proposal_templates: 'तुमचे प्रस्ताव कसे वाचले जातात आणि कसे दिसतात',
      payment_terms: 'ज्या टप्प्यांत तुमचे ग्राहक पैसे भरतात',
      catalog: 'तुमच्या प्रस्तावांमध्ये वापरले जाणारे आयटम आणि किंमती',
      agent: 'तुमच्या लीड्सना कॉल करणारा आवाज',
      collections: 'देय आणि मिळालेली पेमेंट्स',
      billing: 'तुमचा प्लॅन, इनव्हॉइस आणि पेमेंटची पद्धत',
      usage: 'या चक्रात काय वापरले',
    },
    groups: {
      you: 'तुम्ही',
      team: 'तुमची टीम',
      company: 'तुमची कंपनी',
      catalog: 'तुम्ही काय विकता',
      agent: 'ग्राहक कॉल',
      money: 'पैसे',
    },
    rows: {
      profile: 'प्रोफाइल आणि प्राधान्ये',
      team: 'टीम',
      roles: 'भूमिकांची माहिती',
      company_profile: 'व्यवसाय प्रोफाइल',
      branding: 'ब्रँडिंग',
      proposal_templates: 'प्रस्ताव टेम्पलेट',
      payment_terms: 'पेमेंटच्या अटी',
      catalog: 'कॅटलॉग',
      agent: 'एजंट आणि आवाज',
      collections: 'वसुली',
      billing: 'बिलिंग',
      usage: 'वापर',
    },
  },
} as const;

describe('settingsWords — the list in each language', () => {
  it.each(['en', 'hi', 'mr'] as const)('%s', async (language) => {
    const { t } = await createTranslator(language);
    expect(settingsWords(t)).toEqual(WORDS[language]);
  });

  it('names every group and every row, so no row can draw its key', async () => {
    const { t } = await createTranslator('hi');
    const words = settingsWords(t);
    for (const group of SETTINGS_GROUPS) expect(words.groups[group]).not.toBe(group);
    for (const row of SETTINGS_ROWS) {
      expect(words.rows[row]).not.toBe(row);
      expect(settingsRowName(t, row)).toBe(words.rows[row]);
    }
  });
});
