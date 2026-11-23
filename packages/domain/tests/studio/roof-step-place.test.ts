import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { kindLineOf } from '../../src/studio/roof-kind-line';
import { cutToEdge, meetingOf } from '../../src/studio/roof-meet';
import { joined, shapeOf } from '../../src/studio/roof-polygons';
import { roofStepAfter } from '../../src/studio/roof-step';
import { ROOF_STEP_START } from '../../src/studio/roof-step-state';
import { box, designOf, FACTS, p, roofOf, SHED, TERRACE } from './roof-meet-support';
import { draw, run, saidOf } from './roof-step-support';

/**
 * The roof step among many roofs (`T-M05-002`, part e): a closed roof takes its place and the line
 * says what it became; a chip makes it another kind; Join and Cut to edge are each one change with
 * Undo, and a kind's chip parts two roofs Join made one.
 */
const HOUSE = designOf(TERRACE, SHED);

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
        id: 'new',
        place: 'inside',
        is: 'stair_room',
        on: 0,
        choices: ['stair_room', 'hole', 'open_shed', 'separate_part'],
        joinWith: null,
        across: false,
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

  it('the lit chip, tapped, makes the guess the person’s as one change; tapped again it changes nothing', () => {
    const closed = run(draw(box(0, 0, 3, 3), HOUSE), HOUSE);
    const make = { kind: 'make', roof: 2, into: 'stair_room', facts: FACTS } as const;
    const mine = roofStepAfter(closed.state, make, closed.document);
    expect(mine.commit?.roofs[2]?.kind).toEqual({ is: 'stair_room', setBy: 'person' });
    // The line stays, as it does for every chip.
    expect(saidOf(mine.state)).toMatchObject({ kind: 'closed', became: { is: 'stair_room' } });
    const again = roofStepAfter(mine.state, make, mine.commit ?? closed.document);
    expect(again.commit).toBeNull();
    expect(again.state).toBe(mine.state);
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
    // The line keeps what it said of the stem, so its chips can part the two again.
    expect(saidOf(after.state)).toMatchObject({
      kind: 'joined',
      roof: 0,
      name: { kind: 'roof', number: 1 },
      apart: { fresh: { id: 'stem' }, met: BAR, became: { roof: 1, is: 'building' } },
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

describe('two sloped roofs of one material join by themselves', () => {
  const design = designOf(SHED);
  const WING = box(14, 0, 4, 8);
  const closed = run(draw(WING, design, 'wing'), design);

  it('the new roof closes into the roof it meets: one roof, one change, and the line keeps its chips', () => {
    expect(closed.commits).toBe(1);
    expect(closed.document.roofs.map((roof) => roof.id)).toEqual(['shed']);
    expect(closed.document.roofs[0]?.corners).toHaveLength(4);
    expect(closed.state).toMatchObject({ kind: 'idle', roof: 0 });
    expect(saidOf(closed.state)).toMatchObject({
      kind: 'joined',
      roof: 0,
      name: { kind: 'roof', number: 1 },
      apart: { became: { choices: ['join', 'building', 'open_shed'] } },
    });
  });

  it.each([
    ['Building', 'building', undefined],
    ['Open shed', 'open_shed', { is: 'open_shed', setBy: 'person' }],
  ] as const)(
    'the %s chip parts them: the shed is as it was, and the new roof stands beside it',
    (_chip, into, kind) => {
      const after = roofStepAfter(
        closed.state,
        { kind: 'make', roof: 0, into, facts: FACTS },
        closed.document,
      );
      expect(after.commit?.roofs[0]).toEqual(SHED);
      expect(after.commit?.roofs[1]).toMatchObject({ id: 'wing', corners: WING });
      expect(after.commit?.roofs[1]?.kind).toEqual(kind);
      expect(after.state).toMatchObject({ kind: 'idle', roof: 1 });
      expect(saidOf(after.state)).toMatchObject({
        kind: 'closed',
        became: { roof: 1, is: into, joinWith: 0, beside: { kind: 'roof', number: 1 } },
      });
    },
  );

  it('a flat roof beside a flat one stays its own building, with Join as its second chip', () => {
    const flat = designOf(TERRACE);
    const beside = run(draw(box(10, 0, 4, 8), flat), flat);
    expect(beside.document.roofs).toHaveLength(2);
    expect(saidOf(beside.state)).toMatchObject({
      kind: 'closed',
      became: { choices: ['building', 'join', 'open_shed'] },
    });
  });
});

describe('a chip tapped after the design changed under the line', () => {
  it('another roof stands where the new one stood: nothing changes, and the line leaves', () => {
    const closed = run(draw(box(0, 0, 3, 3), HOUSE), HOUSE);
    expect(kindLineOf(closed.state, closed.document)?.roof).toBe(2);
    // The design read again, as another person left it: the shed is at that place now.
    const theirs = designOf(TERRACE, SHED, roofOf('other', box(30, 0, 5, 5)));
    expect(kindLineOf(closed.state, theirs)).toBeNull();
    const after = roofStepAfter(
      closed.state,
      { kind: 'make', roof: 2, into: 'hole', facts: FACTS },
      theirs,
    );
    expect(after.commit).toBeNull();
    expect(saidOf(after.state)).toBeNull();
  });

  it('the joined roof given a height in 3D keeps it: a kind’s chip no longer parts it', () => {
    const design = designOf(SHED);
    const joined = run(draw(box(14, 0, 4, 8), design, 'wing'), design);
    expect(kindLineOf(joined.state, joined.document)?.chips[0]).toEqual({
      choice: 'join',
      lit: true,
    });
    const one = joined.document.roofs[0] as Roof;
    const taller = designOf({ ...one, height: { metres: 5, setBy: 'person' } });
    expect(kindLineOf(joined.state, taller)).toBeNull();
    const after = roofStepAfter(
      joined.state,
      { kind: 'make', roof: 0, into: 'building', facts: FACTS },
      taller,
    );
    expect(after.commit).toBeNull();
    expect(saidOf(after.state)).toBeNull();
  });

  it.each([
    ['Join', { kind: 'join', roof: 2, with: 0, outline: box(0, 0, 10, 8) }],
    [
      'Cut to edge',
      {
        kind: 'cut_to_edge',
        roof: 2,
        corners: box(0, 0, 3, 3),
        placing: { meeting: meetingOf(HOUSE, box(0, 0, 3, 3), FACTS), facts: FACTS },
      },
    ],
  ] as const)('%s on a line gone stale changes nothing either', (_chip, event) => {
    const closed = run(draw(box(0, 0, 3, 3), HOUSE), HOUSE);
    const theirs = designOf(TERRACE, SHED, roofOf('other', box(30, 0, 5, 5)));
    const after = roofStepAfter(closed.state, event, theirs);
    expect(after.commit).toBeNull();
    expect(saidOf(after.state)).toBeNull();
  });
});

describe('the first roof takes what the host knows of the site’s roof', () => {
  const EMPTY = designOf();
  const TILE = { type: 'clay_tile', setBy: 'system', confirmed: false };

  it('a tiled house: the first roof starts as clay tile, still to be confirmed', () => {
    const first = run(draw(box(0, 0, 10, 8), EMPTY, 'first', { siteMaterial: 'clay_tile' }), EMPTY);
    expect(first.document.roofs[0]?.material).toEqual(TILE);
  });

  it('a second roof apart from it does not: it starts as the market’s first roof does', () => {
    const one = designOf(roofOf('first', box(0, 0, 10, 8), { material: TILE } as Partial<Roof>));
    const next = run(draw(box(30, 0, 5, 5), one, 'next', { siteMaterial: 'clay_tile' }), one);
    expect(Object.keys(next.document.roofs[1] as Roof)).not.toContain('material');
  });

  it('a host that knows nothing stores nothing: the first roof reads as the market’s first type', () => {
    const first = run(draw(box(0, 0, 10, 8), EMPTY, 'first'), EMPTY);
    expect(Object.keys(first.document.roofs[0] as Roof)).not.toContain('material');
  });
});
