// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, designId, mountedOver, origin } from './studio-origin';

/**
 * A roof's sheet beyond its height, and a side's sheet, through the real client (`T-M05-002`, part
 * e): a number slid shows on the model and is one save when let go; a reset takes the person's
 * value away; a side's own values; a shape picked; Undo puts back what is in hand first; × drops
 * it and Done keeps it.
 */
const TERRACE: StudioDocumentWire['roofs'][number] = {
  id: '01a50000-0000-7000-8000-000000000911',
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

async function opened(roofs: StudioDocumentWire['roofs'] = [TERRACE]) {
  origin.designs = [aDesign(1)];
  stored.document = { ...stored.document, roofs };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(roofs.length));
  await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  act(() => view.result.current.moves.see('3d'));
  act(() => view.result.current.moves.openRoof(0));
  return view;
}

const saved = () => stored.saves.at(-1)?.roofs[0];

describe('a roof’s numbers on its sheet', () => {
  it('a setback slid shows at once and is kept as one save; its reset takes it away', async () => {
    const view = await opened();
    expect(view.result.current.sheetRows?.setback?.byPerson).toBe(false);
    act(() => view.result.current.moves.slideNumber('setback', 1.2));
    expect(view.result.current.sheetRows?.setback?.value).toBe(1.2);
    expect(stored.saves).toHaveLength(0);
    act(() => view.result.current.moves.keepNumber());
    await waitFor(() => expect(saved()?.setback).toMatchObject({ metres: 1.2, setBy: 'person' }));
    expect(view.result.current.sheetRows?.setback?.byPerson).toBe(true);
    act(() => view.result.current.moves.resetNumber('setback'));
    await waitFor(() => expect(stored.saves).toHaveLength(2));
    expect(saved()?.setback).toBeUndefined();
  });

  it('Undo with a number in hand puts it back first, and nothing is sent', async () => {
    const view = await opened();
    act(() => view.result.current.moves.slideNumber('setback', 2));
    act(() => view.result.current.moves.undo());
    expect(view.result.current.numberInHand).toBeNull();
    expect(view.result.current.sheetRows?.setback?.byPerson).toBe(false);
    expect(stored.saves).toHaveLength(0);
  });

  it('× drops a number in hand; Done keeps it', async () => {
    const view = await opened();
    act(() => view.result.current.moves.slideNumber('setback', 2));
    act(() => view.result.current.moves.closeRoof());
    expect(view.result.current.roofSheet).toBeNull();
    expect(stored.saves).toHaveLength(0);
    act(() => view.result.current.moves.openRoof(0));
    act(() => view.result.current.moves.slideNumber('setback', 2));
    act(() => void view.result.current.moves.done());
    await waitFor(() => expect(saved()?.setback).toMatchObject({ metres: 2 }));
  });

  it('a shape picked is the person’s, and the sheet gains its slope', async () => {
    const view = await opened();
    expect(view.result.current.sheetRows?.slope).toBeNull();
    act(() => view.result.current.moves.pickShape('gable'));
    await waitFor(() => expect(saved()?.shape).toMatchObject({ is: 'gable', setBy: 'person' }));
    expect(view.result.current.sheetRows?.slope).not.toBeNull();
  });

  it('Parapet all round, turned off, is one save', async () => {
    const view = await opened();
    act(() => view.result.current.moves.setParapetAllRound(false));
    await waitFor(() => expect(saved()?.parapet).toMatchObject({ allRound: false }));
    expect(view.result.current.sheetRows?.parapet?.allRound).toBe(false);
  });
});

describe('a side’s sheet', () => {
  it('opens in the roof’s place; its parapet off and its own setback are the side’s', async () => {
    const view = await opened();
    act(() => view.result.current.moves.openSide(0));
    expect(view.result.current.sheetPart).toEqual({ kind: 'side', side: 0 });
    expect(view.result.current.sideRows).toMatchObject({ side: 0, parapet: { on: true } });
    act(() => view.result.current.moves.setSideWall(false));
    await waitFor(() => expect(saved()?.sides?.[0]).toMatchObject({ parapet: false }));
    act(() => view.result.current.moves.setNumber('setback', 0));
    await waitFor(() => expect(saved()?.sides?.[0]).toMatchObject({ setbackM: 0 }));
    // The roof's own setback is not touched.
    expect(saved()?.setback).toBeUndefined();
  });

  it('a roof is saved with its corners kept to the centimetre', async () => {
    const corners = TERRACE.corners.map((c) => ({ east: c.east + 0.123_456, north: c.north }));
    const view = await opened([{ ...TERRACE, corners }]);
    act(() => view.result.current.moves.setNumber('setback', 0));
    await waitFor(() => expect(saved()?.setback).toBeDefined());
    expect(saved()?.corners[1]).toEqual({ east: 8.12, north: 0 });
  });

  it('a sloped roof’s side keeps its own overhang; the roof’s is not touched', async () => {
    const view = await opened([{ ...TERRACE, shape: { is: 'gable', setBy: 'person' } }]);
    act(() => view.result.current.moves.openSide(0));
    expect(view.result.current.sideRows?.overhang?.byPerson).toBe(false);
    act(() => view.result.current.moves.setNumber('overhang', 0.9));
    await waitFor(() => expect(saved()?.sides?.[0]).toMatchObject({ overhangM: 0.9 }));
    expect(saved()?.overhang).toBeUndefined();
  });

  it('the phone’s back goes from a side’s sheet to the roof’s, then closes it', async () => {
    const view = await opened();
    act(() => view.result.current.moves.openSide(1));
    act(() => void view.result.current.moves.back());
    expect(view.result.current.sheetPart).toEqual({ kind: 'roof' });
    expect(view.result.current.roofSheet).not.toBeNull();
    act(() => void view.result.current.moves.back());
    expect(view.result.current.roofSheet).toBeNull();
  });

  it('the parapet’s details, on the roof’s own sheet: a railing, and lengths measured inside', async () => {
    const view = await opened();
    act(() => view.result.current.moves.setParapetBuilt('railing'));
    expect(view.result.current.sheetPart).toEqual({ kind: 'roof' });
    await waitFor(() => expect(saved()?.parapet).toMatchObject({ build: 'railing' }));
    act(() => view.result.current.moves.setLengthsMeasured('inside'));
    await waitFor(() => expect(saved()?.parapet).toMatchObject({ lengthsMeasured: 'inside' }));
  });
});

describe('a tap on the model in 3D', () => {
  /** Straight down onto a point of the plan. */
  const down = (east: number, north: number) => () => ({ east, north });
  /** The same, a finger's half-width east: a side within 0.3 m of the tap is the one tapped. */
  const finger = (east: number, north: number) => down(east + 0.3, north);

  it('on a roof opens its sheet; on its edge, that side’s sheet; off every roof, it closes', async () => {
    const view = await opened();
    act(() => view.result.current.moves.closeRoof());
    act(() => view.result.current.moves.tapRoof(down(4, 3), finger(4, 3)));
    expect(view.result.current.roofSheet?.roof).toBe(0);
    expect(view.result.current.sheetPart).toEqual({ kind: 'roof' });
    act(() => view.result.current.moves.tapRoof(down(4, 0.1), finger(4, 0.1)));
    expect(view.result.current.sheetPart).toEqual({ kind: 'side', side: 0 });
    act(() => view.result.current.moves.tapRoof(down(40, 40), finger(40, 40)));
    expect(view.result.current.roofSheet).toBeNull();
  });

  it('a second tap on the open roof’s top picks the roof under it', async () => {
    const stair: StudioDocumentWire['roofs'][number] = {
      ...TERRACE,
      id: '01a50000-0000-7000-8000-000000000912',
      corners: [
        { east: 2, north: 2 },
        { east: 5, north: 2 },
        { east: 5, north: 5 },
        { east: 2, north: 5 },
      ],
      kind: { is: 'stair_room', setBy: 'system' },
      on: TERRACE.id,
    };
    const view = await opened([TERRACE, stair]);
    act(() => view.result.current.moves.closeRoof());
    act(() => view.result.current.moves.tapRoof(down(3.5, 3.5), finger(3.5, 3.5)));
    expect(view.result.current.roofSheet?.roof).toBe(1);
    act(() => view.result.current.moves.tapRoof(down(3.5, 3.5), finger(3.5, 3.5)));
    expect(view.result.current.roofSheet?.roof).toBe(0);
  });

  it('a wall arrow held lets the sheet step aside; let go, its height is the side’s', async () => {
    const view = await opened();
    act(() => view.result.current.moves.openSide(0));
    act(() => view.result.current.moves.grabWall(1));
    expect(view.result.current.arrowHeld).toBe(true);
    act(() => view.result.current.moves.dragWall(0.5));
    act(() => view.result.current.moves.keepNumber());
    expect(view.result.current.arrowHeld).toBe(false);
    await waitFor(() => expect(saved()?.sides?.[0]).toMatchObject({ parapetM: 1.5 }));
  });
});
