import { describe, expect, it } from 'vitest';
import { roofBuilt } from '../../src/studio/roof-built';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import { designOf, FACTS, TERRACE } from './roof-meet-support';
import { shaped } from './roof-sheet-support';

/**
 * A parapet on a sloped roof stands on the face at its edge (`T-M05-002`, part e, E101): along a
 * gable end it climbs to the ridge, along a shed's high side it sits at the high edge; on a flat
 * roof it stands level.
 */
const WALLED = [{ parapet: true }, { parapet: true }, { parapet: true }, { parapet: true }];
const parapetsOf = (roof: ReturnType<typeof shaped>) =>
  roofSceneOf(designOf(roof), FACTS).prisms.filter((prism) => prism.part === 'parapet');
const highest = (rise: readonly number[] | undefined) => Math.max(0, ...(rise ?? []));

describe('a parapet on a sloped roof', () => {
  it('along a gable end it climbs with the faces to the ridge', () => {
    const gable = shaped('gable', { sides: WALLED });
    const ridge = roofBuilt(gable, FACTS).topM;
    const rises = parapetsOf(gable).map((prism) => highest(prism.rise));
    // The two eaves stand level; each gable end is two pieces, each climbing to the ridge.
    expect(rises.filter((rise) => rise < 1e-6)).toHaveLength(2);
    const climbing = rises.filter((rise) => rise > 1e-6);
    expect(climbing).toHaveLength(4);
    for (const rise of climbing) expect(rise).toBeCloseTo(ridge, 1);
  });

  it('along a shed’s high side it sits at the high edge', () => {
    const shed = shaped('shed', { sides: WALLED });
    const high = roofBuilt(shed, FACTS).topM;
    const rises = parapetsOf(shed).map((prism) => highest(prism.rise));
    expect(Math.max(...rises)).toBeCloseTo(high, 1);
  });

  it('on a flat roof it stands level', () => {
    expect(
      roofSceneOf(designOf(TERRACE), FACTS)
        .prisms.filter((prism) => prism.part === 'parapet')
        .every((prism) => prism.rise === undefined),
    ).toBe(true);
  });
});
