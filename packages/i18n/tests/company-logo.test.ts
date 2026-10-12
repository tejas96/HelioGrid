/**
 * The logo's words on the company profile (`SCR-M01-05`, `logo-invalid-limits-stated`), against the
 * real catalogs. No board frame draws them in Hindi or Marathi: every Hindi and Marathi line below
 * is a draft for the native review.
 */
import { COMPANY_LOGO_LIMITS, type CompanyLogoRefusal } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { companyLogoCapture, companyLogoWords } from '../src/copy/company-logo';
import { companyProfileWords } from '../src/copy/company-profile-words';
import { createTranslator } from '../src/runtime';
import { AT_SIGNUP } from './company-profile-facts';

const refused = (missed: CompanyLogoRefusal['missed']): CompanyLogoRefusal => ({
  missed,
  megabytes: 3.4,
  widthPx: 320,
});
const SIZE_AND_WIDTH = refused(['size', 'width']);

describe('companyLogoWords — the capture area at rest', () => {
  it.each([
    [
      'en',
      {
        add: 'Add your logo',
        held: 'Your logo',
        hintTouch: 'Tap to choose a file',
        hintDrop: 'Choose a file or drop one here',
        limits: 'PNG or JPG, up to 2 MB, at least 400 px wide',
        refusal: null,
      },
    ],
    [
      'hi',
      {
        add: 'अपना लोगो जोड़ें',
        held: 'आपका लोगो',
        hintTouch: 'फ़ाइल चुनने के लिए टैप करें',
        hintDrop: 'फ़ाइल चुनें या यहाँ छोड़ें',
        limits: 'PNG या JPG, अधिकतम 2 MB, कम से कम 400 px चौड़ा',
        refusal: null,
      },
    ],
    [
      'mr',
      {
        add: 'तुमचा लोगो जोडा',
        held: 'तुमचा लोगो',
        hintTouch: 'फाइल निवडण्यासाठी टॅप करा',
        hintDrop: 'फाइल निवडा किंवा येथे टाका',
        limits: 'PNG किंवा JPG, कमाल 2 MB, किमान 400 px रुंद',
        refusal: null,
      },
    ],
  ] as const)('reads whole in %s', async (reader, words) => {
    const { t } = await createTranslator(reader);
    expect(companyLogoWords(t, { limits: COMPANY_LOGO_LIMITS, refusal: null })).toEqual(words);
  });

  it('names the two types the limits hold: a third type needs new words', () => {
    expect(COMPANY_LOGO_LIMITS.contentTypes).toEqual(['image/png', 'image/jpeg']);
  });
});

describe('companyLogoWords — a refused image is told every limit it missed, and no other', () => {
  it.each([
    ['en', SIZE_AND_WIDTH, '3.4 MB, 320 px wide · needs 2 MB or less, at least 400 px'],
    ['en', refused(['size']), '3.4 MB · needs 2 MB or less'],
    ['en', refused(['width']), '320 px wide · needs at least 400 px'],
    ['en', refused(['type']), 'Needs a PNG or JPG'],
    ['hi', SIZE_AND_WIDTH, '3.4 MB, 320 px चौड़ा · 2 MB या कम, कम से कम 400 px चाहिए'],
    ['hi', refused(['size']), '3.4 MB · 2 MB या कम चाहिए'],
    ['hi', refused(['width']), '320 px चौड़ा · कम से कम 400 px चाहिए'],
    ['hi', refused(['type']), 'PNG या JPG चाहिए'],
    ['mr', SIZE_AND_WIDTH, '3.4 MB, 320 px रुंद · 2 MB किंवा कमी, किमान 400 px हवे'],
    ['mr', refused(['size']), '3.4 MB · 2 MB किंवा कमी हवे'],
    ['mr', refused(['width']), '320 px रुंद · किमान 400 px हवे'],
    ['mr', refused(['type']), 'PNG किंवा JPG हवे'],
  ] as const)('in %s, %j reads %s', async (reader, refusal, line) => {
    const { t } = await createTranslator(reader);
    expect(companyLogoWords(t, { limits: COMPANY_LOGO_LIMITS, refusal }).refusal).toBe(line);
  });

  it.each(['en', 'hi', 'mr'] as const)(
    'in %s no limit is typed into a line: other limits print their own numbers',
    async (reader) => {
      const { t } = await createTranslator(reader);
      const limits = { ...COMPANY_LOGO_LIMITS, maxBytes: 5_000_000, minWidthPx: 600 };
      const lines = [SIZE_AND_WIDTH, refused(['size']), refused(['width'])].map((refusal) =>
        companyLogoWords(t, { limits, refusal }),
      );
      expect(lines[0]?.limits).toMatch(/5 MB.*600 px/);
      expect(lines.map((words) => words.refusal).join(' | ')).toMatch(
        /5 MB.*600 px.* \| .*5 MB.* \| .*600 px/,
      );
      expect(JSON.stringify(lines)).not.toMatch(/\b2 MB|400/);
    },
  );
});

const AT_REST = { limits: COMPANY_LOGO_LIMITS, refusal: null, held: false };

describe('companyLogoCapture — the area as the company profile draws it', () => {
  it.each([
    [
      'en',
      'Add your logo',
      'Tap to choose a file · PNG or JPG, up to 2 MB, at least 400 px wide',
      'Choose a file or drop one here · PNG or JPG, up to 2 MB, at least 400 px wide',
    ],
    [
      'hi',
      'अपना लोगो जोड़ें',
      'फ़ाइल चुनने के लिए टैप करें · PNG या JPG, अधिकतम 2 MB, कम से कम 400 px चौड़ा',
      'फ़ाइल चुनें या यहाँ छोड़ें · PNG या JPG, अधिकतम 2 MB, कम से कम 400 px चौड़ा',
    ],
    [
      'mr',
      'तुमचा लोगो जोडा',
      'फाइल निवडण्यासाठी टॅप करा · PNG किंवा JPG, कमाल 2 MB, किमान 400 px रुंद',
      'फाइल निवडा किंवा येथे टाका · PNG किंवा JPG, कमाल 2 MB, किमान 400 px रुंद',
    ],
  ] as const)(
    'at rest in %s it names the act, and each hint is followed by the limits',
    async (reader, name, hint, hintPointer) => {
      const { t } = await createTranslator(reader);
      expect(companyLogoCapture(t, AT_REST)).toEqual({
        name,
        hint,
        hintPointer,
        refusal: null,
        held: false,
      });
    },
  );

  it.each([
    ['en', 'Your logo', 'PNG or JPG, up to 2 MB, at least 400 px wide'],
    ['hi', 'आपका लोगो', 'PNG या JPG, अधिकतम 2 MB, कम से कम 400 px चौड़ा'],
    ['mr', 'तुमचा लोगो', 'PNG किंवा JPG, कमाल 2 MB, किमान 400 px रुंद'],
  ] as const)(
    'a held logo in %s is named, and both hints are the limits alone',
    async (reader, name, limits) => {
      const { t } = await createTranslator(reader);
      expect(companyLogoCapture(t, { ...AT_REST, held: true })).toEqual({
        name,
        hint: limits,
        hintPointer: limits,
        refusal: null,
        held: true,
      });
    },
  );

  it('carries a refusal as its own line, and keeps the name and the hints', async () => {
    const { t } = await createTranslator('en');
    const capture = companyLogoCapture(t, { ...AT_REST, refusal: SIZE_AND_WIDTH });
    expect(capture).toEqual({
      ...companyLogoCapture(t, AT_REST),
      refusal: '3.4 MB, 320 px wide · needs 2 MB or less, at least 400 px',
    });
  });
});

describe('companyProfileWords — the logo on the screen’s words', () => {
  it('holds the capture area when the screen is handed the logo’s facts', async () => {
    const { t } = await createTranslator('en');
    expect(companyProfileWords(t, { ...AT_SIGNUP, logo: AT_REST }).logo).toEqual(
      companyLogoCapture(t, AT_REST),
    );
  });

  it('holds none when the screen is handed none', async () => {
    const { t } = await createTranslator('en');
    expect(companyProfileWords(t, AT_SIGNUP).logo).toBeNull();
  });
});
