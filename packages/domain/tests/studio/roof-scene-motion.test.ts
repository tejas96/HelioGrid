import { describe, expect, it } from 'vitest';
import type { StudioDocument } from '../../src/studio/document';
import { roofParapetAllRound, roofRidgeTurned } from '../../src/studio/roof-choices';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import { sceneMotionOf } from '../../src/studio/roof-scene-motion';
import {
  box,
  designOf,
  FACTS,
  kindOf,
  p,
  roofOf,
  SHED,
  stairOn,
  TERRACE,
} from './roof-meet-support';
import { shaped } from './roof-sheet-support';

/**
 * How the 3D model moves into a change (`T-M05-002`, part e, S18): each change of state moves —
 * a roof rises, grows, shrinks, fades, folds, turns; a parapet sinks or rises — and a roof whose
 * outline moved follows the hand with no motion of its own.
 */
const drawn = (document: StudioDocument) => ({ document, scene: roofSceneOf(document, FACTS) });
const motion = (before: StudioDocument, after: StudioDocument) =>
  sceneMotionOf(drawn(before), drawn(after));
const kinds = (before: StudioDocument, after: StudioDocument) =>
  motion(before, after)?.moves.map((move) => move.kind) ?? [];
const STAIR = stairOn(box(0, 0, 3, 3));

describe('the model moves into a change', () => {
  it('a new stair room rises from the roof it stands on; the model holds it back meanwhile', () => {
    const after = designOf(TERRACE, STAIR);
    const moved = motion(designOf(TERRACE), after);
    expect(moved?.moves.map((move) => move.kind)).toEqual(['rise']);
    // It rises from the terrace's top, where it stands.
    const terraceTop = drawn(after).scene.levels[0]?.topM;
    expect(moved?.moves[0]?.pivot.up).toBeCloseTo(terraceTop ?? Number.NaN, 6);
    expect(moved?.still.prisms.some((prism) => prism.roof === 1)).toBe(false);
    expect(moved?.still.prisms.some((prism) => prism.roof === 0)).toBe(true);
  });

  it.each([
    [
      'a new roof on the ground grows from it',
      designOf(TERRACE),
      designOf(TERRACE, roofOf('next', box(20, 0, 4, 4))),
      ['grow'],
    ],
    ['a deleted roof shrinks away', designOf(TERRACE, STAIR), designOf(TERRACE), ['shrink']],
    ['Undo of a delete grows it back', designOf(), designOf(TERRACE), ['grow']],
    [
      'a kind changed fades one into the other',
      designOf(TERRACE, STAIR),
      designOf(TERRACE, { ...STAIR, kind: { is: 'open_shed', setBy: 'person' } }),
      ['fade_out', 'fade_in'],
    ],
    [
      'a flat roof given a sloped shape folds its faces up; its parapet sinks',
      designOf(shaped('flat')),
      designOf(shaped('gable')),
      ['fold', 'sink'],
    ],
    [
      'a parapet taken off sinks',
      designOf(TERRACE),
      roofParapetAllRound(designOf(TERRACE), 0, false, FACTS),
      ['sink'],
    ],
    [
      'a parapet put on rises',
      roofParapetAllRound(designOf(TERRACE), 0, false, FACTS),
      designOf(TERRACE),
      ['lift'],
    ],
  ] as const)('%s', (_why, before, after, moves) => {
    expect(kinds(before, after)).toEqual(moves);
  });

  it('a gable’s ridge turned rotates its faces', () => {
    const gable = designOf(shaped('gable'));
    expect(kinds(gable, roofRidgeTurned(gable, 0, FACTS, false))).toEqual(['turn']);
  });

  it.each([
    ['nothing changed', designOf(TERRACE, STAIR), designOf(TERRACE, STAIR)],
    [
      // Pulled off the shed it shared a side with, the terrace gains a parapet there: no lift.
      'a corner dragged: the roof follows the hand',
      designOf(TERRACE, SHED),
      designOf({ ...TERRACE, corners: [p(0, 0), p(9, 0), p(9, 8), p(0, 8)] }, SHED),
    ],
    [
      'a height set',
      designOf(TERRACE),
      designOf({ ...TERRACE, height: { metres: 6, setBy: 'person' } }),
    ],
  ])('%s: no motion', (_why, before, after) => {
    expect(motion(before, after)).toBeNull();
  });

  it('a leaving roof is drawn from the model before the change', () => {
    const before = designOf(
      TERRACE,
      kindOf('shed', 'open_shed', box(2, 2, 3, 3), { on: 'terrace' }),
    );
    const moved = motion(before, designOf(TERRACE));
    expect(moved?.moves[0]?.parts.prisms.every((prism) => prism.roof === 1)).toBe(true);
    expect(moved?.moves[0]?.parts.prisms.length).toBeGreaterThan(0);
  });
});
