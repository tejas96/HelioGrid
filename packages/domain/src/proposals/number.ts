/**
 * `M06-44` — the proposal number as the company reads it, from the counter the server assigns at
 * the first Generate: `PRP-0042`, at least four digits, beside `PRJ-` and `RCPT-`. A
 * business-identifier formatter, so it lives on `./server` alone and every device shows what the
 * server sent.
 */
export function proposalNumberOf(sequence: number): string {
  return `PRP-${String(sequence).padStart(4, '0')}`;
}
