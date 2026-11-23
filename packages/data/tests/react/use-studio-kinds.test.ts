// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { type GroundPoint, IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, designId, mountedOver, origin } from './studio-origin';

/**
 * A new roof among the others, through the real client (`T-M05-002`, part e): the studio's kernel
 * places it when it closes, the line offers its likely kinds, and each chip is one save.
 */
const TERRACE: StudioDocumentWire['roofs'][number] = {
  id: '01a50000-0000-7000-8000-000000000911',
  corners: [
    { east: 0, north: 0 },
    { east: 10, north: 0 },
    { east: 10, north: 8 },
    { east: 0, north: 8 },
  ],
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
};
const box = (west: number, south: number, wide: number, deep: number): GroundPoint[] => [
  { east: west, north: south },
  { east: west + wide, north: south },
  { east: west + wide, north: south + deep },
  { east: west, north: south + deep },
];

async function opened(roofs: StudioDocumentWire['roofs']) {
  origin.designs = [aDesign(1)];
  stored.document = { ...stored.document, roofs };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(roofs.length));
  await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  return view;
}
type View = Awaited<ReturnType<typeof opened>>;

/** A roof drawn corner by corner and closed on its first corner. */
function draw(view: View, corners: readonly GroundPoint[]) {
  act(() => view.result.current.moves.draw());
  for (const at of corners) act(() => view.result.current.moves.tap(at));
  act(() => view.result.current.moves.closeAsDrawn());
}
const chips = (view: View) => view.result.current.kindLine?.chips.map((chip) => chip.choice);
const lit = (view: View) => view.result.current.kindLine?.chips.find((chip) => chip.lit)?.choice;
const saved = () => stored.saves.at(-1)?.roofs ?? [];

describe('a new roof takes its place when it closes', () => {
  it('drawn on the terrace it is a stair room on it, saved once, and its chips fix a wrong guess in one save each', async () => {
    const view = await opened([TERRACE]);
    draw(view, box(0, 0, 3, 3));
    await waitFor(() => expect(saved()).toHaveLength(2));
    expect(saved()[1]).toMatchObject({
      kind: { is: 'stair_room', setBy: 'system' },
      on: TERRACE.id,
    });
    expect(stored.saves).toHaveLength(1);
    expect(chips(view)).toEqual(['stair_room', 'hole', 'open_shed', 'separate_part']);
    act(() => view.result.current.moves.chooseKind('hole'));
    await waitFor(() => expect(saved()[1]?.kind).toEqual({ is: 'hole', setBy: 'person' }));
    expect(saved()[1]?.partOf).toBe(TERRACE.id);
    // The line stays, the chip a person picked now first.
    expect(chips(view)).toEqual(['hole', 'stair_room', 'open_shed', 'separate_part']);
  });

  it('drawn 0.7 m onto the terrace: Cut to edge trims it, Join makes the two one, and Building parts them', async () => {
    const view = await opened([TERRACE]);
    draw(view, box(9.3, 0, 4.7, 8));
    await waitFor(() => expect(saved()[1]?.kind?.is).toBe('upper_floor'));
    expect(chips(view)).toEqual(['upper_floor', 'open_shed', 'cut_to_edge']);

    act(() => view.result.current.moves.chooseKind('cut_to_edge'));
    await waitFor(() => expect(saved()[1]?.corners).toContainEqual({ east: 10, north: 0 }));
    expect(Object.keys(saved()[1] ?? {})).not.toContain('kind');
    expect(chips(view)).toEqual(['building', 'join', 'open_shed']);

    act(() => view.result.current.moves.chooseKind('join'));
    await waitFor(() => expect(saved()).toHaveLength(1));
    expect(saved()[0]).toMatchObject({ id: TERRACE.id });
    expect(saved()[0]?.corners.some((corner) => corner.east === 14)).toBe(true);
    expect(lit(view)).toBe('join');

    act(() => view.result.current.moves.chooseKind('building'));
    await waitFor(() => expect(saved()).toHaveLength(2));
    expect(saved()[0]?.corners).toEqual(TERRACE.corners);
    expect(lit(view)).toBe('building');
  });

  it('the line leaves at the next tap on the model', async () => {
    const view = await opened([TERRACE]);
    draw(view, box(0, 0, 3, 3));
    expect(view.result.current.kindLine).not.toBeNull();
    act(() => view.result.current.moves.tap({ east: 40, north: 40 }));
    expect(view.result.current.kindLine).toBeNull();
    act(() => view.result.current.moves.chooseKind('hole'));
    await waitFor(() => expect(saved()[1]?.kind?.is).toBe('stair_room'));
  });
});

describe('the first roof, and a roof’s row', () => {
  it('the first roof starts as what the lead says the site’s roof is, still to be confirmed', async () => {
    origin.siteRoof = 'tile';
    const view = await opened([]);
    draw(view, box(0, 0, 10, 8));
    await waitFor(() => expect(saved()).toHaveLength(1));
    expect(saved()[0]?.material).toEqual({ type: 'clay_tile', setBy: 'system', confirmed: false });
    origin.siteRoof = null;
  });

  it('Copy takes what stands on the roof with it, and Delete on a row takes both away, each as one save', async () => {
    const stair = {
      ...TERRACE,
      id: '01a50000-0000-7000-8000-000000000912',
      corners: box(0, 0, 3, 3),
      kind: { is: 'stair_room', setBy: 'system' },
      on: TERRACE.id,
    } as StudioDocumentWire['roofs'][number];
    const view = await opened([TERRACE, stair]);
    act(() => view.result.current.moves.copyRoof(0));
    await waitFor(() => expect(saved()).toHaveLength(4));
    expect(saved()[3]?.on).toBe(saved()[2]?.id);
    expect(stored.saves).toHaveLength(1);
    act(() => view.result.current.moves.deleteRoofAt(2));
    await waitFor(() => expect(saved()).toHaveLength(2));
    expect(stored.saves).toHaveLength(2);
  });
});
