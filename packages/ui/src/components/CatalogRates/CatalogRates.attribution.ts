import type { DataTableColumn } from '../DataTable/DataTable.types';
import type { ValueSourceSpec } from '../ValueSource/ValueSource.types';
import type { CatalogAttributionRow, CatalogAttributionWords } from './CatalogRates.types';

/** The attribution table always stacks: m15-d draws it at 375 only, as cards. */
export const ATTRIBUTION_STACK_BELOW = 4000;

/**
 * The attribution table's columns, one set for both halves (m15-d): each field's value with the
 * layer that supplied it — *Your override* when the company set it, *Default* when it did not.
 */
export function attributionColumns(
  words: CatalogAttributionWords,
): DataTableColumn<CatalogAttributionRow>[] {
  const from = (own: boolean): ValueSourceSpec =>
    own
      ? { level: 'own', layerName: words.yourOverride }
      : { level: 'inherited', layerName: words.defaultSource };
  return [
    { key: 'name', label: words.item, primary: true },
    { key: 'what', label: words.whatItIs, secondary: true },
    {
      key: 'price',
      label: words.price,
      trailing: true,
      numeric: true,
      gap: (row) => (row.price === null ? words.noPrice : null),
    },
    { key: 'priceFrom', label: words.priceFrom },
    {
      key: 'tax',
      label: words.taxRate,
      gap: (row) => (row.tax === null ? words.noMarketRate : null),
      attribution: (row) => from(row.taxOverridden),
    },
    {
      key: 'pickers',
      label: words.pickers,
      attribution: (row) => from(row.pickersOwn),
    },
    {
      key: 'preferred',
      label: words.preferred,
      attribution: (row) => from(row.preferredOwn),
    },
  ];
}
