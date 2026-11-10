/**
 * One sheet of a read file, as the file holds it: its name, how many rows and columns it fills, and
 * its first `HEADER_ROW_SCAN` rows as text — what the file step places the header row on and the
 * columns step guesses the columns from, on the device (`T-M01-030c` decision 3). Counted, never
 * guessed.
 */
export interface ImportSheet {
  readonly name: string;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly topRows: readonly (readonly string[])[];
}

/** A header row sits near the top: a title block runs a few lines, never a page. */
export const HEADER_ROW_SCAN = 10;
