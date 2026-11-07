import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';

/**
 * The release hero's figures on the *Items* panel: how big the catalog is and how much of it the
 * company has made its own. Each label sits under its figure, as a stat's does.
 */
export const CATALOG_FIGURES = {
  items: /*i18n*/ {
    id: '{count, plural, one {item in your catalog} other {items in your catalog}}',
  },
  changed: /*i18n*/ { id: 'made your own' },
  archived: /*i18n*/ { id: 'archived' },
  /** The toast once a price lands, under the item's name. */
  priceSaved: /*i18n*/ { id: 'Price saved' },
  /** The desktop's docked panel beside the list, before a row is picked. */
  pickTitle: /*i18n*/ { id: 'Pick an item' },
  pickLine: /*i18n*/ { id: 'Its specs and your price open here, beside the list.' },
} as const;

export interface CatalogStripFigure {
  readonly value: string;
  readonly label: TranslatedText;
}

/** The hero's figures: the whole catalog, what is yours, and the archived only when there are any. */
export function catalogStripFigures(
  t: Translator['t'],
  counts: { readonly all: number; readonly changed: number; readonly archived: number },
  count: (n: number) => string,
): readonly CatalogStripFigure[] {
  const figures: CatalogStripFigure[] = [
    { value: count(counts.all), label: t(CATALOG_FIGURES.items, { count: counts.all }) },
    { value: count(counts.changed), label: t(CATALOG_FIGURES.changed) },
  ];
  if (counts.archived > 0) {
    figures.push({
      value: count(counts.archived),
      label: t(CATALOG_FIGURES.archived),
    });
  }
  return figures;
}
