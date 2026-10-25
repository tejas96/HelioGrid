import { describe, expect, it } from 'vitest';
import type { CatalogImportField } from '../../src/catalog/import-columns';
import {
  type CatalogImportRowInput,
  type ImportCatalog,
  matchImportRows,
} from '../../src/catalog/import-matching';
import type { CatalogSpec } from '../../src/catalog/specs';
import { IN_FORMATS } from '../../src/format/pack';

/*
 * What a row's name matched, kept on the rows that do not write (D129), the earlier row a repeat
 * points back to, and several candidates narrowed by the kind the row names.
 */

const PANEL: CatalogSpec = {
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

/** A 5 kW single-phase string inverter, the second kind one own brand and model is sold as. */
const INVERTER: CatalogSpec = {
  kind: 'inverter',
  acKw: 5,
  phases: 1,
  mppt: { count: 2, minV: 90, maxV: 550, maxCurrentA: 12.5, stringsPerMppt: 1 },
  maxDcV: 600,
  efficiencyPct: 97.6,
};

const CATALOG: ImportCatalog = {
  platformItems: [{ id: 'p-waaree', brand: 'Waaree', model: 'WS-545', spec: PANEL }],
  ownItems: [
    { id: 'o-duo-panel', brand: 'Duo', model: 'D-5', spec: PANEL },
    { id: 'o-duo-inverter', brand: 'Duo', model: 'D-5', spec: INVERTER },
  ],
  currency: IN_FORMATS,
};

function row(
  cells: Partial<Record<CatalogImportField, string>>,
  leftOut = false,
): CatalogImportRowInput {
  return { cells, leftOut, answer: null };
}

const priced = (brand: string, model: string) => ({ brand, model, rate: '13,200' });

describe('matchImportRows — what a row named', () => {
  it('a repeated row names the repeat as its reason', () => {
    const [, second] = matchImportRows(
      [row(priced('Waaree', 'WS-545')), row(priced('Waaree', 'WS-545'))],
      CATALOG,
    );
    expect(second).toEqual({
      outcome: 'needs_attention',
      attention: [{ reason: 'repeated_in_file', fields: [] }],
      named: [{ source: 'platform_item', id: 'p-waaree' }],
      repeats: 0,
    });
  });

  it.each([
    ['the first of three', [false, false, false], [null, 0, 0]],
    ['the first row not left out', [true, false, false], [null, null, 1]],
  ] as const)('a repeat names %s as the row it repeats', (_, leftOut, repeats) => {
    const rows = leftOut.map((out) => row(priced('Waaree', 'WS-545'), out));
    expect(
      matchImportRows(rows, CATALOG).map((match) =>
        match.outcome === 'needs_attention' ? match.repeats : null,
      ),
    ).toEqual(repeats);
  });

  it('a row left out still names the product its name matched (D129)', () => {
    expect(matchImportRows([row(priced('Waaree', 'WS-545'), true)], CATALOG)).toEqual([
      { outcome: 'left_out', named: [{ source: 'platform_item', id: 'p-waaree' }] },
    ]);
  });

  it('a row left out with no name names nothing', () => {
    expect(matchImportRows([row({ rate: '10' }, true)], CATALOG)).toEqual([
      { outcome: 'left_out', named: [] },
    ]);
  });

  describe('several candidates are narrowed by the kind the row names', () => {
    it.each([
      [
        'a panel',
        'Panel',
        { outcome: 'own_item_price', ownItemId: 'o-duo-panel', rate: '13200.00' },
      ],
      [
        'an inverter',
        'Inverter',
        { outcome: 'own_item_price', ownItemId: 'o-duo-inverter', rate: '13200.00' },
      ],
    ] as const)('naming %s, the row matches it', (_, kind, match) => {
      expect(matchImportRows([row({ ...priced('Duo', 'D-5'), kind })], CATALOG)).toEqual([match]);
    });

    it.each([
      ['no kind', {}],
      ['a kind none of them is', { kind: 'Battery' }],
    ] as const)('naming %s, the row still asks which one', (_, kind) => {
      const [match] = matchImportRows([row({ ...priced('Duo', 'D-5'), ...kind })], CATALOG);
      expect(match).toEqual(
        expect.objectContaining({
          outcome: 'needs_attention',
          attention: [{ reason: 'several_matches', fields: [] }],
          named: [
            { source: 'own_item', id: 'o-duo-panel' },
            { source: 'own_item', id: 'o-duo-inverter' },
          ],
        }),
      );
    });
  });
});
