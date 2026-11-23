import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import { laidOnGround, planLaid } from '../../src/studio/own-picture-acts';
import { planSizedByLength, roofsOnPlan } from '../../src/studio/plan-sizing';
import { edgeLengths } from '../../src/studio/roof-shape';
import { roofStepAfter } from '../../src/studio/roof-step';
import { idle } from '../../src/studio/roof-step-state';

/**
 * A PDF plan lies at our 1:100 guess (`T-M05-002d`, DONE WHEN part d): the first length typed on a
 * roof made from it sizes the plan and the roofs made from it, never the picture under them.
 */
const PLAN_ID = '01a50000-0000-7000-8000-0000000000c1';
/** A 12 × 8 m house in PDF points at our 1:100 guess (0.0353 m a point). */
const MPU = (0.0254 / 72) * 100;
const HOUSE = [0, 0, 12 / MPU, 0, 12 / MPU, 8 / MPU, 0, 8 / MPU];
const LAID = {
  pictureId: PLAN_ID,
  at: { east: -6, north: -4 },
  turnDeg: 0,
  metresPerUnit: MPU,
  scaleFrom: 'guess' as const,
};

const roofOf = (corners: Roof['corners'], id = 'r1'): Roof => ({
  id: `01a50000-0000-7000-8000-0000000000${id === 'r1' ? 'd1' : 'd2'}`,
  corners,
  edges: corners.map(() => 'traced' as const),
  tracedOn: 'sky',
  height: null,
});

function designWith(scaleFrom: 'guess' | 'file' = 'guess', extra: Roof[] = []): StudioDocument {
  const laid = planLaid(EMPTY_STUDIO_DOCUMENT, { ...LAID, scaleFrom }, 1);
  const plan = laid.plan;
  if (plan == null) throw new Error('no plan');
  const corners = [0, 1, 2, 3].map((i) =>
    laidOnGround(plan, HOUSE[i * 2] as number, HOUSE[i * 2 + 1] as number),
  );
  return { ...laid, roofs: [roofOf(corners), ...extra] };
}

describe('roofsOnPlan', () => {
  it.each([
    ['a roof made from the guessed plan’s outline', 'guess', [0]],
    ['the same roof when the plan’s scale is the file’s', 'file', []],
  ] as const)('%s', (_why, scaleFrom, on) => {
    expect(roofsOnPlan(designWith(scaleFrom), [HOUSE])).toEqual(on);
  });

  it('a roof drawn by hand beside it is not on the plan', () => {
    const drawn = roofOf(
      [
        { east: 20, north: 0 },
        { east: 26, north: 0 },
        { east: 26, north: 5 },
        { east: 20, north: 5 },
      ],
      'r2',
    );
    expect(roofsOnPlan(designWith('guess', [drawn]), [HOUSE])).toEqual([0]);
  });

  it('no plan, or no outline, is no roof on the plan', () => {
    expect(roofsOnPlan({ ...designWith(), plan: null }, [HOUSE])).toEqual([]);
    expect(roofsOnPlan(designWith(), [])).toEqual([]);
  });
});

describe('planSizedByLength', () => {
  it('a roof’s faces drawn by hand are sized with it, and still fit it', () => {
    const design = designWith();
    const roof = design.roofs[0] as Roof;
    const face = {
      corners: roof.corners,
      slope: { degrees: 20, setBy: 'person' as const },
      lowSide: 0,
    };
    const drawn: Roof = { ...roof, shape: { is: 'any', setBy: 'person', faces: [face] } };
    const result = planSizedByLength({ ...design, roofs: [drawn] }, [0], 0, 0, 9, 'typed');
    const sized = result.kind === 'done' ? result.document.roofs[0] : undefined;
    expect(sized?.shape?.faces?.[0]?.corners).toEqual(sized?.corners);
  });

  it('the first length sizes the plan and its roof; the plan’s scale is then a person’s', () => {
    const design = designWith();
    const result = planSizedByLength(design, [0], 0, 0, 9, 'typed');
    if (result.kind !== 'done') throw new Error(result.kind);
    const { plan, roofs, pictureScale } = result.document;
    expect(plan?.scaleFrom).toBe('person');
    expect(plan?.metresPerUnit).toBeCloseTo(MPU * 0.75, 12);
    const roof = roofs[0];
    expect(edgeLengths(roof?.corners ?? [])[0]).toBeCloseTo(9, 9);
    expect(edgeLengths(roof?.corners ?? [])[1]).toBeCloseTo(6, 9);
    // The typed edge keeps its trust; the others are now the plan's.
    expect(roof?.edges).toEqual(['typed', 'plan', 'plan', 'plan']);
    // The picture under it never moves.
    expect(pictureScale).toBe(design.pictureScale);
    // The plan's outline still lies on the roof.
    const sized = result.document.plan;
    if (sized == null) throw new Error('no plan');
    const corner = laidOnGround(sized, 12 / MPU, 0);
    expect(corner.east).toBeCloseTo(roof?.corners[1]?.east ?? 0, 9);
    expect(corner.north).toBeCloseTo(roof?.corners[1]?.north ?? 0, 9);
  });

  it.each([
    ['a scale no plan has', 1e-9],
    ['a length too short to be an edge', 0.01],
  ])('refuses %s', (_why, metres) => {
    expect(planSizedByLength(designWith(), [0], 0, 0, metres, 'typed').kind).toBe('refused');
  });
});

describe('the roof step: a length on a roof made from the guessed plan', () => {
  it('picked, typed and set: the plan is sized, the picture never', () => {
    const design = designWith();
    const picked = roofStepAfter(
      idle(null, 0),
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric', planRoofs: [0] },
      design,
    );
    const typed = roofStepAfter(
      picked.state,
      { kind: 'type', entry: { main: '9', inches: '', measured: false } },
      design,
    );
    const set = roofStepAfter(typed.state, { kind: 'set', system: 'metric' }, design);
    expect(set.commit?.plan?.scaleFrom).toBe('person');
    expect(set.commit?.pictureScale).toBe(design.pictureScale);
    expect(set.state).toMatchObject({ kind: 'idle', said: { kind: 'sized' } });
  });
});
