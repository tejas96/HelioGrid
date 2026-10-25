import { NO_CATALOG_FILTER } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { catalogAskOf } from '../../src/react/use-catalog-items';

/** The list's question as Catalog settings sends it (`M01-37`, `M01-38`). */
describe('catalogAskOf — the list question', () => {
  it('always keeps hidden items and sends no filter that is off', () => {
    expect(catalogAskOf({ q: '  ', filter: NO_CATALOG_FILTER, sort: 'preferred' }, 1, 20)).toEqual({
      page: 1,
      limit: 20,
      sort: 'preferred',
      includeHidden: 'true',
    });
  });

  it('sends every filter that is on, lists as comma lists', () => {
    const ask = catalogAskOf(
      {
        q: ' adani ',
        sort: 'price',
        filter: {
          source: 'own_item',
          kinds: ['panel', 'inverter'],
          wattMin: 500,
          wattMax: 600,
          technology: 'topcon',
          schemes: ['ALMM', 'DCR'],
          preferredOnly: true,
          archived: true,
        },
      },
      2,
      20,
    );
    expect(ask).toEqual({
      page: 2,
      limit: 20,
      sort: 'price',
      includeHidden: 'true',
      q: 'adani',
      source: 'own_item',
      kinds: 'panel,inverter',
      wattMin: 500,
      wattMax: 600,
      technology: 'topcon',
      schemes: 'ALMM,DCR',
      preferred: 'true',
      archived: 'true',
    });
  });
});
