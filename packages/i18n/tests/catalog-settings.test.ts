import type { CatalogSpec } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { CATALOG_EDITOR } from '../src/copy/catalog-editor';
import {
  catalogEditFailed,
  catalogNoSchemeFlag,
  catalogSpecLine,
  catalogViewOnly,
} from '../src/copy/catalog-settings';
import { catalogEditorChips, catalogItemsWords, catalogRowWords } from '../src/copy/catalog-words';
import { createTranslator } from '../src/runtime';

const number = (value: number) => String(value);
const money = (amount: string) => `₹${amount}`;

const PANEL: CatalogSpec = {
  kind: 'panel',
  watt: 545,
  technology: 'mono_perc',
  lengthMm: 2278,
  widthMm: 1134,
  vocV: 49.6,
  vmpV: 41.8,
  iscA: 14,
  impA: 13.2,
  tempCoeffVocPct: -0.25,
  warrantyYears: 30,
  weightKg: 27,
};

describe('Catalog settings words — the board, word for word', () => {
  it.each<[string, CatalogSpec, string]>([
    ['a panel', PANEL, 'Panel · 545 Wp · Mono PERC'],
    [
      'a micro-inverter',
      { kind: 'micro_inverter', ratedAcW: 366 } as CatalogSpec,
      'Micro-inverter · 366 W · 1 panel',
    ],
  ])('the spec line of %s', async (_case, spec, line) => {
    const { t } = await createTranslator('en');
    expect(catalogSpecLine(t, spec, number)).toBe(line);
  });

  it.each<[readonly string[], string]>([
    [['ALMM', 'DCR'], 'No ALMM or DCR flag recorded'],
    [['ALMM'], 'No ALMM flag recorded'],
  ])('names the market schemes an item lacks (%j)', async (schemes, words) => {
    const { t } = await createTranslator('en');
    expect(catalogNoSchemeFlag(t, schemes)).toBe(words);
  });

  it.each<[readonly string[], string]>([
    [['Rajesh'], 'View only — Rajesh or Operations edit.'],
    [[], 'View only — an owner or Operations edits.'],
  ])('the view-only line names whose acts these are (%j)', async (owners, line) => {
    const { t } = await createTranslator('en');
    expect(catalogViewOnly(t, owners)).toBe(line);
  });

  it('a failed edit says what is still true', async () => {
    const { t } = await createTranslator('en');
    expect(catalogEditFailed(t, 'shown')).toBe(
      "That didn't save — the catalog service didn't answer. The item is still in every picker.",
    );
  });

  it.each([
    [1, '1 open draft keeps it and its price; it leaves every picker until restored.'],
    [3, '3 open drafts keep it and its price; it leaves every picker until restored.'],
  ])('archive warning names the draft count (%i)', async (count, line) => {
    const { t } = await createTranslator('en');
    expect(t(CATALOG_EDITOR.archiveDrafts, { count })).toBe(line);
  });

  it('a row names each act for a screen reader', async () => {
    const { t } = await createTranslator('en');
    const row = catalogRowWords(
      t,
      {
        id: 'a',
        brand: 'Adani Solar',
        model: 'AS-7-545',
        spec: PANEL,
        layer: 'overridden',
        provenance: 'verified_datasheet',
        hidden: false,
        preferred: true,
        source: 'platform_item',
        amount: '14100',
      },
      number,
      money,
    );
    expect(row).toMatchObject({
      name: 'Adani Solar AS-7-545',
      layerWord: 'Overridden',
      priceFrom: 'Your override',
      labels: {
        prefer: 'Stop preferring Adani Solar AS-7-545',
        side: 'Hide Adani Solar AS-7-545 from pickers',
        row: 'Adani Solar AS-7-545, ₹14100',
      },
    });
  });

  it('the editor chips carry the spec label beside the headline figure', async () => {
    const { t } = await createTranslator('en');
    expect(catalogEditorChips(t, PANEL, 'verified_datasheet', number)).toEqual([
      'Panel',
      '545 Wp · Verified datasheet',
      'Mono PERC',
    ]);
  });

  it.each([
    [
      { count: 342, matched: null, archived: false, fresh: false, preferredFirst: true },
      '342 items · every kind · preferred first',
    ],
    [
      { count: 342, matched: 2, archived: false, fresh: false, preferredFirst: true },
      '2 of 342 items match · preferred first',
    ],
    [
      { count: 339, matched: null, archived: false, fresh: true, preferredFirst: true },
      '339 platform items · nothing of your own yet',
    ],
    [
      { count: 23, matched: null, archived: true, fresh: false, preferredFirst: true },
      '23 archived items · absent from every picker until restored',
    ],
  ])('the summary follows the list (%j)', async (list, summary) => {
    const { t } = await createTranslator('en');
    expect(catalogItemsWords(t, ['ALMM'], list).summary).toBe(summary);
  });

  it.each(['hi', 'mr'] as const)('every Items word is written in %s', async (language) => {
    const { t } = await createTranslator(language);
    const english = catalogItemsWords((await createTranslator('en')).t, ['ALMM', 'DCR'], {
      count: 2,
      matched: null,
      archived: false,
      fresh: false,
      preferredFirst: true,
    });
    const words = catalogItemsWords(t, ['ALMM', 'DCR'], {
      count: 2,
      matched: null,
      archived: false,
      fresh: false,
      preferredFirst: true,
    });
    for (const key of [
      'item',
      'noPrice',
      'hiddenFromPickers',
      'search',
      'loadFailedBody',
    ] as const) {
      expect(words[key]).not.toBe(english[key]);
    }
  });
});
