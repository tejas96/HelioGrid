// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, designId, mountedOver, origin } from './studio-origin';

/**
 * How the 3D model moves into a change, through the real client (`T-M05-002`, part e, S18): a
 * change of state brings one numbered motion for the screen to play; a number on a slider none.
 */
type WireRoof = StudioDocumentWire['roofs'][number];
const square = (west: number, south: number, wide: number, deep: number) => [
  { east: west, north: south },
  { east: west + wide, north: south },
  { east: west + wide, north: south + deep },
  { east: west, north: south + deep },
];
const TERRACE: WireRoof = {
  id: '01a50000-0000-7000-8000-000000000931',
  corners: square(0, 0, 8, 6),
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
};
const STAIR: WireRoof = {
  ...TERRACE,
  id: '01a50000-0000-7000-8000-000000000932',
  corners: square(0, 0, 3, 3),
  kind: { is: 'stair_room', setBy: 'system' },
  on: TERRACE.id,
};

describe('the model’s motion', () => {
  it('a stair room deleted shrinks away; Undo brings it back rising from its roof, a new motion', async () => {
    origin.designs = [aDesign(1)];
    stored.document = { ...stored.document, roofs: [TERRACE, STAIR] };
    const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
    await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(2));
    await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
    expect(view.result.current.motion).toBeNull();
    act(() => view.result.current.moves.deleteRoofAt(1));
    const deleted = view.result.current.motion;
    expect(deleted?.moves.map((move) => move.kind)).toEqual(['shrink']);
    act(() => view.result.current.moves.undo());
    const back = view.result.current.motion;
    expect(back?.moves.map((move) => move.kind)).toEqual(['rise']);
    expect(back?.id).toBeGreaterThan(deleted?.id ?? 0);
  });
});
