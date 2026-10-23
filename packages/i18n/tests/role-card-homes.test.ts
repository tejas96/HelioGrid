import {
  HOME_LADDER,
  ROLE_PRESETS,
  type RolePreset,
  roleCard,
  type UiLanguage,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { roleCardWords } from '../src/copy/role-card';
import { createTranslator } from '../src/runtime';

/** The role card's act and the line under it, for every home, in every language (`SCR-M01-10`). */

const [OWNER] = ROLE_PRESETS;

async function wordsFor(roles: readonly RolePreset[], reader: UiLanguage) {
  const { t } = await createTranslator(reader);
  return roleCardWords(t, roleCard(roles), { companyName: null, setterName: null, owners: null });
}

/** In `HOME_LADDER` order: the act on a card whose home it is, in en, hi and mr (RFC §5). */
const ACT_BY_HOME: readonly (readonly [string, string, string])[] = [
  ['Go to the dashboard', 'डैशबोर्ड पर जाएँ', 'डॅशबोर्डवर जा'],
  ['Go to the dashboard', 'डैशबोर्ड पर जाएँ', 'डॅशबोर्डवर जा'],
  ['Go to operations', 'ऑपरेशंस पर जाएँ', 'ऑपरेशन्सवर जा'],
  ['Go to the project board', 'प्रोजेक्ट बोर्ड पर जाएँ', 'प्रोजेक्ट बोर्डवर जा'],
  ['Go to campaigns', 'कैंपेन पर जाएँ', 'कॅम्पेनवर जा'],
  ['Go to finance', 'फ़ाइनेंस पर जाएँ', 'फायनान्सवर जा'],
  ['Go to people today', '‘आज के लोग’ पर जाएँ', '‘आजचे लोक’ वर जा'],
  ['Go to my day', 'मेरे दिन पर जाएँ', 'माझ्या दिवसावर जा'],
  ['Go to the design queue', 'डिज़ाइन क्यू पर जाएँ', 'डिझाइन क्यूवर जा'],
  ['Go to my visits', 'मेरी विज़िट पर जाएँ', 'माझ्या भेटींवर जा'],
  ['Go to my day', 'मेरे दिन पर जाएँ', 'माझ्या दिवसावर जा'],
  ['Go to my job', 'मेरे जॉब पर जाएँ', 'माझ्या जॉबवर जा'],
];

/**
 * In `HOME_LADDER` order from its third rung: the line at the act when that home waits behind the
 * Owner's dashboard. The first two rungs are never a next home with another title: both are the
 * dashboard.
 */
const LINE_BY_NEXT_HOME: readonly (readonly [string, string, string])[] = [
  [
    'Your operations view is one switch away.',
    'आपका ऑपरेशंस व्यू बस एक स्विच दूर है।',
    'तुमचे ऑपरेशन्स व्ह्यू फक्त एका स्विचवर आहे.',
  ],
  [
    'Your projects are one switch away.',
    'आपके प्रोजेक्ट बस एक स्विच दूर हैं।',
    'तुमचे प्रोजेक्ट फक्त एका स्विचवर आहेत.',
  ],
  [
    'Your campaigns are one switch away.',
    'आपके कैंपेन बस एक स्विच दूर हैं।',
    'तुमचे कॅम्पेन फक्त एका स्विचवर आहेत.',
  ],
  [
    'Your money view is one switch away.',
    'आपका पैसों का व्यू बस एक स्विच दूर है।',
    'तुमचे पैशांचे व्ह्यू फक्त एका स्विचवर आहे.',
  ],
  [
    'Your people view is one switch away.',
    'आपका लोगों का व्यू बस एक स्विच दूर है।',
    'तुमचे लोकांचे व्ह्यू फक्त एका स्विचवर आहे.',
  ],
  ['Your day is one switch away.', 'आपका दिन बस एक स्विच दूर है।', 'तुमचा दिवस फक्त एका स्विचवर आहे.'],
  [
    'Your designs are one switch away.',
    'आपके डिज़ाइन बस एक स्विच दूर हैं।',
    'तुमचे डिझाइन फक्त एका स्विचवर आहेत.',
  ],
  [
    'Your visits are one switch away.',
    'आपकी विज़िट बस एक स्विच दूर हैं।',
    'तुमच्या भेटी फक्त एका स्विचवर आहेत.',
  ],
  ['Your day is one switch away.', 'आपका दिन बस एक स्विच दूर है।', 'तुमचा दिवस फक्त एका स्विचवर आहे.'],
  ['Your job is one switch away.', 'आपका जॉब बस एक स्विच दूर है।', 'तुमचा जॉब फक्त एका स्विचवर आहे.'],
];

const READERS = ['en', 'hi', 'mr'] as const satisfies readonly UiLanguage[];

describe('roleCardWords — act and line per home', () => {
  it.each(
    HOME_LADDER.flatMap((home, rung) =>
      READERS.map((reader, column) => ({ home, reader, act: ACT_BY_HOME[rung]?.[column] })),
    ),
  )('$home alone in $reader: $act', async ({ home, reader, act }) => {
    expect((await wordsFor([home], reader)).act).toBe(act);
  });

  it.each(
    HOME_LADDER.slice(2).flatMap((next, rung) =>
      READERS.map((reader, column) => ({ next, reader, line: LINE_BY_NEXT_HOME[rung]?.[column] })),
    ),
  )('the Owner with $next in $reader: $line', async ({ next, reader, line }) => {
    expect((await wordsFor([OWNER, next], reader)).atAct).toBe(line);
  });
});
