/**
 * `M08-03` — the project number as the company reads it, from the counter the server assigns:
 * `PRJ-0042`, at least four digits so a young company's numbers line up. A business-identifier
 * formatter, so it lives on `./server` alone and every device shows what the server sent.
 */
export function projectNumberOf(sequence: number): string {
  return `PRJ-${String(sequence).padStart(4, '0')}`;
}
