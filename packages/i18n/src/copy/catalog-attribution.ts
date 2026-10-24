import type { ResolvedCatalogItemWire } from '@heliogrid/contracts';
import { catalogLayerOf } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { CATALOG_EDITOR } from './catalog-editor';
import {
  CATALOG_SETTINGS,
  catalogKind,
  catalogLayerWord,
  catalogPriceFrom,
} from './catalog-settings';
import type { CatalogFormats } from './catalog-views';

type T = Translator['t'];

const ATTRIBUTION = {
  caption: /*i18n*/ {
    id: 'Why a price is what it is — the {count} of {total} items you have changed',
  },
} as const;

/**
 * The Rates panel's attribution table at 375 (`SCR-M01-15` m15-d): its caption over the changed
 * count of the whole catalog, and the column words the items list already says.
 */
export function catalogAttributionWords(
  t: T,
  counts: { readonly changed: number; readonly total: number },
  number: CatalogFormats['number'],
) {
  return {
    caption: t(ATTRIBUTION.caption, {
      count: number(counts.changed),
      total: number(counts.total),
    }),
    item: t(CATALOG_SETTINGS.item),
    whatItIs: t(CATALOG_SETTINGS.whatItIs),
    price: t(CATALOG_EDITOR.price),
    priceFrom: t(CATALOG_SETTINGS.priceComesFrom),
    taxRate: t(CATALOG_EDITOR.taxRate),
    pickers: t(CATALOG_EDITOR.pickers),
    preferred: t(CATALOG_EDITOR.preferred),
    noPrice: t(CATALOG_SETTINGS.noPrice),
    noMarketRate: t(CATALOG_EDITOR.noMarketRate),
    yourOverride: t(CATALOG_EDITOR.yourOverride),
    defaultSource: t(CATALOG_EDITOR.defaultSource),
    more: t(CATALOG_SETTINGS.loadMore),
    loadFailed: t(CATALOG_SETTINGS.loadFailed),
    tryAgain: t(CATALOG_SETTINGS.tryAgain),
  };
}

/**
 * One changed item as the table reads it: each field's value and whether this company set it.
 * `null` for an item the company has not changed — an old api that ignores `changed` answers the
 * whole list, and the table must still list only what was changed — and for a reader the wire
 * hides money from: the table is about prices.
 */
export function catalogAttributionRowOf(
  t: T,
  item: ResolvedCatalogItemWire,
  formats: CatalogFormats,
) {
  const layer = catalogLayerOf(item);
  if (layer === 'platform' || item.rate === undefined) return null;
  const own = item.source === 'own_item';
  return {
    id: item.id,
    name: `${item.brand} ${item.model}`,
    what: `${catalogKind(t, item.spec.kind)} · ${catalogLayerWord(t, layer)}`,
    price: item.rate ? formats.money(item.rate.amount) : null,
    /* Where the price came from is the price's own layer: a hide-only override supplies no price. */
    priceFrom: catalogPriceFrom(
      t,
      own ? 'own' : item.rate?.source === 'override' ? 'overridden' : 'platform',
    ),
    tax: item.tax ? formats.percent(item.tax.pct) : null,
    taxOverridden: item.tax?.source === 'override',
    pickers: t(item.hidden ? CATALOG_EDITOR.hiddenWord : CATALOG_EDITOR.shown),
    pickersOwn: !own && item.hidden,
    preferred: t(item.preferred ? CATALOG_EDITOR.yes : CATALOG_EDITOR.no),
    preferredOwn: !own && item.preferred,
  };
}
