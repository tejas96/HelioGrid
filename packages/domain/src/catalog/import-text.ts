/**
 * The comparable form of a spreadsheet's text (`M01-41`), shared by the column guess every device
 * may show and the cell readers the server runs.
 */

const DEVANAGARI_ZERO = 0x0966;

/** Devanagari digits as ASCII, so `१३२००` reads as `13200`. */
export function asciiDigits(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[०-९]/g, (digit) => String(digit.charCodeAt(0) - DEVANAGARI_ZERO));
}

/**
 * The comparable form of a cell or a header: ASCII digits, lower case, anything in brackets
 * dropped (a header's unit), and every run of non-letters one space. Letters include the combining
 * marks Devanagari is written with, so a Hindi word survives whole.
 */
export function importTextKey(text: string): string {
  return asciiDigits(text)
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim();
}

/** A cell with nothing in it is absent, never a zero. */
export function isBlank(cell: string | undefined): cell is undefined {
  return cell === undefined || cell.trim() === '';
}

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
