import { describe, expect, it } from 'vitest';
import { csvText } from '../../src/format/csv';

describe('csvText — quoted cells, formulas kept as text (M13-52)', () => {
  it.each([
    ['plain', '"plain"'],
    ['', '""'],
    ['say "hi"', '"say ""hi"""'],
    ['a,b', '"a,b"'],
    ['=SUM(A1)', `"'=SUM(A1)"`],
    ['+91', `"'+91"`],
    ['-5', `"'-5"`],
    ['@x', `"'@x"`],
    ['\tx', `"'\tx"`],
    ['₹18,40,000', '"₹18,40,000"'],
  ])('%j becomes %s', (value, cell) => {
    expect(csvText([[value]])).toBe(`﻿${cell}\r\n`);
  });

  it('joins cells with commas and rows with CRLF', () => {
    expect(csvText([['a', 'b'], ['c']])).toBe('﻿"a","b"\r\n"c"\r\n');
  });

  it('an empty table is the mark and one line end', () => {
    expect(csvText([])).toBe('﻿\r\n');
  });
});
