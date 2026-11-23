import {
  cornerAdded,
  cornerDragged,
  cornerRemoved,
  lengthSet,
  ROOF_STEP_START,
  type RoofStepEvent,
  roofHeightReset,
  roofHeightSet,
  roofMoved,
  roofStepAfter,
  roofTurned,
  type StudioDocument,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { studioDocumentSchema } from '../src';

/**
 * Every app version open while part e ships keeps a design whole (`T-M05-002`, part e): each edit
 * this release makes, run on a design a later studio saved — roofs standing on roofs, a hole, sides
 * with their own settings — leaves a design the contract still reads, with the later studio's
 * fields where it put them.
 */
const ID = (n: number) => `6f1e8c2a-0b7d-4c35-9a51-${String(n).padStart(12, '0')}`;
const box = (west: number, south: number, wide: number, deep: number) => [
  { east: west, north: south },
  { east: west + wide, north: south },
  { east: west + wide, north: south + deep },
  { east: west, north: south + deep },
];
const TRACED = ['traced', 'traced', 'traced', 'traced'] as const;
const SYSTEM = { setBy: 'system' } as const;
const PERSON = { setBy: 'person' } as const;

/** A house as a later studio saves it: a terrace, its stair room, a duct, and a shed beside it. */
const LATER: StudioDocument = studioDocumentSchema.parse({
  schemaVersion: 1,
  picture: null,
  drawnOn: { source: 'google', takenOn: '2025-10-04' },
  pictureScale: 1,
  roofs: [
    {
      id: ID(1),
      corners: box(0, 0, 10, 8),
      edges: TRACED,
      tracedOn: 'sky',
      height: null,
      kind: { is: 'building', ...SYSTEM },
      material: { type: 'rcc', ...SYSTEM, confirmed: false },
      shape: { is: 'flat', ...SYSTEM },
      parapet: { allRound: true, metres: 1, ...SYSTEM, lengthsMeasured: 'outside' },
      setback: { metres: 0.5, ...SYSTEM },
      sides: [
        { parapet: false },
        { parapetM: 1.5, setbackM: 0 },
        {},
        { stairsAt: 6, stairsBy: 'person' },
      ],
    },
    {
      id: ID(2),
      corners: box(0, 0, 3, 3),
      edges: TRACED,
      tracedOn: 'sky',
      height: { metres: 3, ...SYSTEM },
      kind: { is: 'stair_room', ...SYSTEM },
      on: ID(1),
      material: { type: 'rcc', ...SYSTEM, confirmed: false },
      sides: [{}, { stairsAt: 1.5, stairsBy: 'system' }, {}, {}],
    },
    {
      id: ID(3),
      corners: box(6, 5, 1, 1),
      edges: TRACED,
      tracedOn: 'sky',
      height: null,
      kind: { is: 'hole', ...PERSON },
      partOf: ID(1),
    },
    {
      id: ID(4),
      corners: box(10, 0, 4, 8),
      edges: TRACED,
      tracedOn: 'sky',
      height: { metres: 3.2, ...PERSON },
      material: { type: 'trapezoidal_sheet', ...PERSON, confirmed: true },
      shape: { is: 'shed', ...SYSTEM },
      slope: { degrees: 6, ...SYSTEM },
      sides: [{}, { low: 'system' }, {}, {}],
    },
  ],
  stairsSkipped: false,
});

const doneOf = (result: { kind: string; document?: StudioDocument }): StudioDocument => {
  if (result.kind !== 'done' || result.document === undefined)
    throw new Error('the edit was refused');
  return result.document;
};
const at = (east: number, north: number) => ({ east, north });

/** Events run over the design as the studio runs them: the last commit is the design after. */
function stepped(events: readonly RoofStepEvent[]): StudioDocument {
  let state = ROOF_STEP_START;
  let document = LATER;
  for (const event of events) {
    const outcome = roofStepAfter(state, event, document);
    state = outcome.state;
    document = outcome.commit ?? document;
  }
  return document;
}

const MOVES: readonly (readonly [string, () => StudioDocument, number])[] = [
  ['a corner added on the terrace', () => doneOf(cornerAdded(LATER, 0, 3)), 4],
  [
    'a corner added, then removed',
    () => doneOf(cornerRemoved(doneOf(cornerAdded(LATER, 0, 1)), 0, 2)),
    4,
  ],
  [
    'a corner removed from the shed',
    () => doneOf(cornerRemoved(doneOf(cornerAdded(LATER, 3, 0)), 3, 0)),
    4,
  ],
  ['a terrace corner dragged', () => cornerDragged(LATER, 0, 2, at(10, 9), false).document, 4],
  [
    'the stair room’s corner dragged past its roof',
    () => cornerDragged(LATER, 1, 0, at(-1, -1), false).document,
    4,
  ],
  ['the terrace moved, with what stands on it', () => roofMoved(LATER, 0, at(-30, 4)).document, 4],
  ['the terrace turned, with what stands on it', () => roofTurned(LATER, 0, 37, false).document, 4],
  ['the first true length set', () => doneOf(lengthSet(LATER, 0, 0, 10.4, 'typed')), 4],
  ['a measured length set on the shed', () => doneOf(lengthSet(LATER, 3, 1, 8.2, 'measured')), 4],
  ['the stair room’s height set', () => doneOf(roofHeightSet(LATER, 1, 2.6)), 4],
  ['the shed’s height handed back', () => roofHeightReset(LATER, 3), 4],
  [
    'the stair room deleted',
    () => stepped([{ kind: 'tap', at: at(1.5, 1.5), system: 'metric' }, { kind: 'delete_roof' }]),
    3,
  ],
  [
    'the terrace deleted, with its stair room and its duct',
    () => stepped([{ kind: 'tap', at: at(8, 2), system: 'metric' }, { kind: 'delete_roof' }]),
    1,
  ],
  [
    'another roof drawn beside the shed',
    () =>
      stepped([
        { kind: 'draw', magnet: false },
        { kind: 'tap', at: at(20, 0), system: 'metric' },
        { kind: 'tap', at: at(26, 0), system: 'metric' },
        { kind: 'tap', at: at(26, 5), system: 'metric' },
        { kind: 'tap', at: at(20, 5), system: 'metric' },
        { kind: 'close', id: ID(5), tracedOn: 'sky', stamp: null, ghost: false },
      ]),
    5,
  ],
];

describe('this release’s edits on a design a later studio saved', () => {
  it.each(MOVES)(
    '%s: the design still reads, and reads back as it was saved',
    (_why, move, roofs) => {
      const after = move();
      expect(after).not.toBe(LATER);
      expect(after.roofs).toHaveLength(roofs);
      expect(studioDocumentSchema.parse(JSON.parse(JSON.stringify(after)))).toEqual(after);
    },
  );

  it('an edit keeps what the later studio stored on the roofs it did not touch', () => {
    const after = roofMoved(LATER, 3, at(5, 0)).document;
    expect(after.roofs.slice(0, 3)).toEqual(LATER.roofs.slice(0, 3));
    const { corners: _moved, ...shed } = after.roofs[3] as StudioDocument['roofs'][number];
    const { corners: _stood, ...before } = LATER.roofs[3] as StudioDocument['roofs'][number];
    expect(shed).toEqual(before);
  });
});
