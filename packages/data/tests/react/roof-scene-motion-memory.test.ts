import { EMPTY_STUDIO_DOCUMENT, IN_FORMATS, type StudioDocument } from '@heliogrid/domain';
import { roofSceneOf } from '@heliogrid/domain/studio-kernel';
import { describe, expect, it } from 'vitest';
import { motionOf, type RoofMemory } from '../../src/react/roof-scene-view';

/**
 * The model's motion between designs drawn (`T-M05-002`, part e, S18): while a drag or a slider
 * holds a value nothing moves, and the model moves on from the last design kept.
 */
const FACTS = { ...IN_FORMATS.roof, storeyHeightM: IN_FORMATS.storeyHeightM };
const square = (west: number) => [
  { east: west, north: 0 },
  { east: west + 4, north: 0 },
  { east: west + 4, north: 4 },
  { east: west, north: 4 },
];
const roof = (id: string, west: number) => ({
  id,
  corners: square(west),
  edges: ['traced', 'traced', 'traced', 'traced'] as const,
  tracedOn: 'sky' as const,
  height: null,
});
const drawn = (...roofs: ReturnType<typeof roof>[]) => {
  const document: StudioDocument = { ...EMPTY_STUDIO_DOCUMENT, roofs };
  return { document, scene: roofSceneOf(document, FACTS) };
};

describe('motionOf', () => {
  it('a roof added while a value is held moves nothing; let go, it moves once from the kept design', () => {
    const memory: RoofMemory = {};
    const kept = drawn(roof('a', 0));
    expect(motionOf(memory, kept, false)).toBeNull();
    // A preview in hand with a second roof: no motion, and the kept design stays the one to move from.
    expect(motionOf(memory, drawn(roof('a', 0), roof('b', 10)), true)).toBeNull();
    expect(memory.drawn).toBe(kept);
    const moved = motionOf(memory, drawn(roof('a', 0), roof('b', 10)), false);
    expect(moved?.moves.map((move) => move.kind)).toEqual(['grow']);
  });
});
