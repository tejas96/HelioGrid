import type { CatalogImportConflictAnswer } from './import';
import type { CatalogImportCells } from './import-columns';
import type { CatalogImportRowFix } from './import-fix';
import type { ComponentKind } from './vocabulary';

/**
 * What a card's answer sends (`SCR-M01-17` RFC §5): the row the request goes to, the fix, and the
 * fix that takes it back. Authored once for the web panel and the phone sheet (Law 11).
 */

/** A row as its card holds it: its own cells, and the earlier row it repeats. */
export interface ImportFixRow {
  readonly rowNumber: number;
  readonly cells: CatalogImportCells;
  readonly repeats: { readonly rowNumber: number } | null;
}

export type ImportFixChoice =
  | { readonly act: 'price'; readonly price: string }
  | { readonly act: 'answer'; readonly answer: CatalogImportConflictAnswer }
  /** A kind for a row with none, or the kind of the one candidate the person picked. */
  | { readonly act: 'kind'; readonly kind: ComponentKind }
  /** This row's price, by leaving out the earlier row it repeats. */
  | { readonly act: 'repeat' }
  | { readonly act: 'leaveOut' };

export interface ImportFixRequest {
  readonly target: number;
  readonly body: CatalogImportRowFix;
  readonly undo: CatalogImportRowFix;
}

/**
 * A typed cell is undone by sending the file's own text back — a fix lays cells over the file's and
 * never removes one — so the row asks its question again. `null` for a repeat with no earlier row.
 */
export function importFixRequest(
  row: ImportFixRow,
  choice: ImportFixChoice,
): ImportFixRequest | null {
  const own = (body: CatalogImportRowFix, undo: CatalogImportRowFix) => ({
    target: row.rowNumber,
    body,
    undo,
  });
  switch (choice.act) {
    case 'price':
      return own({ cells: { rate: choice.price } }, { cells: { rate: row.cells.rate ?? '' } });
    case 'kind':
      return own({ cells: { kind: choice.kind } }, { cells: { kind: row.cells.kind ?? '' } });
    case 'answer':
      return own({ answer: choice.answer }, { answer: null });
    case 'leaveOut':
      return own({ leaveOut: true }, { leaveOut: false });
    case 'repeat':
      return row.repeats === null
        ? null
        : { target: row.repeats.rowNumber, body: { leaveOut: true }, undo: { leaveOut: false } };
  }
}
