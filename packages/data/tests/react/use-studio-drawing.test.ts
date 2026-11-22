// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, designId, mountedOver, origin } from './studio-origin';

/**
 * Stopping a drawing and deleting a roof, through the real client (`T-M05-002`, part b): a stop
 * saves nothing and one Undo takes the corners up again; a roof deleted is one save, and Undo
 * brings it back as another.
 */
const RECTANGLE: StudioDocumentWire['roofs'][number] = {
  id: '01a50000-0000-7000-8000-000000000902',
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

async function opened(roofs: StudioDocumentWire['roofs']) {
  origin.designs = [aDesign(1)];
  stored.document = { ...stored.document, roofs };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(roofs.length));
  await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  return view;
}

describe('stopping a drawing, deleting a roof', () => {
  it('a stop saves nothing, and one Undo takes the corners up again', async () => {
    const view = await opened([RECTANGLE]);
    act(() => view.result.current.moves.draw());
    act(() => view.result.current.moves.tap({ east: 20, north: 0 }));
    act(() => view.result.current.moves.tap({ east: 26, north: 0 }));
    act(() => view.result.current.moves.cancel());
    expect(view.result.current.roofStep.kind).toBe('idle');
    expect(view.result.current.canUndo).toBe(true);
    act(() => view.result.current.moves.undo());
    const back = view.result.current.roofStep;
    expect(back.kind === 'drawing' && back.corners).toHaveLength(2);
    expect(view.result.current.document?.roofs).toHaveLength(1);
    expect(stored.saves).toHaveLength(0);
  });

  it('leaving for 3D just after a close keeps the roof, saved', async () => {
    const view = await opened([RECTANGLE]);
    act(() => view.result.current.moves.draw());
    for (const at of [
      { east: 20, north: 0 },
      { east: 26, north: 0 },
      { east: 26, north: 4 },
    ]) {
      act(() => view.result.current.moves.tap(at));
    }
    act(() => view.result.current.moves.close());
    act(() => view.result.current.moves.see('3d'));
    act(() => view.result.current.moves.see('top'));
    expect(view.result.current.bar).toMatchObject({ kind: 'roofs' });
    expect(view.result.current.document?.roofs).toHaveLength(2);
    await waitFor(() => expect(stored.saves.at(-1)?.roofs).toHaveLength(2));
  });

  it('the trash on a picked roof is one save; Undo brings the roof back', async () => {
    const view = await opened([RECTANGLE]);
    act(() => view.result.current.moves.tap({ east: 4, north: 3 }));
    act(() => view.result.current.moves.deleteRoof());
    await waitFor(() => expect(stored.saves.at(-1)?.roofs).toEqual([]));
    expect(view.result.current.bar).toMatchObject({
      kind: 'start',
      said: { kind: 'roof_deleted' },
    });
    act(() => view.result.current.moves.undo());
    await waitFor(() => expect(stored.saves.at(-1)?.roofs).toHaveLength(1));
  });
});
