// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { type GroundPoint, IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, designId, mountedOver, origin } from './studio-origin';

/**
 * A roof's sheet holds its roof by id, through the real client (`T-M05-002`): a roof deleted, made
 * a hole or put back by Undo moves the others in the list, and the sheet never moves on to the roof
 * that comes to stand in its roof's place, nor keeps a height in hand on it.
 */
const square = (id: string, west: number, side: number): StudioDocumentWire['roofs'][number] => ({
  id,
  corners: [
    { east: west, north: 0 },
    { east: west + side, north: 0 },
    { east: west + side, north: side },
    { east: west, north: side },
  ] as GroundPoint[],
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
});
const MAIN = square('01a50000-0000-7000-8000-000000000921', 0, 10);
const BESIDE = square('01a50000-0000-7000-8000-000000000922', 14, 5);
/** A stair room on the main roof's corner, on its walls: made a hole, the main roof takes the notch. */
const STAIR = {
  ...square('01a50000-0000-7000-8000-000000000923', 0, 3),
  kind: { is: 'stair_room', setBy: 'system' },
  on: MAIN.id,
} as StudioDocumentWire['roofs'][number];

async function openedOn(roofs: StudioDocumentWire['roofs'], roof: number) {
  origin.designs = [aDesign(1)];
  stored.document = { ...stored.document, roofs };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(roofs.length));
  await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  act(() => view.result.current.moves.see('3d'));
  act(() => view.result.current.moves.openRoof(roof));
  return view;
}
/** The roofs of the last save, once it has landed: the next test starts from its own design. */
const savedRoofs = async (count: number) => {
  await waitFor(() => expect(stored.saves.at(-1)?.roofs).toHaveLength(count));
  return stored.saves.at(-1)?.roofs ?? [];
};

describe('a roof deleted while a sheet is open', () => {
  it('its own sheet closes: it never moves on to the roof now in its place', async () => {
    const view = await openedOn([MAIN, BESIDE], 0);
    expect(view.result.current.roofSheet?.roof).toBe(0);
    act(() => view.result.current.moves.deleteRoofAt(0));
    await savedRoofs(1);
    expect(view.result.current.document?.roofs[0]?.id).toBe(BESIDE.id);
    expect(view.result.current.roofSheet).toBeNull();
  });

  it('another roof’s sheet stays on its own roof, wherever the list puts it', async () => {
    const view = await openedOn([MAIN, BESIDE], 1);
    act(() => view.result.current.moves.deleteRoofAt(0));
    await savedRoofs(1);
    expect(view.result.current.roofSheet?.roof).toBe(0);
    expect(view.result.current.roofSheet?.area).toBe(25);
  });

  it('Undo brings the roof back with its sheet closed', async () => {
    const view = await openedOn([MAIN, BESIDE], 0);
    act(() => view.result.current.moves.deleteRoofAt(0));
    await savedRoofs(1);
    act(() => view.result.current.moves.undo());
    await savedRoofs(2);
    expect(view.result.current.roofSheet).toBeNull();
  });
});

describe('a stair room made a hole while its sheet is open', () => {
  it('listed before the roof it stands on, the sheet still goes to that roof', async () => {
    const view = await openedOn([STAIR, MAIN], 0);
    act(() => view.result.current.moves.makeKind('hole'));
    await savedRoofs(1);
    expect(view.result.current.document?.roofs[0]?.id).toBe(MAIN.id);
    expect(view.result.current.roofSheet?.roof).toBe(0);
  });

  it('a height in hand is dropped: it is never kept on the roof that takes its place', async () => {
    const view = await openedOn([MAIN, STAIR, BESIDE], 1);
    act(() => view.result.current.moves.slideHeight(9));
    act(() => view.result.current.moves.makeKind('hole'));
    const roofs = await savedRoofs(2);
    expect(roofs.map((roof) => roof.height?.metres ?? null)).not.toContain(9);
  });
});
