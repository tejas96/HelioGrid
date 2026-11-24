import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofListOf } from '../../src/studio/roof-list-build';
import { roofsWorked } from '../../src/studio/roof-worked';
import {
  materialPickerOf,
  nextWaiting,
  pencilDoes,
  ROOFS_PANEL_START,
  type RoofsPanel,
  type RoofsPanelEvent,
  roofsPanelAfter,
} from '../../src/studio/roofs-panel';
import { box, designOf, FACTS, kindOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * The pencil and what it opens (`T-M05-002`, part e): it does what the moment needs, and of its
 * two buttons, Roofs and the material picker one is open at a time.
 */
const opened = (...events: RoofsPanelEvent[]) =>
  events.reduce<RoofsPanel>(roofsPanelAfter, ROOFS_PANEL_START);

describe('a tap on the pencil', () => {
  it.each([
    ['no roof yet, in the top view: it draws', { roofs: 0, top: true }, 'draw'],
    [
      'no roof yet, in 3D: it still draws — the camera flies to the top view',
      { roofs: 0, top: false },
      'draw',
    ],
    ['roofs stand, in the top view: Roofs and Draw', { roofs: 3, top: true }, 'fan'],
    ['roofs stand, in 3D: Roofs at once', { roofs: 3, top: false }, 'roofs'],
    ['a roof is being drawn: it stops', { roofs: 3, top: true, drawing: true }, 'stop'],
    [
      'a person who may only view: Roofs at once',
      { roofs: 3, top: true, editable: false },
      'roofs',
    ],
    [
      'a person who may only view, with no roof: Roofs, never Draw',
      { roofs: 0, top: true, editable: false },
      'roofs',
    ],
  ] as const)('%s', (_why, facts, does) => {
    expect(pencilDoes({ drawing: false, editable: true, ...facts })).toBe(does);
  });
});

describe('what is open', () => {
  it('the pencil opens its two buttons, and a second tap closes them', () => {
    expect(opened({ kind: 'pencil', does: 'fan' })).toEqual({ open: 'fan' });
    expect(opened({ kind: 'pencil', does: 'fan' }, { kind: 'pencil', does: 'fan' })).toEqual({
      open: 'none',
    });
  });

  it('Roofs takes the buttons’ place; × or Esc closes it', () => {
    const roofs = opened({ kind: 'pencil', does: 'fan' }, { kind: 'roofs' });
    expect(roofs).toEqual({ open: 'roofs', lit: null });
    expect(roofsPanelAfter(roofs, { kind: 'close' })).toEqual({ open: 'none' });
  });

  it('the picker opened from Roofs goes back to Roofs on ×, with its roof’s row lit', () => {
    const picker = opened({ kind: 'roofs' }, { kind: 'material', roof: 1, from: 'roofs' });
    expect(picker).toMatchObject({ open: 'picker', roof: 1, mode: 'first' });
    expect(roofsPanelAfter(picker, { kind: 'close' })).toEqual({ open: 'roofs', lit: 1 });
  });

  it('after a pick it goes back to Roofs with the next roof that waits lit; from a sheet it only closes', () => {
    const fromRoofs = opened(
      { kind: 'material', roof: 0, from: 'roofs' },
      { kind: 'picked', next: 2 },
    );
    expect(fromRoofs).toEqual({ open: 'roofs', lit: 2 });
    const fromSheet = opened(
      { kind: 'material', roof: 0, from: 'sheet' },
      { kind: 'picked', next: 2 },
    );
    expect(fromSheet).toEqual({ open: 'none' });
    expect(opened({ kind: 'material', roof: 0, from: 'sheet' }, { kind: 'close' })).toEqual({
      open: 'none',
    });
  });

  it('an act that must show on the model closes everything', () => {
    expect(
      opened(
        { kind: 'roofs' },
        { kind: 'material', roof: 0, from: 'roofs' },
        { kind: 'close_all' },
      ),
    ).toEqual({ open: 'none' });
  });

  it('All types, a type of one’s own and what is typed are the picker’s alone', () => {
    const typed = opened(
      { kind: 'material', roof: 0, from: 'roofs' },
      { kind: 'mode', mode: 'other' },
      { kind: 'other', draft: { name: 'Kota stone' } },
      { kind: 'other', draft: { fixedLike: 'tile' } },
    );
    expect(typed).toMatchObject({
      mode: 'other',
      other: { name: 'Kota stone', fixedLike: 'tile' },
    });
    expect(opened({ kind: 'mode', mode: 'all' })).toEqual({ open: 'none' });
    expect(opened({ kind: 'other', draft: { name: 'x' } })).toEqual({ open: 'none' });
    expect(opened({ kind: 'picked', next: 1 })).toEqual({ open: 'none' });
  });
});

describe('the next roof that waits', () => {
  const guess = { type: 'rcc', setBy: 'system', confirmed: false } as const;
  const done = { type: 'rcc', setBy: 'person', confirmed: true } as const;
  const listOf = (...roofs: Roof[]) => {
    const design = designOf(...roofs);
    return roofListOf(design, FACTS, roofsWorked(design, FACTS));
  };

  it('is the next in the list’s order whose material is not confirmed, round to the start', () => {
    // Rows: terrace (0), the stair room on it (2), the shed (1).
    const list = listOf({ ...TERRACE, material: done }, SHED, {
      ...stairOn(box(0, 0, 3, 3)),
      material: guess,
    });
    expect(nextWaiting(list, 0)).toBe(2);
    expect(nextWaiting(list, 2)).toBe(1);
    expect(nextWaiting(list, 1)).toBe(2);
  });

  it('is none when every material is confirmed, and a hole never waits for one', () => {
    const duct = kindOf('duct', 'hole', box(4, 3, 1, 1), { partOf: 'terrace' });
    expect(nextWaiting(listOf({ ...TERRACE, material: done }, duct), 0)).toBeNull();
  });
});

describe('the picker as it is drawn', () => {
  const design = designOf(TERRACE, SHED);
  const picker = (panel: RoofsPanel) => materialPickerOf(design, panel, FACTS);
  const open = opened({ kind: 'material', roof: 1, from: 'roofs' });

  it('shows the market’s first five, the one the roof is made of lit, and its name', () => {
    const view = picker(open);
    expect(view?.name).toEqual({ kind: 'roof', number: 2 });
    expect(view?.now).toBe('trapezoidal_sheet');
    expect(view?.confirmed).toBe(false);
    expect(view?.first).toHaveLength(5);
    expect(view?.first.map((tile) => tile.type)).toEqual(FACTS.materialOrder.slice(0, 5));
    expect(view?.first.filter((tile) => tile.on).map((tile) => tile.type)).toEqual([
      'trapezoidal_sheet',
    ]);
  });

  it('All types holds every type once in its group, with the fragile ones marked; Other is apart', () => {
    const view = picker(roofsPanelAfter(open, { kind: 'mode', mode: 'all' }));
    const types = view?.groups.flatMap((group) => group.tiles.map((tile) => tile.type)) ?? [];
    expect(types).toHaveLength(23);
    expect(new Set(types).size).toBe(23);
    expect(types).not.toContain('other');
    expect(view?.groups.map((group) => group.group)).toEqual([
      'concrete',
      'metal',
      'tiles',
      'cement_sheets',
      'covers',
      'raised_frame_only',
      'not_for_panels',
    ]);
    const fragile = view?.groups.flatMap((group) => group.tiles).filter((tile) => tile.fragile);
    expect(fragile?.map((tile) => tile.type)).toContain('ac_sheet');
    expect(fragile?.map((tile) => tile.type)).not.toContain('rcc');
  });

  it('a type of one’s own can be used once it has a name', () => {
    const other = roofsPanelAfter(open, { kind: 'mode', mode: 'other' });
    expect(picker(other)?.other.pick).toBeNull();
    const named = roofsPanelAfter(other, { kind: 'other', draft: { name: '  Kota stone ' } });
    expect(picker(named)?.other.pick).toEqual({
      type: 'other',
      name: 'Kota stone',
      fixedLike: 'concrete',
    });
    expect(picker(named)?.other.nameMax).toBe(60);
  });

  it('is not drawn while closed, nor for a roof that is gone', () => {
    expect(picker(ROOFS_PANEL_START)).toBeNull();
    expect(picker(opened({ kind: 'material', roof: 9, from: 'roofs' }))).toBeNull();
  });
});
