// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import {
  aDesign,
  DESIGNS_ROLE,
  designId,
  mountedOver,
  origin,
  READS_ONLY_ROLE,
} from './studio-origin';

/**
 * An Any-shape roof's faces drawn by hand, through the real client (`T-M05-002`, part e, E082,
 * board 5.10): Any shape picked on the roof's sheet starts drawing in the top view; each face closed
 * is one save and the next starts at once; Undo between faces takes the last one back; once they
 * cover the roof drawing ends; the Faces row draws them again.
 */
type WireRoof = StudioDocumentWire['roofs'][number];
const at = (east: number, north: number) => ({ east, north });
const ROOF: WireRoof = {
  id: '01a50000-0000-7000-8000-000000000931',
  corners: [at(0, 0), at(8, 0), at(8, 4), at(0, 4)],
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
};
const SOUTH_HALF = [at(0, 0), at(8, 0), at(8, 2), at(0, 2)];
const NORTH_HALF = [at(0, 2), at(8, 2), at(8, 4), at(0, 4)];

async function opened(roofs: WireRoof[], editor = true) {
  origin.roles = [editor ? DESIGNS_ROLE : READS_ONLY_ROLE];
  origin.designs = [aDesign(1)];
  stored.document = { ...stored.document, roofs };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(roofs.length));
  if (editor) await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  return view;
}
type View = Awaited<ReturnType<typeof opened>>;
const saved = () => stored.saves.at(-1);
const savedFaces = () => saved()?.roofs[0]?.shape?.faces;

/** Each corner tapped, then Close shape. */
function drawFace(view: View, corners: readonly { east: number; north: number }[]) {
  for (const corner of corners) act(() => view.result.current.moves.tap(corner));
  act(() => view.result.current.moves.close());
}

/** The roof's sheet opened in 3D, and Any shape picked on it. */
function anyPicked(view: View) {
  act(() => view.result.current.moves.openRoof(0));
  act(() => view.result.current.moves.pickShape('any'));
}

describe('faces drawn by hand', () => {
  it('Any shape picked: the sheet closes, the top view opens, Face 1 is drawn', async () => {
    const view = await opened([ROOF]);
    anyPicked(view);
    await waitFor(() => expect(saved()?.roofs[0]?.shape).toMatchObject({ is: 'any' }));
    expect(view.result.current.roofSheet).toBeNull();
    expect(view.result.current.view).toBe('top');
    expect(view.result.current.roofStep).toMatchObject({ kind: 'drawing', faces: 0 });
    expect(view.result.current.bar).toMatchObject({ kind: 'drawing', face: 1, hint: false });
  });

  it('each face closed is one save, and the next starts; covered, drawing ends', async () => {
    const view = await opened([ROOF]);
    anyPicked(view);
    drawFace(view, SOUTH_HALF);
    await waitFor(() => expect(savedFaces()).toHaveLength(1));
    expect(savedFaces()?.[0]).toMatchObject({ lowSide: 0, slope: { setBy: 'system' } });
    expect(view.result.current.bar).toMatchObject({ kind: 'drawing', face: 2 });
    drawFace(view, NORTH_HALF);
    await waitFor(() => expect(savedFaces()).toHaveLength(2));
    expect(view.result.current.roofStep).toMatchObject({
      kind: 'idle',
      said: { kind: 'faces_drawn', count: 2 },
    });
  });

  it('Undo between faces takes the last face back, and drawing goes on', async () => {
    const view = await opened([ROOF]);
    anyPicked(view);
    drawFace(view, SOUTH_HALF);
    await waitFor(() => expect(savedFaces()).toHaveLength(1));
    expect(view.result.current.canUndo).toBe(true);
    act(() => view.result.current.moves.undo());
    await waitFor(() => expect(savedFaces() ?? []).toHaveLength(0));
    expect(view.result.current.roofStep).toMatchObject({ kind: 'drawing', faces: 0 });
    // Redo brings the face back, and drawing still goes on.
    expect(view.result.current.canRedo).toBe(true);
    act(() => view.result.current.moves.redo());
    await waitFor(() => expect(savedFaces()).toHaveLength(1));
    expect(view.result.current.roofStep).toMatchObject({ kind: 'drawing', faces: 0 });
  });

  it('Undo just after the last face takes it back, and drawing goes on', async () => {
    const view = await opened([ROOF]);
    anyPicked(view);
    drawFace(view, SOUTH_HALF);
    drawFace(view, NORTH_HALF);
    await waitFor(() => expect(savedFaces()).toHaveLength(2));
    expect(view.result.current.roofStep.kind).toBe('idle');
    act(() => view.result.current.moves.undo());
    await waitFor(() => expect(savedFaces()).toHaveLength(1));
    expect(view.result.current.roofStep).toMatchObject({ kind: 'drawing', faces: 0 });
    expect(view.result.current.bar).toMatchObject({ kind: 'drawing', face: 2 });
  });

  it('Undo past the shape picked ends the drawing: the roof is not of any shape', async () => {
    const view = await opened([ROOF]);
    anyPicked(view);
    await waitFor(() => expect(saved()?.roofs[0]?.shape).toMatchObject({ is: 'any' }));
    act(() => view.result.current.moves.undo());
    await waitFor(() => expect(view.result.current.roofStep.kind).toBe('idle'));
    expect(view.result.current.document?.roofs[0]?.shape).toBeUndefined();
  });

  it('the Faces row on a roof standing in its faces draws them again: they go, one save', async () => {
    const face = (corners: typeof SOUTH_HALF) => ({
      corners,
      slope: { degrees: 20, setBy: 'system' as const },
      lowSide: 0,
    });
    const view = await opened([
      {
        ...ROOF,
        shape: { is: 'any', setBy: 'person', faces: [face(SOUTH_HALF), face(NORTH_HALF)] },
      },
    ]);
    act(() => view.result.current.moves.openRoof(0));
    expect(view.result.current.sheetRows?.faces).toEqual({ drawn: 'whole', count: 2 });
    act(() => view.result.current.moves.drawFaces(0));
    await waitFor(() => expect(saved()?.roofs[0]?.shape).toEqual({ is: 'any', setBy: 'person' }));
    expect(view.result.current.roofStep).toMatchObject({ kind: 'drawing', faces: 0 });
    expect(view.result.current.view).toBe('top');
  });

  it('someone who can only view sees the faces, and the Faces row draws nothing', async () => {
    const face = (corners: typeof SOUTH_HALF) => ({
      corners,
      slope: { degrees: 20, setBy: 'system' as const },
      lowSide: 0,
    });
    const view = await opened(
      [{ ...ROOF, shape: { is: 'any', setBy: 'person', faces: [face(SOUTH_HALF)] } }],
      false,
    );
    const saves = stored.saves.length;
    act(() => view.result.current.moves.openRoof(0));
    expect(view.result.current.sheetRows?.faces).toEqual({ drawn: 'part', count: 1 });
    act(() => view.result.current.moves.drawFaces(0));
    act(() => view.result.current.moves.pickShape('any'));
    expect(view.result.current.roofStep.kind).toBe('idle');
    expect(stored.saves).toHaveLength(saves);
  });
});
