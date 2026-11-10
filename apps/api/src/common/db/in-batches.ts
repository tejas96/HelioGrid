/**
 * Enough rows per statement that a long sheet takes few round trips, few enough that a row of a
 * dozen columns stays under Postgres's bind limit (65,535 parameters per statement).
 */
const ROWS_PER_STATEMENT = 500;

/** The rows in batches of `ROWS_PER_STATEMENT`, one statement each, in order. */
export async function inBatches<T>(
  rows: readonly T[],
  write: (batch: readonly T[]) => Promise<void>,
): Promise<void> {
  for (let start = 0; start < rows.length; start += ROWS_PER_STATEMENT) {
    await write(rows.slice(start, start + ROWS_PER_STATEMENT));
  }
}
