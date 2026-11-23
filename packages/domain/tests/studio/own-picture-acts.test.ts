import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import {
  groundOnLaid,
  laidOnGround,
  ownPictureLaid,
  ownPictureRemoved,
  ownPictureTurned,
  planHidden,
  planLocked,
  planMoved,
  planSeenThrough,
  planTurned,
  planUnitPicked,
  turnInRange,
  turnStepped,
} from '../../src/studio/own-picture-acts';
import { planEdgeTrust } from '../../src/studio/plan-outline';
import { lengthIsFirst, lengthSet } from '../../src/studio/roof-length';
import { scaleTierOf } from '../../src/studio/roof-trust';

import { LAID, planOf, withPlan } from './laid-plan';

/** A picture of the company's own laid, turned, sized and drawn on (`T-M05-002d`). */

describe('turns', () => {
  it.each([
    [0, 0],
    [180, 180],
    [-180, 180],
    [190, -170],
    [-190, 170],
    [720, 0],
  ] as const)('%s° is stored as %s°', (deg, stored) => {
    expect(turnInRange(deg)).toBe(stored);
  });

  it.each([
    [2.4, 0],
    [2.5, 5],
    [-12, -10],
    [178, 180],
  ] as const)('a turn of %s° is set to %s°, a 5° step', (deg, stepped) => {
    expect(turnStepped(deg)).toBe(stepped);
  });
});

describe('the ground’s own picture', () => {
  it('laid, it is the picture shown; removed, the studio picks again and the roofs stay', () => {
    const roof: Roof = {
      id: 'r',
      corners: [
        { east: 0, north: 0 },
        { east: 4, north: 0 },
        { east: 0, north: 3 },
      ],
      edges: ['traced', 'traced', 'traced'],
      tracedOn: 'own',
      height: null,
    };
    const laid = ownPictureLaid({ ...EMPTY_STUDIO_DOCUMENT, roofs: [roof] }, LAID);
    expect(laid).toMatchObject({ picture: 'own', ownPicture: LAID });
    expect(ownPictureRemoved(laid)).toMatchObject({
      picture: null,
      ownPicture: null,
      roofs: [roof],
    });
  });

  it('turns to a 5° step, and a design with none is unchanged', () => {
    expect(
      ownPictureTurned(ownPictureLaid(EMPTY_STUDIO_DOCUMENT, LAID), 12).ownPicture?.turnDeg,
    ).toBe(10);
    expect(ownPictureTurned(EMPTY_STUDIO_DOCUMENT, 12)).toBe(EMPTY_STUDIO_DOCUMENT);
  });
});

describe('the plan', () => {
  it('lands 80% see-through, neither locked nor hidden, on the page laid', () => {
    expect(withPlan().plan).toMatchObject({
      seeThrough: 80,
      locked: false,
      hidden: false,
      page: 1,
    });
  });

  it('locked, it neither moves nor turns; it still hides and shows', () => {
    const locked = planLocked(withPlan(), true);
    expect(planMoved(locked, { east: 3, north: 3 })).toBe(locked);
    expect(planTurned(locked, 45)).toBe(locked);
    expect(planHidden(locked, true).plan?.hidden).toBe(true);
  });

  it.each([
    [5, 10],
    [10, 10],
    [62.4, 62],
    [100, 100],
    [130, 100],
  ] as const)('see-through at %s%% is kept at %s%%', (asked, kept) => {
    expect(planSeenThrough(withPlan(), asked).plan?.seeThrough).toBe(kept);
  });

  const DRAWING = { west: 4000, south: 2000, east: 12_000, north: 10_000 };

  it('a unit picked re-sizes it at once and is a person’s; a scale no plan has is refused', () => {
    expect(planUnitPicked(withPlan(), 0.001, DRAWING)?.plan).toMatchObject({
      metresPerUnit: 0.001,
      scaleFrom: 'person',
    });
    expect(planUnitPicked(withPlan(), 0, DRAWING)).toBeNull();
    expect(planUnitPicked(withPlan(), 1000, DRAWING)).toBeNull();
  });

  it('a locked plan re-sizes too: the lock holds its place, not its unit', () => {
    const locked = planLocked(withPlan(), true);
    expect(planUnitPicked(locked, 0.001, DRAWING)?.plan).toMatchObject({
      metresPerUnit: 0.001,
      locked: true,
    });
  });

  it.each([
    [0, 0.001],
    [0, 0.0254],
    [35, 0.001],
  ])(
    'turned %s°, re-sized to %s m a unit, its drawing’s middle stays on the house',
    (turnDeg, to) => {
      const before = planOf({ turnDeg, at: { east: -80, north: -60 } });
      const middle = laidOnGround(before, 8000, 6000);
      const after = planUnitPicked(withPlan({ turnDeg, at: before.at }), to, DRAWING)?.plan;
      if (after == null) throw new Error('no plan');
      const kept = laidOnGround(after, 8000, 6000);
      expect(kept.east).toBeCloseTo(middle.east, 6);
      expect(kept.north).toBeCloseTo(middle.north, 6);
    },
  );

  it('its edges are exact once its scale holds, and traced while it is our guess', () => {
    expect(planEdgeTrust(planOf({ scaleFrom: 'file' }))).toBe('plan');
    expect(planEdgeTrust(planOf())).toBe('traced');
  });
});

describe('laidOnGround and groundOnLaid', () => {
  it.each([
    [0, 100, 0, { east: 1, north: 0 }],
    [90, 100, 0, { east: 0, north: -1 }],
    [-90, 100, 0, { east: 0, north: 1 }],
    [0, 0, 100, { east: 0, north: 1 }],
  ] as const)('turned %s° clockwise, its point (%s, %s) lies at %j', (turnDeg, x, y, spot) => {
    const laid = { ...LAID, turnDeg };
    const ground = laidOnGround(laid, x, y);
    expect(ground.east).toBeCloseTo(spot.east, 9);
    expect(ground.north).toBeCloseTo(spot.north, 9);
    const back = groundOnLaid(laid, ground);
    expect(back.x).toBeCloseTo(x, 9);
    expect(back.y).toBeCloseTo(y, 9);
  });
});

describe('a photo of the company’s own, sized by its first length', () => {
  const photoRoof: Roof = {
    id: 'own',
    corners: [
      { east: 0, north: 0 },
      { east: 8, north: 0 },
      { east: 8, north: 6 },
      { east: 0, north: 6 },
    ],
    edges: ['traced', 'traced', 'traced', 'traced'],
    tracedOn: 'own',
    height: null,
  };
  const skyRoof: Roof = {
    ...photoRoof,
    id: 'sky',
    corners: photoRoof.corners.map((c) => ({ east: c.east + 20, north: c.north })),
    tracedOn: 'sky',
  };
  const design = (): StudioDocument => ({
    ...ownPictureLaid(EMPTY_STUDIO_DOCUMENT, { ...LAID, at: { east: 1, north: 1 } }),
    roofs: [photoRoof, skyRoof],
  });

  it('is first while its size is our guess; a drone map’s own scale never is', () => {
    expect(lengthIsFirst(design(), 'own')).toBe(true);
    const drone = { ...design(), ownPicture: { ...LAID, scaleFrom: 'file' as const } };
    expect(lengthIsFirst(drone, 'own')).toBe(false);
  });

  it('sizes the photo, its place and its roofs together, and leaves the sky’s scale and roofs', () => {
    const sized = lengthSet(design(), 0, 0, 10, 'typed');
    if (sized.kind !== 'done') throw new Error('refused');
    expect(sized.document.ownPicture).toMatchObject({
      at: { east: 1.25, north: 1.25 },
      metresPerUnit: 0.0125,
      scaleFrom: 'person',
    });
    expect(sized.document.pictureScale).toBe(1);
    expect(sized.document.roofs[0]?.corners[1]).toEqual({ east: 10, north: 0 });
    expect(sized.document.roofs[1]?.corners).toEqual(skyRoof.corners);
  });

  it.each([
    ['guess', 'assumed'],
    ['file', null],
    ['person', 'estimated'],
  ] as const)('traced lengths on a picture scaled from %s carry %s', (scaleFrom, tier) => {
    const doc = { ...design(), ownPicture: { ...LAID, scaleFrom } };
    expect(scaleTierOf(doc, 'own')).toBe(tier);
  });
});
