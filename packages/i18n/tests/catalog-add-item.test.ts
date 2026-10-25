import { type CertificationScheme, COMPONENT_KINDS, UI_LANGUAGES } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { catalogAddItemWords } from '../src/copy/catalog-add-item';
import { catalogItemFailureWords } from '../src/copy/catalog-add-item-fields';
import { createTranslator } from '../src/runtime';

const SCHEMES: readonly CertificationScheme[] = [
  { scheme: 'ALMM', evidence: 'list_reference' },
  { scheme: 'DCR', evidence: 'flag' },
];

const tIn = async (language: string) => (await createTranslator(language as never)).t;

const facts = {
  caller: 'settings' as const,
  schemes: SCHEMES,
  priced: true,
  copiedFrom: null,
};

describe('the add sheet’s words', () => {
  it.each(UI_LANGUAGES)('titles every kind (%s)', async (language) => {
    const t = await tIn(language);
    const titles = COMPONENT_KINDS.map((kind) => catalogAddItemWords(t, { ...facts, kind }).title);
    expect(new Set(titles).size).toBe(COMPONENT_KINDS.length);
    if (language !== 'en') {
      const english = await tIn('en');
      expect(titles).not.toContain(catalogAddItemWords(english, { ...facts, kind: 'panel' }).title);
    }
  });

  it.each([
    ['spec.lengthMm', 'exceeds', 'widthMm', 'Length must be more than Width.'],
    ['spec.vocV', 'exceeds', 'vmpV', 'Voc must be more than Vmp.'],
    [
      'spec.mppt.maxV',
      'exceeds',
      'mppt.minV',
      'MPPT high voltage must be more than MPPT low voltage.',
    ],
    ['spec.maxDcV', 'atLeast', 'mppt.maxV', 'Max DC voltage must be at least MPPT high voltage.'],
  ] as const)('words each gate with both fields: %s', async (path, issue, than, words) => {
    const t = await tIn('en');
    expect(catalogItemFailureWords(t, { path, issue, than })).toBe(words);
  });

  it.each([
    ['brand', 'required', 'Needed.'],
    ['brand', 'invalid', 'Up to 120 characters.'],
    ['spec.watt', 'invalid', 'Must be more than 0.'],
    ['spec.tempCoeffVocPct', 'invalid', 'Must be below 0.'],
    ['spec.efficiencyPct', 'invalid', 'Must be below 100.'],
    ['spec.bifacialityPct', 'invalid', 'Must be more than 0 and at most 100.'],
    ['spec.mppt.count', 'invalid', 'Must be a whole number above 0.'],
    ['certifications.ALMM', 'required', 'Enter the ALMM list reference, or switch it off.'],
  ] as const)('words a failed field: %s %s', async (path, issue, words) => {
    expect(catalogItemFailureWords(await tIn('en'), { path, issue })).toBe(words);
  });

  it('words each scheme by its evidence', async () => {
    const words = catalogAddItemWords(await tIn('en'), { ...facts, kind: 'panel' });
    expect(words.schemeRows).toEqual({
      ALMM: { label: 'ALMM listed', reference: 'ALMM list reference' },
      DCR: { label: 'DCR compliant', reference: null },
    });
    expect(words.schemeNote).toBe('Leave ALMM and DCR off and the item shows no badges.');
  });

  it.each([
    [
      'settings',
      true,
      null,
      'Add to catalog',
      'Adds it to your catalog, then shows its row in this list.',
    ],
    [
      'picker',
      true,
      null,
      'Add and select',
      'Adds it to your catalog and selects it in the picker.',
    ],
    [
      'picker',
      true,
      'Vikram Solar Somera 540',
      'Add and select',
      'Creates your own SKU; the platform item stays unchanged.',
    ],
    ['picker', false, null, 'Add and select', 'No price yet; a catalog manager adds it later.'],
  ] as const)(
    'names the act for a %s caller (priced %s)',
    async (caller, priced, copiedFrom, primary, line) => {
      const words = catalogAddItemWords(await tIn('en'), {
        kind: 'panel',
        schemes: SCHEMES,
        caller,
        priced,
        copiedFrom,
      });
      expect([words.primary, words.consequence]).toEqual([primary, line]);
      expect(words.needs.optionalValues.includes('Price')).toBe(priced);
    },
  );

  it('keeps units as symbols and words a counted unit', async () => {
    const t = await tIn('hi');
    const words = catalogAddItemWords(t, { ...facts, kind: 'battery' });
    expect(words.fields.usableKwh?.unit).toBe('kWh');
    expect(words.fields.cycleLife?.unit).not.toBe('cycles');
  });
});
