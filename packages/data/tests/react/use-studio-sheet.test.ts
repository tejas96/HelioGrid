// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, designId, mountedOver, origin } from './studio-origin';

/**
 * A roof's height in 3D and a length in the box, through the real client (`T-M05-002`, part b):
 * each height kept is one save of the whole document, checked against the contract; a refused
 * height stays in the box with its reason and is not sent; Undo puts back a height in hand first.
 */
const RECTANGLE: StudioDocumentWire['roofs'][number] = {
  id: '01a50000-0000-7000-8000-000000000901',
  corners: [
    { east: 0, north: 0 },
    { east: 8, north: 0 },
    { east: 8, north: 6 },
    { east: 0, north: 6 },
  ],
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
};

async function opened() {
  origin.designs = [aDesign(1)];
  stored.document = { ...stored.document, roofs: [RECTANGLE] };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(1));
  await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  act(() => view.result.current.moves.see('3d'));
  act(() => view.result.current.moves.openRoof(0));
  return view;
}

const lastHeight = () => stored.saves.at(-1)?.roofs[0]?.height;

describe('a roof’s height: kept, refused, reset, undone', () => {
  it('a height kept is one save of the person’s height; Reset saves the system’s', async () => {
    const view = await opened();
    act(() => view.result.current.moves.slideHeight(4.5));
    expect(stored.saves).toHaveLength(0);
    act(() => view.result.current.moves.keepHeight());
    await waitFor(() => expect(lastHeight()).toEqual({ metres: 4.5, setBy: 'person' }));
    expect(view.result.current.roofSheet?.height.tier).toBe('estimated');
    act(() => view.result.current.moves.resetHeight());
    await waitFor(() => expect(stored.saves).toHaveLength(2));
    expect(lastHeight()).toBeNull();
    expect(view.result.current.roofSheet?.height).toMatchObject({ metres: 3, tier: 'assumed' });
  });

  it('a height past its limit stays in the box with its reason, and nothing is sent', async () => {
    const view = await opened();
    act(() => view.result.current.moves.typeHeight({ main: '400', inches: '', measured: false }));
    act(() => view.result.current.moves.keepHeight());
    expect(view.result.current.heightRefusal).toBe('too_long');
    expect(view.result.current.heightEntry?.main).toBe('400');
    expect(view.result.current.moves.done()).toBe(false);
    expect(view.result.current.roofSheet).not.toBeNull();
    expect(stored.saves).toHaveLength(0);
  });

  it('Undo with a height in hand puts that back first, and the design stays', async () => {
    const view = await opened();
    act(() => view.result.current.moves.slideHeight(6));
    act(() => view.result.current.moves.undo());
    expect(view.result.current.roofSheet?.height.metres).toBe(3);
    expect(view.result.current.document?.roofs).toHaveLength(1);
    expect(stored.saves).toHaveLength(0);
  });

  it('the top view keeps the height and the sheet, and picks the roof', async () => {
    const view = await opened();
    act(() => view.result.current.moves.slideHeight(5));
    act(() => view.result.current.moves.see('top'));
    await waitFor(() => expect(lastHeight()).toEqual({ metres: 5, setBy: 'person' }));
    expect(view.result.current.view).toBe('top');
    expect(view.result.current.roofSheet?.roof).toBe(0);
    expect(view.result.current.roofStep).toMatchObject({
      kind: 'idle',
      roof: 0,
      said: { kind: 'roof_picked', roof: 0, metres: 5 },
    });
  });
});

describe('a length in the box', () => {
  it('opened and let go by a tap elsewhere sends nothing; set, it is one save', async () => {
    const view = await opened();
    act(() => view.result.current.moves.see('top'));
    act(() => view.result.current.moves.pickLength(0, 0));
    act(() => view.result.current.moves.tap({ east: 30, north: 30 }));
    expect(view.result.current.roofStep.kind).toBe('idle');
    act(() => view.result.current.moves.pickLength(0, 0));
    act(() => view.result.current.moves.slideLength(8.2));
    act(() => view.result.current.moves.setLength());
    await waitFor(() => expect(stored.saves).toHaveLength(1));
    expect(stored.saves[0]?.roofs[0]?.edges[0]).toBe('typed');
    expect(stored.saves[0]?.pictureScale).toBeCloseTo(8.2 / 8);
  });
});
