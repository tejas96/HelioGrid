import { describe, expect, it } from 'vitest';
import {
  type DxfPair,
  dxfPairsOfBinary,
  dxfPairsOfText,
  isBinaryDxf,
} from '../../src/studio/dxf-pairs';
import { cadEntitySeenFromAbove, dxfDrawingOfFile } from '../../src/studio/dxf-read';
import { PLAN_LINES_MAX, planLinesOf } from '../../src/studio/plan-lines';

/**
 * A DXF read into the plan's lines (`T-M05-002d`), text or binary — one stream of group pairs
 * written two ways. The plan here is written out by hand: a 12 × 8.5 m outline in mm (closed), an
 * inner wall, a door block placed twice (once turned 90°), a half-round bay, an arc drawn from below,
 * a hatch that draws no line, and an old-style polyline of three vertices. The binary files are
 * made from the same pairs by `binaryOf`, so both formats must read alike. Real files from CAD
 * tools are read in the worker's own proof (`apps/worker/tests/studio/cad-reader.test.ts`).
 */

const HOUSE: readonly (readonly [number, string | number])[] = [
  [0, 'SECTION'],
  [2, 'HEADER'],
  [9, '$ACADVER'],
  [1, 'AC1024'],
  [9, '$INSUNITS'],
  [70, 4],
  [0, 'ENDSEC'],
  [0, 'SECTION'],
  [2, 'BLOCKS'],
  [0, 'BLOCK'],
  [2, 'DOOR'],
  [10, 0],
  [20, 0],
  [0, 'LINE'],
  [10, 0],
  [20, 0],
  [11, 900],
  [21, 0],
  [0, 'ARC'],
  [10, 0],
  [20, 0],
  [40, 900],
  [50, 0],
  [51, 90],
  [0, 'ENDBLK'],
  [0, 'ENDSEC'],
  [0, 'SECTION'],
  [2, 'ENTITIES'],
  [0, 'LWPOLYLINE'],
  [90, 4],
  [70, 1],
  [10, 0],
  [20, 0],
  [10, 12000],
  [20, 0],
  [10, 12000],
  [20, 8500],
  [10, 0],
  [20, 8500],
  [0, 'LINE'],
  [10, 5000],
  [20, 0],
  [11, 5000],
  [21, 8500],
  [0, 'INSERT'],
  [2, 'DOOR'],
  [10, 1000],
  [20, 0],
  [0, 'INSERT'],
  [2, 'DOOR'],
  [10, 5000],
  [20, 1000],
  [50, 90],
  [0, 'LWPOLYLINE'],
  [90, 2],
  [70, 0],
  [10, 12000],
  [20, 2000],
  [42, 1],
  [10, 12000],
  [20, 4000],
  [0, 'ARC'],
  [10, 2500],
  [20, 6000],
  [40, 300],
  [50, 0],
  [51, 90],
  [210, 0],
  [220, 0],
  [230, -1],
  [0, 'HATCH'],
  [2, 'SOLID'],
  [10, 0],
  [20, 0],
  [0, 'POLYLINE'],
  [66, 1],
  [70, 0],
  [0, 'VERTEX'],
  [10, 0],
  [20, 9000],
  [0, 'VERTEX'],
  [10, 6000],
  [20, 9000],
  [0, 'VERTEX'],
  [10, 6000],
  [20, 9500],
  [0, 'SEQEND'],
  [0, 'ENDSEC'],
  [0, 'EOF'],
];

const textOf = (pairs: typeof HOUSE) =>
  `${pairs.map(([code, value]) => `${code}\n${value}`).join('\n')}\n`;

const SENTINEL = [...'AutoCAD Binary DXF\r\n']
  .map((mark) => mark.charCodeAt(0))
  .concat([0x1a, 0x00]);
const DOUBLE_CODES = (code: number) => (code >= 10 && code <= 59) || (code >= 210 && code <= 239);
const SHORT_CODES = (code: number) => code >= 60 && code <= 79;
const LONG_CODES = (code: number) => code >= 90 && code <= 99;
const WIDE_CODE = 255;

/** The same pairs as a binary DXF: two-byte codes from R13, one-byte codes in an R12 file. */
function binaryOf(pairs: typeof HOUSE, wide: boolean): Uint8Array {
  const bytes: number[] = [...SENTINEL];
  const put = (size: number, write: (view: DataView) => void) => {
    const view = new DataView(new ArrayBuffer(size));
    write(view);
    bytes.push(...new Uint8Array(view.buffer));
  };
  for (const [code, value] of pairs) {
    if (wide) put(2, (view) => view.setUint16(0, code, true));
    else if (code < WIDE_CODE) bytes.push(code);
    else {
      bytes.push(WIDE_CODE);
      put(2, (view) => view.setUint16(0, code, true));
    }
    if (DOUBLE_CODES(code)) put(8, (view) => view.setFloat64(0, Number(value), true));
    else if (SHORT_CODES(code)) put(2, (view) => view.setInt16(0, Number(value), true));
    else if (LONG_CODES(code)) put(4, (view) => view.setInt32(0, Number(value), true));
    else bytes.push(...[...String(value)].map((mark) => mark.charCodeAt(0)), 0);
  }
  return Uint8Array.from(bytes);
}

const linesOf = (file: string | Uint8Array) =>
  planLinesOf(dxfDrawingOfFile(file).drawing, PLAN_LINES_MAX);

describe('dxfDrawingOfFile', () => {
  it('reads the house from a text DXF: its unit, its outline, its placed doors, its bay', () => {
    expect(dxfDrawingOfFile(textOf(HOUSE)).insunits).toBe(4);
    const drawn = linesOf(textOf(HOUSE));
    expect(drawn?.lines[0]).toEqual({
      points: [0, 0, 12000, 0, 12000, 8500, 0, 8500],
      closed: true,
    });
    expect(drawn?.lines.map((line) => line.points)).toEqual(
      expect.arrayContaining([
        [1000, 0, 1900, 0],
        [5000, 1000, 5000, 1900],
        [0, 9000, 6000, 9000, 6000, 9500],
      ]),
    );
    // The bay bulges east to 13000; the old-style polyline reaches north to 9500.
    expect(drawn?.extent).toMatchObject({ east: 13000, north: 9500 });
  });

  it('turns an arc drawn from below to its place seen from above', () => {
    const drawn = linesOf(textOf(HOUSE));
    // Drawn about (2500, 6000) from 0° to 90° in a plane facing down: seen from above it lies
    // about (−2500, 6000), from 90° to 180°.
    const below = drawn?.lines.find((line) => line.points.includes(-2800));
    expect(below?.points.slice(0, 2)).toEqual([-2500, 6300]);
    expect(below?.points.slice(-2)).toEqual([-2800, 6000]);
  });

  it('draws nothing for a hatch, and names no unit for a DXF with none', () => {
    const noUnit = HOUSE.filter(
      ([code, value]) => !(code === 9 && value === '$INSUNITS') && !(code === 70 && value === 4),
    );
    expect(dxfDrawingOfFile(textOf(noUnit)).insunits).toBeNull();
    expect(dxfDrawingOfFile(textOf(HOUSE)).drawing.entities.length).toBe(7);
  });

  it.each([
    ['two-byte codes (R13 and later)', true],
    ['one-byte codes (R12)', false],
  ] as const)('reads the binary DXF with %s as the text one', (_, wide) => {
    const binary = binaryOf(HOUSE, wide);
    expect(isBinaryDxf(binary)).toBe(true);
    expect(dxfDrawingOfFile(binary)).toEqual(dxfDrawingOfFile(textOf(HOUSE)));
  });

  it('reads a code past 254 in an R12 file, led by 255', () => {
    const pairs: typeof HOUSE = [
      [0, 'SECTION'],
      [2, 'X'],
      [1001, 'APP'],
      [0, 'EOF'],
    ];
    expect(dxfPairsOfBinary(binaryOf(pairs, false))).toEqual<DxfPair[]>([
      { code: 0, value: 'SECTION' },
      { code: 2, value: 'X' },
      { code: 1001, value: 'APP' },
      { code: 0, value: 'EOF' },
    ]);
  });

  it.each([
    ['a text that is no DXF', 'hello\nworld\n'],
    ['a code that is no number', 'X\nSECTION\n'],
    ['a binary DXF cut inside a group', binaryOf(HOUSE, true).subarray(0, 40)],
    ['bytes that are no binary DXF', Uint8Array.from([1, 2, 3])],
  ] as const)('refuses %s', (_, file) => {
    expect(() => dxfDrawingOfFile(file)).toThrow();
  });

  it('a text file is no binary DXF', () => {
    expect(isBinaryDxf(Uint8Array.from([...textOf(HOUSE)].map((mark) => mark.charCodeAt(0))))).toBe(
      false,
    );
    expect(dxfPairsOfText('0\nEOF\n')).toEqual([{ code: 0, value: 'EOF' }]);
  });
});

describe('cadEntitySeenFromAbove', () => {
  it('turns an arc drawn from below into its mirror, clockwise becoming counter-clockwise', () => {
    const arc = {
      kind: 'arc',
      centre: { x: 2, y: 1 },
      radius: 1,
      startDeg: 0,
      endDeg: 90,
    } as const;
    expect(cadEntitySeenFromAbove(arc, -1)).toEqual({
      ...arc,
      centre: { x: -2, y: 1 },
      startDeg: 90,
      endDeg: 180,
    });
    expect(cadEntitySeenFromAbove(arc, 1)).toBe(arc);
  });

  it.each([
    [0, { x: -11, y: 0 }],
    [90, { x: -10, y: 1 }],
  ] as const)(
    'places a block inserted facing down at %s° as its mirror',
    (rotationDeg, expected) => {
      // A line from the block's base to (1, 0), inserted at (10, 0) in a plane facing down: from above
      // the insert is at (−10, 0), and the line runs the mirror way.
      const insert = {
        kind: 'insert',
        block: 'B',
        at: { x: 10, y: 0 },
        scale: { x: 1, y: 1 },
        rotationDeg,
      } as const;
      const drawn = planLinesOf(
        {
          entities: [cadEntitySeenFromAbove(insert, -1)],
          blocks: {
            B: {
              base: { x: 0, y: 0 },
              entities: [{ kind: 'line', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }],
            },
          },
        },
        PLAN_LINES_MAX,
      );
      expect(drawn?.lines[0]?.points).toEqual([-10, 0, expected.x, expected.y]);
    },
  );

  it('keeps a downward ellipse where it is and runs its arc the other way round', () => {
    const ellipse = {
      kind: 'ellipse',
      centre: { x: 5, y: 5 },
      majorAxis: { x: 2, y: 0 },
      ratio: 0.5,
      startRad: 0,
      endRad: Math.PI / 2,
    } as const;
    expect(cadEntitySeenFromAbove(ellipse, -1)).toEqual({
      ...ellipse,
      startRad: -Math.PI / 2,
      endRad: -0,
    });
    // Its quarter now ends below the centre: the short axis turned.
    const drawn = planLinesOf(
      { entities: [cadEntitySeenFromAbove(ellipse, -1)], blocks: {} },
      PLAN_LINES_MAX,
    );
    expect(drawn?.lines[0]?.points.slice(0, 2)).toEqual([5, 4]);
  });
});
