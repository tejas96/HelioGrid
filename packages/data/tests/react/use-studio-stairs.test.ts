// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, designId, mountedOver, origin } from './studio-origin';

/**
 * The stairs through the real client (`T-M05-002`, part e, E119–E122): the mark dragged onto a
 * roof's edge, Place and a tap, Skip, and the stair room's Stairs row — each one save.
 */
type WireRoof = StudioDocumentWire['roofs'][number];
const square = (west: number, south: number, wide: number, deep: number) => [
  { east: west, north: south },
  { east: west + wide, north: south },
  { east: west + wide, north: south + deep },
  { east: west, north: south + deep },
];
const TERRACE: WireRoof = {
  id: '01a50000-0000-7000-8000-000000000921',
  corners: square(0, 0, 8, 6),
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
};
const STAIR: WireRoof = {
  ...TERRACE,
  id: '01a50000-0000-7000-8000-000000000922',
  corners: square(0, 0, 3, 3),
  kind: { is: 'stair_room', setBy: 'system' },
  on: TERRACE.id,
};

async function opened(roofs: WireRoof[]) {
  origin.designs = [aDesign(1)];
  stored.document = { ...stored.document, roofs, stairsSkipped: undefined };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(roofs.length));
  await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  return view;
}
const saved = () => stored.saves.at(-1);

describe('the stairs', () => {
  it('a stair room’s stairs are guessed; dragged onto the terrace’s edge they are outside stairs, one save', async () => {
    const view = await opened([TERRACE, STAIR]);
    expect(view.result.current.stairs).toMatchObject({ roof: 1, side: 1, byPerson: false });
    act(() => view.result.current.moves.grabStairs());
    act(() =>
      view.result.current.moves.dragStairs({ east: 5, north: 5.9 }, { east: 5.3, north: 5.9 }),
    );
    expect(view.result.current.stairsLanding).toMatchObject({ roof: 0, side: 2, outside: true });
    // While held, the mark and its strip show where it would land.
    expect(view.result.current.stairs).toMatchObject({ roof: 0, side: 2, outside: true });
    act(() => view.result.current.moves.dropStairs());
    await waitFor(() =>
      expect(saved()?.roofs[0]?.sides?.[2]).toMatchObject({ stairsBy: 'person' }),
    );
    expect(view.result.current.stairsHeld).toBe(false);
  });

  it('let go off every side, they stay where they were and nothing is sent', async () => {
    const view = await opened([TERRACE, STAIR]);
    const saves = stored.saves.length;
    act(() => view.result.current.moves.grabStairs());
    act(() => view.result.current.moves.dragStairs({ east: 5, north: 3 }, { east: 5.3, north: 3 }));
    act(() => view.result.current.moves.dropStairs());
    expect(view.result.current.stairs).toMatchObject({ roof: 1, side: 1 });
    expect(stored.saves.length).toBe(saves);
  });

  it('with no stair room the bar asks; Place, then a tap on an edge places them', async () => {
    const view = await opened([TERRACE]);
    expect(view.result.current.stairsAsk).toBe(true);
    act(() => view.result.current.moves.placeStairs());
    expect(view.result.current.stairsPlacing).toBe(true);
    let placed = false;
    act(() => {
      placed = view.result.current.moves.tapStairs(
        { east: 7.9, north: 3 },
        { east: 8.2, north: 3 },
      );
    });
    expect(placed).toBe(true);
    await waitFor(() => expect(saved()?.roofs[0]?.sides?.[1]).toMatchObject({ stairsAt: 3 }));
    expect(view.result.current.stairsPlacing).toBe(false);
  });

  it('back, or Esc, while placing stops placing; the question stays', async () => {
    const view = await opened([TERRACE]);
    act(() => view.result.current.moves.placeStairs());
    let backed = false;
    act(() => {
      backed = view.result.current.moves.back();
    });
    expect(backed).toBe(true);
    expect(view.result.current.stairsPlacing).toBe(false);
    expect(view.result.current.stairsAsk).toBe(true);
  });

  it('Skip is one save: it is not asked again', async () => {
    const view = await opened([TERRACE]);
    act(() => view.result.current.moves.skipStairs());
    await waitFor(() => expect(saved()?.stairsSkipped).toBe(true));
    expect(view.result.current.stairsAsk).toBe(false);
  });

  it('the Stairs row moves them to another side of the stair room, at its middle', async () => {
    const view = await opened([TERRACE, STAIR]);
    act(() => view.result.current.moves.stairsOnSide(1, 2, 1.5));
    await waitFor(() =>
      expect(saved()?.roofs[1]?.sides?.[2]).toMatchObject({ stairsAt: 1.5, stairsBy: 'person' }),
    );
  });
});
