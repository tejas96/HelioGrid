/**
 * A comma-separated text a spreadsheet opens (`M13-52`). Every cell is quoted, quotes doubled, and
 * a cell a spreadsheet would run as a formula — one opening with `=`, `+`, `-`, `@`, a tab or a
 * carriage return — gets a leading apostrophe, so a lead named `=HYPERLINK(…)` stays text.
 * Lines end CRLF, as RFC 4180 writes them; the text opens with a byte-order mark so a
 * spreadsheet reads ₹ and Devanagari as UTF-8.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

function cellOf(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvText(rows: readonly (readonly string[])[]): string {
  return `﻿${rows.map((row) => row.map(cellOf).join(',')).join('\r\n')}\r\n`;
}
