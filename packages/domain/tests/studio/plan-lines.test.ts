import { describe, expect, it } from 'vitest';
import {
  type CadDrawing,
  PLAN_LINES_MAX,
  planLinesOf,
  planUnitGuess,
  planUnitOfInsunits,
} from '../../src/studio/plan-lines';

/** A plan's lines (`T-M05-002d`): one converter for the DXF read on the device and the DWG read on our server. */

const pointsOf = (drawing: CadDrawing) => planLinesOf(drawing, PLAN_LINES_MAX)?.lines ?? [];
const pairs = (points: readonly number[]) =>
  Array.from({ length: points.length / 2 }, (_, i) => [points[2 * i], points[2 * i + 1]]);

describe('planLinesOf', () => {
  it('keeps a closed outline closed, its corners once each', () => {
    const lines = pointsOf({
      entities: [
        {
          kind: 'polyline',
          closed: true,
          vertices: [
            { x: 0, y: 0, bulge: 0 },
            { x: 12000, y: 0, bulge: 0 },
            { x: 12000, y: 8500, bulge: 0 },
            { x: 0, y: 8500, bulge: 0 },
          ],
        },
      ],
      blocks: {},
    });
    expect(lines).toEqual([{ points: [0, 0, 12000, 0, 12000, 8500, 0, 8500], closed: true }]);
  });

  it('bends a bulged edge into a half circle through the right side', () => {
    // Bulge 1 from (0,0) to (2,0): a half circle, counter-clockwise, through (1,-1).
    const [line] = pointsOf({
      entities: [
        {
          kind: 'polyline',
          closed: false,
          vertices: [
            { x: 0, y: 0, bulge: 1 },
            { x: 2, y: 0, bulge: 0 },
          ],
        },
      ],
      blocks: {},
    });
    const points = pairs(line?.points ?? []);
    expect(points[0]).toEqual([0, 0]);
    expect(points.at(-1)).toEqual([2, 0]);
    expect(points.some(([x, y]) => x === 1 && y === -1)).toBe(true);
    for (const [x, y] of points) expect(Math.hypot((x ?? 0) - 1, y ?? 0)).toBeCloseTo(1, 2);
  });

  it('bends a negative bulge clockwise, about the centre on its other side', () => {
    // Bulge −tan(22.5°): a quarter turn clockwise from (1,0) to (0,1), about (1,1).
    const [line] = pointsOf({
      entities: [
        {
          kind: 'polyline',
          closed: false,
          vertices: [
            { x: 1, y: 0, bulge: -Math.tan(Math.PI / 8) },
            { x: 0, y: 1, bulge: 0 },
          ],
        },
      ],
      blocks: {},
    });
    for (const [x, y] of pairs(line?.points ?? [])) {
      expect(Math.hypot((x ?? 0) - 1, (y ?? 0) - 1)).toBeCloseTo(1, 2);
    }
  });

  it('places a block where each insert puts it, turned and scaled', () => {
    const lines = pointsOf({
      entities: [
        {
          kind: 'insert',
          block: 'DOOR',
          at: { x: 10, y: 0 },
          scale: { x: 1, y: 1 },
          rotationDeg: 0,
        },
        {
          kind: 'insert',
          block: 'DOOR',
          at: { x: 0, y: 0 },
          scale: { x: 2, y: 2 },
          rotationDeg: 90,
        },
      ],
      blocks: {
        DOOR: {
          base: { x: 0, y: 0 },
          entities: [{ kind: 'line', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }],
        },
      },
    });
    expect(lines).toEqual([
      { points: [10, 0, 11, 0], closed: false },
      { points: [0, 0, 0, 2], closed: false },
    ]);
  });

  it('draws a circle as a closed ring and an arc counter-clockwise', () => {
    const [ring, arc] = pointsOf({
      entities: [
        { kind: 'circle', centre: { x: 0, y: 0 }, radius: 1 },
        { kind: 'arc', centre: { x: 0, y: 0 }, radius: 1, startDeg: 0, endDeg: 90 },
      ],
      blocks: {},
    });
    expect(ring?.closed).toBe(true);
    expect(pairs(arc?.points ?? []).at(-1)).toEqual([0, 1]);
  });

  it.each([
    [0, 90, 19],
    [0, 360 * 1000 + 90, 19],
    [90, 0, 55],
    [0, 360, 73],
  ] as const)(
    'an arc from %s° to %s° draws %s points: one turn at most',
    (startDeg, endDeg, count) => {
      const [arc] = pointsOf({
        entities: [{ kind: 'arc', centre: { x: 0, y: 0 }, radius: 1, startDeg, endDeg }],
        blocks: {},
      });
      expect((arc?.points.length ?? 0) / 2).toBe(count);
    },
  );

  it('stops at a block that holds itself, and cuts a plan at the cap', () => {
    const loop: CadDrawing = {
      entities: [
        { kind: 'insert', block: 'A', at: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotationDeg: 0 },
      ],
      blocks: {
        A: {
          base: { x: 0, y: 0 },
          entities: [
            { kind: 'line', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
            {
              kind: 'insert',
              block: 'A',
              at: { x: 1, y: 0 },
              scale: { x: 1, y: 1 },
              rotationDeg: 0,
            },
          ],
        },
      },
    };
    // The top insert, then seven blocks deep: eight copies of the line, then the nesting stops.
    expect(planLinesOf(loop, PLAN_LINES_MAX)?.lines.length).toBe(8);
    expect(planLinesOf(loop, 3)?.lines.length).toBe(3);
  });

  it('answers null for a drawing with no line, and a box round what it drew', () => {
    expect(planLinesOf({ entities: [], blocks: {} }, PLAN_LINES_MAX)).toBeNull();
    const drawn = planLinesOf(
      { entities: [{ kind: 'line', from: { x: -2, y: 3 }, to: { x: 5, y: 3 } }], blocks: {} },
      PLAN_LINES_MAX,
    );
    expect(drawn?.extent).toEqual({ west: -2, south: 3, east: 5, north: 4 });
  });
});

describe('planUnitOfInsunits and planUnitGuess', () => {
  it.each([
    [1, 'in'],
    [2, 'ft'],
    [4, 'mm'],
    [5, 'cm'],
    [6, 'm'],
    [0, null],
    [3, null],
    [null, null],
  ] as const)('$INSUNITS %s reads as %s', (code, unit) => {
    expect(planUnitOfInsunits(code)).toBe(unit);
  });

  it.each([
    [7790, 'mm'],
    [1200, 'cm'],
    [12, 'm'],
    [200, 'in'],
    [0.5, null],
  ] as const)('a plan %s units across is guessed in %s', (span, unit) => {
    expect(planUnitGuess({ west: 0, south: 0, east: span, north: span / 2 })).toBe(unit);
  });
});
