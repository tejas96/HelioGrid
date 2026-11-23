import { describe, expect, it } from 'vitest';
import type { Roof, StudioDocument } from '../../src/studio/document';
import { cutToEdge, meetingOf } from '../../src/studio/roof-meet';
import { joined, shapeOf } from '../../src/studio/roof-polygons';
import { roofStepAfter } from '../../src/studio/roof-step';
import { COPY_GAP_M } from '../../src/studio/roof-step-place';
import {
  ROOF_STEP_START,
  type RoofStepEvent,
  type RoofStepState,
} from '../../src/studio/roof-step-state';
import { box, designOf, FACTS, p, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * The roof step among many roofs (`T-M05-002`, part e): a closed roof takes its place and the line
 * says what it became; a chip makes it another kind; Join, Cut to edge, Copy and Delete are each
 * one change with Undo.
 */
function run(events: readonly RoofStepEvent[], from: StudioDocument) {
  let state: RoofStepState = ROOF_STEP_START;
  let document = from;
  let commits = 0;
  for (const event of events) {
    const outcome = roofStepAfter(state, event, document);
    state = outcome.state;
    if (outcome.commit !== null) {
      document = outcome.commit;
      commits += 1;
    }
  }
  return { state, document, commits };
}
const tap = (east: number, north: number): RoofStepEvent => ({
  kind: 'tap',
  at: p(east, north),
  system: 'metric',
});
/** A roof drawn corner by corner and closed, placed by the kernel as the studio's hook asks it to. */
const draw = (
  corners: ReturnType<typeof box>,
  design: StudioDocument,
  id = 'new',
): RoofStepEvent[] => [
  { kind: 'draw', magnet: false },
  ...corners.map((corner) => tap(corner.east, corner.north)),
  {
    kind: 'close',
    id,
    tracedOn: 'sky',
    stamp: null,
    ghost: false,
    placing: { meet: (outline) => meetingOf(design, outline, FACTS), facts: FACTS },
  },
];
const HOUSE = designOf(TERRACE, SHED);
const saidOf = (state: RoofStepState) => (state.kind === 'idle' ? state.said : null);

describe('a new roof closes among the others', () => {
  it('a stair room on the terrace: it is the picked roof, and the line says what it became with its chips', () => {
    const { state, document, commits } = run(draw(box(0, 0, 3, 3), HOUSE), HOUSE);
    expect(commits).toBe(1);
    expect(document.roofs[2]).toMatchObject({
      kind: { is: 'stair_room', setBy: 'system' },
      on: 'terrace',
    });
    expect(state).toMatchObject({ kind: 'idle', roof: 2 });
    expect(saidOf(state)).toEqual({
      kind: 'closed',
      became: {
        roof: 2,
        place: 'inside',
        is: 'stair_room',
        on: 0,
        choices: ['stair_room', 'hole', 'open_shed', 'separate_part'],
        joinWith: null,
        toCheck: true,
        // "Stair room on Roof 1 · 3 m above Roof 1 · to check".
        name: { kind: 'stair_room', with: 1 },
        beside: { kind: 'roof', number: 1 },
        aboveM: 3,
      },
    });
  });

  it('a roof closed with no word on how it meets the others stands as drawn, a building', () => {
    const events = draw(box(0, 0, 3, 3), HOUSE).map((event) =>
      event.kind === 'close' ? { ...event, placing: undefined } : event,
    );
    const { state, document } = run(events, HOUSE);
    expect(Object.keys(document.roofs[2] ?? {})).not.toContain('kind');
    expect(saidOf(state)).toEqual({ kind: 'closed' });
  });

  it('a chip makes it another kind: one tap, one change, the line stays with that chip lit', () => {
    const closed = run(draw(box(0, 0, 3, 3), HOUSE), HOUSE);
    const { state, document, commits } = run(
      [{ kind: 'make', roof: 2, into: 'hole', facts: FACTS }],
      closed.document,
    );
    expect(commits).toBe(1);
    expect(document.roofs[2]).toMatchObject({
      kind: { is: 'hole', setBy: 'person' },
      partOf: 'terrace',
    });
    // Run from a fresh step the line is the sheet's; from the close it keeps its chips.
    expect(saidOf(state)).toEqual({
      kind: 'made',
      roof: 2,
      is: 'hole',
      name: { kind: 'hole', with: 1 },
    });
    const after = roofStepAfter(
      closed.state,
      { kind: 'make', roof: 2, into: 'hole', facts: FACTS },
      closed.document,
    );
    expect(saidOf(after.state)).toMatchObject({
      kind: 'closed',
      // "Hole in Roof 1": no height is said of a hole.
      became: {
        is: 'hole',
        place: 'inside',
        name: { kind: 'hole', with: 1 },
        beside: { kind: 'roof', number: 1 },
        aboveM: null,
      },
    });
  });

  it('the chip of the kind it already is changes nothing', () => {
    const closed = run(draw(box(0, 0, 3, 3), HOUSE), HOUSE);
    const again = roofStepAfter(
      closed.state,
      { kind: 'make', roof: 2, into: 'stair_room', facts: FACTS },
      closed.document,
    );
    expect(again.commit).toBeNull();
    expect(again.state).toBe(closed.state);
  });
});

describe('Join and Cut to edge', () => {
  const BAR = roofOf('bar', box(0, 6, 12, 5), { edges: ['typed', 'typed', 'typed', 'typed'] });
  const STEM = box(4, 0, 4, 6);

  it('Join: the T drawn as two rectangles becomes one roof with one outline, as one change', () => {
    const design = designOf(BAR);
    const closed = run(draw(STEM, design, 'stem'), design);
    const outline = (joined([shapeOf(BAR.corners)], [shapeOf(STEM)]) ?? [])[0]?.outer ?? [];
    const after = roofStepAfter(
      closed.state,
      { kind: 'join', roof: 1, with: 0, outline },
      closed.document,
    );
    expect(after.commit?.roofs).toHaveLength(1);
    const one = after.commit?.roofs[0] as Roof;
    expect(one.id).toBe('bar');
    expect(one.corners).toHaveLength(8);
    // The bar's far side and ends still stand where they stood: their lengths are still typed.
    expect(one.edges.filter((trust) => trust === 'typed')).toHaveLength(3);
    expect(saidOf(after.state)).toEqual({
      kind: 'joined',
      roof: 0,
      name: { kind: 'roof', number: 1 },
    });
  });

  it('Join with a roof drawn after the new one keeps the count right', () => {
    const design = designOf(roofOf('stem', STEM), BAR);
    const outline = (joined([shapeOf(BAR.corners)], [shapeOf(STEM)]) ?? [])[0]?.outer ?? [];
    const after = roofStepAfter(
      ROOF_STEP_START,
      { kind: 'join', roof: 0, with: 1, outline },
      design,
    );
    expect(after.commit?.roofs.map((roof) => roof.id)).toEqual(['bar']);
    expect(saidOf(after.state)).toMatchObject({ kind: 'joined', roof: 0 });
  });

  it('Cut to edge: the roof drawn 0.7 m onto the terrace is trimmed to its edge, and is its own building beside it', () => {
    const design = designOf(TERRACE);
    const drawn = box(9.3, 0, 4.7, 8);
    const closed = run(draw(drawn, design, 'shed'), design);
    expect(closed.document.roofs[1]).toMatchObject({ kind: { is: 'upper_floor' }, on: 'terrace' });
    const corners = cutToEdge(design, drawn) ?? [];
    const placing = { meeting: meetingOf(design, corners, FACTS), facts: FACTS };
    const after = roofStepAfter(
      closed.state,
      { kind: 'cut_to_edge', roof: 1, corners, placing },
      closed.document,
    );
    const cut = after.commit?.roofs[1] as Roof;
    expect(Object.keys(cut)).not.toContain('kind');
    expect(Object.keys(cut)).not.toContain('on');
    expect(cut.corners).toContainEqual(p(10, 0));
    expect(saidOf(after.state)).toMatchObject({
      kind: 'cut',
      // "Roof 2 beside Roof 1 · shares Roof 1's edge".
      became: {
        place: 'beside',
        is: 'building',
        joinWith: 0,
        name: { kind: 'roof', number: 2 },
        beside: { kind: 'roof', number: 1 },
      },
    });
  });
});

describe('Copy and Delete, from a roof’s row', () => {
  const stair = stairOn(box(0, 0, 3, 3));
  const design = designOf(TERRACE, stair, SHED);

  it('Copy: the roof and what stands on it land beside it, cutting nothing, and the copy is picked', () => {
    const { state, document, commits } = run(
      [{ kind: 'copy_roof', roof: 0, ids: ['copy', 'copy-stair'] }],
      design,
    );
    expect(commits).toBe(1);
    expect(document.roofs.map((roof) => roof.id)).toEqual([
      'terrace',
      'stair',
      'shed',
      'copy',
      'copy-stair',
    ]);
    // East of the terrace stands the shed: the copy goes south, a gap clear of it.
    expect(document.roofs[3]?.corners[0]).toEqual(p(0, -(8 + COPY_GAP_M)));
    expect(document.roofs[4]).toMatchObject({ on: 'copy', kind: { is: 'stair_room' } });
    expect(state).toMatchObject({
      kind: 'idle',
      roof: 3,
      said: { kind: 'copied', roof: 3, of: { kind: 'roof', number: 1 } },
    });
  });

  it('a copy keeps what the roof is made of and whether it was confirmed', () => {
    const made = {
      ...TERRACE,
      material: { type: 'rcc', setBy: 'person', confirmed: true } as const,
    };
    const { document } = run([{ kind: 'copy_roof', roof: 0, ids: ['copy'] }], designOf(made));
    expect(document.roofs[1]?.material).toEqual(made.material);
    expect(document.roofs[1]?.corners[0]).toEqual(p(10 + COPY_GAP_M, 0));
  });

  it('a copy with too few names for its parts makes nothing', () => {
    expect(run([{ kind: 'copy_roof', roof: 0, ids: ['copy'] }], design).commits).toBe(0);
  });

  it('Delete on a row: that roof goes with what stands on it, and the line names what went', () => {
    const { state, document, commits } = run([{ kind: 'delete_roof', roof: 0 }], design);
    expect(commits).toBe(1);
    expect(document.roofs.map((roof) => roof.id)).toEqual(['shed']);
    expect(saidOf(state)).toEqual({ kind: 'roof_deleted', was: { kind: 'roof', number: 1 } });
  });

  it('Delete on the stair room’s row names it by its kind and its roof', () => {
    const { state, document } = run([{ kind: 'delete_roof', roof: 1 }], design);
    expect(document.roofs.map((roof) => roof.id)).toEqual(['terrace', 'shed']);
    expect(saidOf(state)).toEqual({ kind: 'roof_deleted', was: { kind: 'stair_room', with: 1 } });
  });
});
