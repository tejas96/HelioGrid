import type { CatalogImportAttentionReason, CatalogImportConflictAnswer } from './import';
import type { CatalogImportCells } from './import-columns';
import { identityOf, productNameOf } from './import-text';

/**
 * A fix in the import's preview grid (`M01-41`, `T-M01-030e`): a row's typed cells, the row left
 * out or brought back, or the answer to its spec conflict. Client-safe, so the wizard offers each
 * act on the same rule the server refuses with (Law 11).
 */
export type CatalogImportRowFix =
  | { readonly cells: CatalogImportCells }
  | { readonly leaveOut: boolean }
  | { readonly answer: CatalogImportConflictAnswer };

/** What a row holds from the file and the person, and what the matching pass last asked of it. */
export interface CatalogImportRowState {
  readonly cells: CatalogImportCells;
  readonly fix: CatalogImportCells;
  readonly leftOut: boolean;
  readonly answer: CatalogImportConflictAnswer | null;
  readonly attention: readonly { readonly reason: CatalogImportAttentionReason }[];
}

/** What a fix changes on its row. */
export type CatalogImportRowAnswers = Pick<CatalogImportRowState, 'fix' | 'leftOut' | 'answer'>;

export type CatalogImportFixProblem = 'asks_no_question';

/** The cells a row is judged by: the person's typed value over the file's, field by field. */
export function effectiveImportCells(
  row: Pick<CatalogImportRowState, 'cells' | 'fix'>,
): CatalogImportCells {
  return { ...row.cells, ...row.fix };
}

/**
 * A row takes an answer when it asks about a spec conflict, or to change an answer already given.
 * Anywhere else an answer would turn a clean match into a new SKU nobody asked for.
 */
export function takesImportAnswer(row: CatalogImportRowState): boolean {
  return row.answer !== null || row.attention.some(({ reason }) => reason === 'spec_conflict');
}

export function importFixProblem(
  row: CatalogImportRowState,
  fix: CatalogImportRowFix,
): CatalogImportFixProblem | null {
  return 'answer' in fix && !takesImportAnswer(row) ? 'asks_no_question' : null;
}

/** Whether two sets of cells name one product, as the matching pass compares them. */
function nameSameProduct(before: CatalogImportCells, after: CatalogImportCells): boolean {
  const was = productNameOf(before);
  const is = productNameOf(after);
  if (was === null || is === null) return was === is;
  return identityOf(was.brand, was.model) === identityOf(is.brand, is.model);
}

/**
 * The row after its fix. An answer was about the product the row named, so a fix that names
 * another product drops it — kept, it would settle a question the new product was never asked.
 */
export function fixedImportRow(
  row: CatalogImportRowState,
  fix: CatalogImportRowFix,
): CatalogImportRowAnswers {
  if ('leaveOut' in fix) return { fix: row.fix, leftOut: fix.leaveOut, answer: row.answer };
  if ('answer' in fix) return { fix: row.fix, leftOut: row.leftOut, answer: fix.answer };
  const typed = { ...row.fix, ...fix.cells };
  const sameProduct = nameSameProduct(
    effectiveImportCells(row),
    effectiveImportCells({ cells: row.cells, fix: typed }),
  );
  return { fix: typed, leftOut: row.leftOut, answer: sameProduct ? row.answer : null };
}
