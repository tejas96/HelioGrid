import { describe, expect, it } from 'vitest';
import type { CatalogImportConflictAnswer } from '../../src/catalog/import';
import type { CatalogImportField } from '../../src/catalog/import-columns';
import {
  type CatalogImportRowInput,
  type ImportCatalog,
  matchImportRows,
} from '../../src/catalog/import-matching';
import { importProductNames } from '../../src/catalog/import-text';
import type { CatalogSpec } from '../../src/catalog/specs';
import { IN_FORMATS } from '../../src/format/pack';

/** Waaree's 545 Wp module as the platform book states it. */
const WAAREE_SPEC: CatalogSpec = {
  kind: 'panel',
  watt: 545,
  technology: 'mono_perc',
  lengthMm: 2279,
  widthMm: 1134,
  vocV: 49.6,
  vmpV: 41.8,
  iscA: 13.9,
  impA: 13.04,
  tempCoeffVocPct: -0.27,
};

const CATALOG: ImportCatalog = Object.freeze({
  platformItems: Object.freeze([
    Object.freeze({
      id: 'p-waaree',
      brand: 'Waaree',
      model: 'WS-545',
      spec: Object.freeze(WAAREE_SPEC),
    }),
    Object.freeze({
      id: 'p-adani',
      brand: 'Adani',
      model: 'ASP-550',
      spec: Object.freeze({ ...WAAREE_SPEC, watt: 550 }),
    }),
    Object.freeze({
      id: 'p-loom',
      brand: 'Loom',
      model: 'LS-400',
      spec: Object.freeze({ ...WAAREE_SPEC, watt: 400 }),
    }),
  ]),
  ownItems: Object.freeze([
    Object.freeze({
      id: 'o-loom',
      brand: 'Loom',
      model: 'LS-400',
      spec: Object.freeze({ ...WAAREE_SPEC, watt: 400 }),
    }),
    Object.freeze({
      id: 'o-twin-1',
      brand: 'Twin',
      model: 'T-1',
      spec: Object.freeze(WAAREE_SPEC),
    }),
    Object.freeze({
      id: 'o-twin-2',
      brand: 'Twin',
      model: 'T-1',
      spec: Object.freeze(WAAREE_SPEC),
    }),
  ]),
  currency: IN_FORMATS,
});

/** A new inverter with every field its envelope requires, as cells. */
const INVERTER_CELLS: Partial<Record<CatalogImportField, string>> = {
  kind: 'Inverter',
  acKw: '5',
  phases: 'Single phase',
  'mppt.count': '2',
  'mppt.minV': '90',
  'mppt.maxV': '550',
  'mppt.maxCurrentA': '12.5',
  'mppt.stringsPerMppt': '1',
  maxDcV: '600',
  efficiencyPct: '97.6%',
};

function row(
  cells: Partial<Record<CatalogImportField, string>>,
  answer: CatalogImportConflictAnswer | null = null,
  leftOut = false,
): CatalogImportRowInput {
  return { cells, leftOut, answer };
}

const priced = (brand: string, model: string, rate = '13,200') => ({ brand, model, rate });

describe('matchImportRows — the matching pass (M01-41, §M01.4 edge cases)', () => {
  it.each([
    [
      'a platform item',
      priced('Waaree', 'WS-545'),
      { outcome: 'price_override', platformItemId: 'p-waaree', rate: '13200.00' },
    ],
    [
      'an own SKU, which wins over the platform item it copies',
      priced('Loom', 'LS-400'),
      { outcome: 'own_item_price', ownItemId: 'o-loom', rate: '13200.00' },
    ],
    [
      'outer spaces around brand and model',
      priced('  Waaree ', ' WS-545  '),
      { outcome: 'price_override', platformItemId: 'p-waaree', rate: '13200.00' },
    ],
    [
      'a matching spec cell',
      { ...priced('Waaree', 'WS-545'), watt: '545 Wp', kind: 'Module' },
      { outcome: 'price_override', platformItemId: 'p-waaree', rate: '13200.00' },
    ],
  ] as const)('a row naming %s becomes a price on it', (_, cells, match) => {
    expect(matchImportRows([row(cells)], CATALOG)).toEqual([match]);
  });

  it('a row matching nothing becomes a new item with its whole spec and price', () => {
    const [match] = matchImportRows(
      [row({ ...priced('Havells', 'HX-5K', '52,000'), ...INVERTER_CELLS })],
      CATALOG,
    );
    expect(match).toEqual({
      outcome: 'new_item',
      brand: 'Havells',
      model: 'HX-5K',
      rate: '52000.00',
      spec: {
        kind: 'inverter',
        acKw: 5,
        phases: 1,
        mppt: { count: 2, minV: 90, maxV: 550, maxCurrentA: 12.5, stringsPerMppt: 1 },
        maxDcV: 600,
        efficiencyPct: 97.6,
      },
    });
  });

  it.each([
    [
      'a different case is a different product (F3-08)',
      priced('WAAREE', 'WS-545'),
      [{ reason: 'kind_missing', fields: [] }],
    ],
    ['no brand', priced('', 'WS-545'), [{ reason: 'brand_or_model_missing', fields: [] }]],
    [
      'no model and no price',
      { brand: 'Waaree' },
      [
        { reason: 'brand_or_model_missing', fields: [] },
        { reason: 'price_missing', fields: [] },
      ],
    ],
    [
      'an unreadable price on a match',
      priced('Waaree', 'WS-545', '2,380/pc'),
      [{ reason: 'price_unreadable', fields: [] }],
    ],
    [
      'two own SKUs with one brand and model',
      priced('Twin', 'T-1'),
      [{ reason: 'several_matches', fields: [] }],
    ],
    [
      'a new item with no kind',
      priced('Havells', 'HX-5K'),
      [{ reason: 'kind_missing', fields: [] }],
    ],
    [
      'a new item whose kind no sheet word names',
      { ...priced('Havells', 'HX-5K'), kind: 'Cable' },
      [{ reason: 'kind_missing', fields: [] }],
    ],
    [
      'a new item short of fields',
      { ...priced('Havells', 'HX-5K'), kind: 'Inverter', acKw: '5' },
      [{ reason: 'spec_missing', fields: ['phases', 'mppt', 'maxDcV', 'efficiencyPct'] }],
    ],
    [
      'a new item with an unreadable field',
      { ...priced('Havells', 'HX-5K'), ...INVERTER_CELLS, acKw: 'five' },
      [{ reason: 'spec_invalid', fields: ['acKw'] }],
    ],
    [
      'a new item failing a gate',
      { ...priced('Havells', 'HX-5K'), ...INVERTER_CELLS, maxDcV: '500' },
      [{ reason: 'spec_invalid', fields: ['maxDcV'] }],
    ],
  ] as const)('%s needs attention', (_, cells, attention) => {
    expect(matchImportRows([row(cells)], CATALOG)).toEqual([
      { outcome: 'needs_attention', attention },
    ]);
  });

  describe('a spec conflict on a match is a question, and no answer edits the platform (AC-5)', () => {
    const conflicting = { ...priced('Waaree', 'WS-545'), watt: '540', kind: 'Inverter' };

    it('unanswered, it needs attention naming the fields that disagree', () => {
      expect(matchImportRows([row(conflicting)], CATALOG)).toEqual([
        {
          outcome: 'needs_attention',
          attention: [{ reason: 'spec_conflict', fields: ['kind', 'watt'] }],
        },
      ]);
    });

    it('answered "keep the catalog spec", it is a price override that carries no spec', () => {
      const [match] = matchImportRows([row(conflicting, 'keep_catalog_spec')], CATALOG);
      expect(match).toEqual({
        outcome: 'price_override',
        platformItemId: 'p-waaree',
        rate: '13200.00',
      });
    });

    it('answered "import as my own SKU", it is held to a new item\'s whole envelope', () => {
      const asOwn = { ...priced('Waaree', 'WS-545'), ...INVERTER_CELLS };
      expect(matchImportRows([row(asOwn, 'import_as_own_item')], CATALOG)).toEqual([
        expect.objectContaining({ outcome: 'new_item', brand: 'Waaree', model: 'WS-545' }),
      ]);
    });

    it.each([
      ['unanswered', 'needs_attention', null],
      [
        'answered "import as my own SKU", which an own SKU already is',
        'needs_attention',
        'import_as_own_item',
      ],
      ['answered "keep the catalog spec"', 'own_item_price', 'keep_catalog_spec'],
    ] as const)('on an own SKU, a conflict %s is %s', (_, outcome, answer) => {
      const conflicting = { ...priced('Loom', 'LS-400'), watt: '410' };
      expect(matchImportRows([row(conflicting, answer)], CATALOG)).toEqual([
        expect.objectContaining({ outcome }),
      ]);
    });

    it('the platform item is byte-identical after every answer', () => {
      const before = JSON.stringify(CATALOG);
      for (const answer of [null, 'keep_catalog_spec', 'import_as_own_item'] as const) {
        matchImportRows([row(conflicting, answer)], CATALOG);
      }
      expect(JSON.stringify(CATALOG)).toBe(before);
    });
  });

  it.each([
    [
      'the second of two rows naming one product asks which is meant',
      [false, false],
      ['price_override', 'needs_attention'],
    ],
    [
      'a first row left out leaves the second to match',
      [true, false],
      ['left_out', 'price_override'],
    ],
  ] as const)('%s', (_, leftOut, outcomes) => {
    const rows = leftOut.map((out) => row(priced('Waaree', 'WS-545'), null, out));
    expect(matchImportRows(rows, CATALOG).map((match) => match.outcome)).toEqual(outcomes);
  });

  it('a repeated row names the repeat as its reason', () => {
    const [, second] = matchImportRows(
      [row(priced('Waaree', 'WS-545')), row(priced('Waaree', 'WS-545'))],
      CATALOG,
    );
    expect(second).toEqual({
      outcome: 'needs_attention',
      attention: [{ reason: 'repeated_in_file', fields: [] }],
    });
  });
});

describe('importProductNames — what the pass reads from the catalog', () => {
  it('names each product once, outer spaces aside, and skips a row missing either half', () => {
    const rows = [
      { cells: { brand: ' Waaree ', model: 'WS-545' } },
      { cells: { brand: 'Waaree', model: ' WS-545 ' } },
      { cells: { brand: 'Waaree' } },
      { cells: { brand: '  ', model: 'WS-550' } },
      { cells: { brand: 'Adani', model: 'ASB-540' } },
    ];
    expect(importProductNames(rows)).toEqual([
      { brand: 'Waaree', model: 'WS-545' },
      { brand: 'Adani', model: 'ASB-540' },
    ]);
  });
});
