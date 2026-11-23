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
 * The pencil, Roofs and the material picker, through the real client (`T-M05-002`, part e): the
 * pencil does what the moment needs; Roofs holds every roof; a pick or Confirm is one save.
 */
type Wire = StudioDocumentWire['roofs'][number];
const box = (west: number, south: number, wide: number, deep: number) => [
  { east: west, north: south },
  { east: west + wide, north: south },
  { east: west + wide, north: south + deep },
  { east: west, north: south + deep },
];
const roofOf = (n: number, corners: ReturnType<typeof box>, more: Partial<Wire> = {}): Wire => ({
  id: `01a50000-0000-7000-8000-00000000092${n}`,
  corners,
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
  ...more,
});
const guess = (type: string) => ({ type, setBy: 'system', confirmed: false }) as const;
const TERRACE = roofOf(1, box(0, 0, 10, 8));
const STAIR = roofOf(2, box(0, 0, 3, 3), {
  kind: { is: 'stair_room', setBy: 'person' },
  on: TERRACE.id,
  material: guess('rcc'),
});
const SHED = roofOf(3, box(10, 0, 4, 8), { material: guess('trapezoidal_sheet') });
const HOUSE = [TERRACE, STAIR, SHED];

async function opened(roofs: StudioDocumentWire['roofs'], editor = true) {
  origin.roles = [editor ? DESIGNS_ROLE : READS_ONLY_ROLE];
  origin.designs = [aDesign(1)];
  stored.document = { ...stored.document, roofs };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(roofs.length));
  if (editor) await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  return view;
}
const saved = () => stored.saves.at(-1)?.roofs ?? [];

describe('the pencil does what the moment needs', () => {
  it('with no roof it draws at once', async () => {
    const view = await opened([]);
    expect(view.result.current.pencil).toBe('draw');
    act(() => view.result.current.moves.tapPencil());
    expect(view.result.current.roofStep.kind).toBe('drawing');
    expect(view.result.current.pencil).toBe('stop');
    act(() => view.result.current.moves.tapPencil());
    expect(view.result.current.roofStep.kind).toBe('idle');
  });

  it('with roofs it opens Roofs and Draw; Draw is the second tap; a second tap on the pencil closes them', async () => {
    const view = await opened(HOUSE);
    expect(view.result.current.pencil).toBe('fan');
    act(() => view.result.current.moves.tapPencil());
    expect(view.result.current.panel).toEqual({ open: 'fan' });
    act(() => view.result.current.moves.tapPencil());
    expect(view.result.current.panel).toEqual({ open: 'none' });
    act(() => view.result.current.moves.tapPencil());
    act(() => view.result.current.moves.drawAnother());
    expect(view.result.current.panel).toEqual({ open: 'none' });
    expect(view.result.current.roofStep.kind).toBe('drawing');
  });

  it('in 3D, and for a person who may only view, it opens Roofs at once', async () => {
    const view = await opened(HOUSE);
    act(() => view.result.current.moves.see('3d'));
    expect(view.result.current.pencil).toBe('roofs');
    act(() => view.result.current.moves.tapPencil());
    expect(view.result.current.panel).toEqual({ open: 'roofs', lit: null });
    const reader = await opened(HOUSE, false);
    expect(reader.result.current.pencil).toBe('roofs');
    origin.roles = [DESIGNS_ROLE];
  });
});

describe('Roofs', () => {
  it('holds a row for each roof, what stands on a roof under it, and what waits', async () => {
    const view = await opened(HOUSE);
    const { roofList } = view.result.current;
    expect(roofList.rows.map((row) => [row.roof, row.child])).toEqual([
      [0, false],
      [1, true],
      [2, false],
    ]);
    expect(roofList).toMatchObject({ count: 3, waiting: 3 });
    expect(roofList.areaM2).toBeCloseTo(112, 6);
  });

  it('a row picks its roof and opens its sheet in the list’s place; Back opens Roofs on that row', async () => {
    const view = await opened(HOUSE);
    act(() => view.result.current.moves.openRoofs());
    act(() => view.result.current.moves.pickRow(2));
    expect(view.result.current.panel).toEqual({ open: 'none' });
    expect(view.result.current.roofSheet?.roof).toBe(2);
    expect(view.result.current.sheetFromRoofs).toBe(true);
    act(() => view.result.current.moves.backToRoofs());
    expect(view.result.current.roofSheet).toBeNull();
    expect(view.result.current.sheetFromRoofs).toBe(false);
    expect(view.result.current.panel).toEqual({ open: 'roofs', lit: 2 });
  });

  it('opens on the row of the roof picked on the model; Back opens it on the sheet’s row; closed, no row is lit', async () => {
    const view = await opened(HOUSE);
    expect(view.result.current.litRow).toBeNull();
    act(() => view.result.current.moves.openRoofs());
    expect(view.result.current.litRow).toBeNull();
    act(() => view.result.current.moves.closePanel());
    // A tap on the shed in the top view picks it: Roofs then opens on its row.
    act(() => view.result.current.moves.tap({ east: 12, north: 4 }));
    act(() => view.result.current.moves.openRoofs());
    expect(view.result.current.litRow).toBe(2);
    act(() => view.result.current.moves.pickRow(1));
    expect(view.result.current.litRow).toBeNull();
    act(() => view.result.current.moves.backToRoofs());
    expect(view.result.current.litRow).toBe(1);
  });

  it('Copy and Delete on a row close Roofs, are one save each, and the line names what went', async () => {
    const view = await opened(HOUSE);
    act(() => view.result.current.moves.openRoofs());
    act(() => view.result.current.moves.copyRow(2));
    expect(view.result.current.panel).toEqual({ open: 'none' });
    await waitFor(() => expect(saved()).toHaveLength(4));
    act(() => view.result.current.moves.openRoofs());
    act(() => view.result.current.moves.deleteRow(1));
    expect(view.result.current.panel).toEqual({ open: 'none' });
    await waitFor(() => expect(saved().map((roof) => roof.id)).not.toContain(STAIR.id));
    expect(stored.saves).toHaveLength(2);
    const step = view.result.current.roofStep;
    expect(step.kind === 'idle' && step.said).toEqual({
      kind: 'roof_deleted',
      was: { kind: 'stair_room', with: 1 },
    });
  });
});

describe('what a roof is made of', () => {
  it('Confirm on the terrace confirms it and the stair room on it in one save, and Roofs comes back with the shed lit', async () => {
    const view = await opened(HOUSE);
    act(() => view.result.current.moves.openRoofs());
    act(() => view.result.current.moves.openMaterial(0, 'roofs'));
    expect(view.result.current.materialPicker).toMatchObject({
      roof: 0,
      now: 'rcc',
      mode: 'first',
    });
    act(() => view.result.current.moves.confirmMaterial());
    await waitFor(() =>
      expect(saved().map((roof) => roof.material?.confirmed)).toEqual([true, true, false]),
    );
    expect(stored.saves).toHaveLength(1);
    expect(view.result.current.panel).toEqual({ open: 'roofs', lit: 2 });
    expect(view.result.current.roofList.waiting).toBe(1);
  });

  it('a tap on a picture is the person’s pick; the last roof that waited leaves none lit', async () => {
    const done = { type: 'rcc', setBy: 'person', confirmed: true } as const;
    const view = await opened([{ ...TERRACE, material: done }, SHED]);
    act(() => view.result.current.moves.openMaterial(1, 'roofs'));
    act(() => view.result.current.moves.pickMaterial({ type: 'ac_sheet' }));
    await waitFor(() =>
      expect(saved()[1]?.material).toEqual({ type: 'ac_sheet', setBy: 'person', confirmed: true }),
    );
    expect(view.result.current.panel).toEqual({ open: 'roofs', lit: null });
    expect(view.result.current.roofList.waiting).toBe(0);
  });

  it('a type of one’s own is typed, and used once it has a name; from a sheet the picker only closes', async () => {
    const view = await opened([TERRACE]);
    act(() => view.result.current.moves.openMaterial(0, 'sheet'));
    act(() => view.result.current.moves.pickerMode('other'));
    expect(view.result.current.materialPicker?.other.pick).toBeNull();
    act(() => view.result.current.moves.typeOther({ name: 'Kota stone' }));
    act(() => view.result.current.moves.typeOther({ fixedLike: 'tile' }));
    const pick = view.result.current.materialPicker?.other.pick;
    expect(pick).toEqual({ type: 'other', name: 'Kota stone', fixedLike: 'tile' });
    act(() => view.result.current.moves.pickMaterial(pick ?? { type: 'rcc' }));
    await waitFor(() => expect(saved()[0]?.material?.name).toBe('Kota stone'));
    expect(view.result.current.panel).toEqual({ open: 'none' });
  });

  it('the phone’s back closes the picker to Roofs, then Roofs', async () => {
    const view = await opened(HOUSE);
    act(() => view.result.current.moves.openRoofs());
    act(() => view.result.current.moves.openMaterial(2, 'roofs'));
    let handled = false;
    act(() => {
      handled = view.result.current.moves.back();
    });
    expect(handled).toBe(true);
    expect(view.result.current.panel).toEqual({ open: 'roofs', lit: 2 });
    act(() => void view.result.current.moves.back());
    expect(view.result.current.panel).toEqual({ open: 'none' });
    expect(stored.saves).toHaveLength(0);
  });
});
