/**
 * How the catalog import names a product (`M01-41`): its brand and model, compared as the matching
 * pass compares them. The comparable form of the text itself is the shared import's (`import/text`).
 */

/** A product as a row names it: its brand and model, outer spaces aside. */
export interface ImportProductName {
  readonly brand: string;
  readonly model: string;
}

/** The cells a product is named by — any row's cells carry them. */
interface NamingCells {
  readonly brand?: string;
  readonly model?: string;
}

/** How the matching pass compares two products: brand and model as written, outer spaces aside. */
export const identityOf = (brand: string, model: string) => `${brand.trim()}\u0000${model.trim()}`;

/** The product a row names, or null when its brand or its model is blank. */
export function productNameOf(cells: NamingCells): ImportProductName | null {
  const brand = cells.brand?.trim() ?? '';
  const model = cells.model?.trim() ?? '';
  return brand === '' || model === '' ? null : { brand, model };
}

/** Whether these cells name one of these products, compared as the matching pass compares them. */
export function namesOneOf(cells: NamingCells, names: readonly ImportProductName[]): boolean {
  const name = productNameOf(cells);
  if (name === null) return false;
  const identity = identityOf(name.brand, name.model);
  return names.some((other) => identityOf(other.brand, other.model) === identity);
}

/**
 * Each product the rows name, once, compared as the pass compares them — what the server reads
 * from the catalog before matching, so no row matches an item the read left out.
 */
export function importProductNames(
  rows: readonly { readonly cells: NamingCells }[],
): readonly ImportProductName[] {
  const names = new Map<string, ImportProductName>();
  for (const { cells } of rows) {
    const name = productNameOf(cells);
    if (name !== null) names.set(identityOf(name.brand, name.model), name);
  }
  return [...names.values()];
}
