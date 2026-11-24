import { describe, expect, it } from 'vitest';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import { roofStepAfter } from '../../src/studio/roof-step';
import { box, designOf, p, SHED, TERRACE } from './roof-meet-support';
import { draw, KERNEL, run, saidOf } from './roof-step-support';

/**
 * A roof made a hole fits the roof it is cut in (`T-M05-002`, part e, E015): along that roof's
 * edge it is a notch in its outline, said once; at a corner alone it moves clear; inside it stays.
 */
const HOUSE = designOf(TERRACE, SHED);

describe('a hole fits the roof it is cut in', () => {
  const make = { kind: 'make', roof: 2, into: 'hole', ...KERNEL } as const;

  it('a stair room on the outer walls made a hole is a notch in the terrace instead: one change, said once', () => {
    const closed = run(draw(box(0, 0, 3, 3), HOUSE), HOUSE);
    const after = roofStepAfter(closed.state, make, closed.document);
    const roofs = after.commit?.roofs ?? [];
    expect(roofs).toHaveLength(2);
    expect(ringAreaM2(roofs[0]?.corners ?? [])).toBeCloseTo(80 - 9, 6);
    expect(saidOf(after.state)).toEqual({
      kind: 'notched',
      roof: 0,
      name: { kind: 'roof', number: 1 },
    });
  });

  it('a duct drawn along the terrace’s edge closes as the studio’s guess, its chips kept; Hole picked is the notch', () => {
    const closed = run(draw(box(4, 0, 1, 1), HOUSE), HOUSE);
    expect(closed.commits).toBe(1);
    expect(closed.document.roofs[2]?.kind).toEqual({ is: 'hole', setBy: 'system' });
    expect(saidOf(closed.state)).toMatchObject({ kind: 'closed', became: { is: 'hole' } });
    // The lit chip, tapped, makes the guess the person's: it is a notch now.
    const after = roofStepAfter(closed.state, make, closed.document);
    expect(after.commit?.roofs).toHaveLength(2);
    expect(after.commit?.roofs[0]?.corners).toHaveLength(8);
    expect(saidOf(after.state)).toMatchObject({ kind: 'notched', roof: 0 });
  });

  it('a roof whose faces were drawn by hand takes no notch: the hole stays a hole', () => {
    const face = { slope: { degrees: 20, setBy: 'person' }, lowSide: 0 } as const;
    const faced = {
      ...TERRACE,
      shape: {
        is: 'any',
        setBy: 'person',
        faces: [
          { ...face, corners: box(0, 0, 10, 4) },
          { ...face, corners: box(0, 4, 10, 4), lowSide: 2 },
        ],
      },
    } as const;
    const design = designOf(faced, SHED);
    const closed = run(draw(box(0, 0, 3, 3), design), design);
    const after = roofStepAfter(closed.state, make, closed.document);
    expect(after.commit?.roofs).toHaveLength(3);
    expect(after.commit?.roofs[0]).toEqual(faced);
    expect(after.commit?.roofs[2]?.kind).toEqual({ is: 'hole', setBy: 'person' });
  });

  it('a duct touching the edge at a corner alone moves clear, and stays a hole', () => {
    const duct = [p(10, 8), p(9, 7.5), p(9.5, 7)];
    const { state, document } = run(draw(duct, HOUSE), HOUSE);
    const hole = document.roofs[2];
    expect(hole?.kind?.is).toBe('hole');
    const near = Math.min(...(hole?.corners ?? []).map((c) => Math.min(10 - c.east, 8 - c.north)));
    expect(near).toBeGreaterThanOrEqual(0.35 - 1e-9);
    expect(saidOf(state)).toMatchObject({ kind: 'closed', became: { is: 'hole' } });
  });

  it('a duct clear inside stays where it was drawn', () => {
    const { document } = run(draw(box(4, 3, 1, 1), HOUSE), HOUSE);
    expect(document.roofs[2]).toMatchObject({ kind: { is: 'hole' }, corners: box(4, 3, 1, 1) });
  });
});
