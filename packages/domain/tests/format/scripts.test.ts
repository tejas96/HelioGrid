import { describe, expect, it } from 'vitest';
import { type ScriptStack, splitScriptRuns } from '../../src/format/scripts';

/**
 * `F3-09` and `F3-13`: a line that mixes scripts is normal, and on a platform with no
 * per-codepoint fallback the runs are resolved explicitly. These tables are the resolution —
 * the same answer a browser reaches from a font stack, so the two platforms agree (Law 7).
 */

/** The shipped stack: the brand face first, the script face behind it. */
const LATIN = 'Geist';
const DEVANAGARI = 'Noto Sans Devanagari';
const STACK: ScriptStack = [
  { family: LATIN, ranges: [[0x20, 0x7e]] },
  {
    family: DEVANAGARI,
    ranges: [
      [0x20, 0x7e],
      [0x900, 0x97f],
    ],
  },
];

describe('splitScriptRuns — which face draws which run (F3-09, F3-13)', () => {
  it('returns nothing for nothing', () => {
    expect(splitScriptRuns('', STACK)).toEqual([]);
  });

  it('leaves a single-script line as one run', () => {
    expect(splitScriptRuns('5 kW system', STACK)).toEqual([{ text: '5 kW system', family: LATIN }]);
    expect(splitScriptRuns('सिस्टम', STACK)).toEqual([{ text: 'सिस्टम', family: DEVANAGARI }]);
  });

  it('splits the source’s own example — a Latin capacity inside a Devanagari sentence', () => {
    expect(splitScriptRuns('5 kW सिस्टम', STACK)).toEqual([
      { text: '5 kW ', family: LATIN },
      { text: 'सिस्टम', family: DEVANAGARI },
    ]);
  });

  it('splits the same line the other way round, and never transliterates', () => {
    expect(splitScriptRuns('सिस्टम 5 kW', STACK)).toEqual([
      { text: 'सिस्टम', family: DEVANAGARI },
      { text: ' 5 kW', family: LATIN },
    ]);
  });

  it.each([
    ['', ''],
    ['5 kW सिस्टम', '5 kW सिस्टम'],
    ['सिस्टम 5 kW की क्षमता', 'सिस्टम 5 kW की क्षमता'],
    ['‍क्ष‌', '‍क्ष‌'],
    ['₹1,20,000 प्रति माह', '₹1,20,000 प्रति माह'],
  ])('puts every character back exactly as it came: %j', (input, expected) => {
    expect(
      splitScriptRuns(input, STACK)
        .map((run) => run.text)
        .join(''),
    ).toBe(expected);
  });

  it('keeps a character no bundled face covers inside the run beside it', () => {
    // A joiner decides whether क् + ष draws as the conjunct क्ष. Cut the run at it and the
    // conjunct breaks — which is the F3-15 output no document may carry.
    expect(splitScriptRuns('क्‍ष', STACK)).toEqual([{ text: 'क्‍ष', family: DEVANAGARI }]);
  });

  it('opens with the brand face when the line opens with a character nothing covers', () => {
    expect(splitScriptRuns('‍abc', STACK)).toEqual([{ text: '‍abc', family: LATIN }]);
  });

  it('reads the priority from the stack ORDER, so a face added ahead takes what it covers', () => {
    const devanagariFirst: ScriptStack = [STACK[1] as ScriptStack[number], STACK[0]];
    expect(splitScriptRuns('5 kW सिस्टम', devanagariFirst)).toEqual([
      { text: '5 kW सिस्टम', family: DEVANAGARI },
    ]);
  });

  it('draws a script no bundled face covers in the brand face rather than dropping it', () => {
    expect(splitScriptRuns('বাংলা', STACK)).toEqual([{ text: 'বাংলা', family: LATIN }]);
  });
});
