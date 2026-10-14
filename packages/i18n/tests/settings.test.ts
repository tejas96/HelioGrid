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
      proposal_templates: 'Proposal templates',
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
