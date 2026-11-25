import { describe, expect, it } from 'vitest';
import {
  materialPickerOf,
  ROOFS_PANEL_START,
  type RoofsPanel,
  type RoofsPanelEvent,
  roofsPanelAfter,
} from '../../src/studio/roofs-panel';
import { designOf, FACTS, SHED, TERRACE } from './roof-meet-support';

/** Roofs and the material picker (`T-M05-002`, part e): one of them is open at a time. */
const opened = (...events: RoofsPanelEvent[]) =>
  events.reduce<RoofsPanel>(roofsPanelAfter, ROOFS_PANEL_START);

describe('what is open', () => {
  it('the Roofs button opens Roofs, and a second tap closes it', () => {
    expect(opened({ kind: 'roofs' })).toEqual({ open: 'roofs', lit: null });
    expect(opened({ kind: 'roofs' }, { kind: 'roofs' })).toEqual({ open: 'none' });
  });

  it('the Roofs button closes the picker too', () => {
    expect(opened({ kind: 'material', roof: 1 }, { kind: 'roofs' })).toEqual({ open: 'none' });
  });

  it('× or Esc closes Roofs', () => {
    expect(opened({ kind: 'roofs' }, { kind: 'close' })).toEqual({ open: 'none' });
  });

  it('the picker opens from a roof’s sheet; ×, a pick or Confirm closes it, back to the sheet', () => {
    const picker = opened({ kind: 'material', roof: 1 });
    expect(picker).toMatchObject({ open: 'picker', roof: 1, mode: 'first' });
    expect(roofsPanelAfter(picker, { kind: 'close' })).toEqual({ open: 'none' });
    expect(roofsPanelAfter(picker, { kind: 'picked' })).toEqual({ open: 'none' });
  });

  it('an act that must show on the model closes everything', () => {
    expect(opened({ kind: 'roofs' }, { kind: 'material', roof: 0 }, { kind: 'close_all' })).toEqual(
      { open: 'none' },
    );
  });

  it('All types, a type of one’s own and what is typed are the picker’s alone', () => {
    const typed = opened(
      { kind: 'material', roof: 0 },
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
    expect(opened({ kind: 'roofs' }, { kind: 'picked' })).toEqual({ open: 'roofs', lit: null });
  });
});

describe('the picker as it is drawn', () => {
  const design = designOf(TERRACE, SHED);
  const picker = (panel: RoofsPanel) => materialPickerOf(design, panel, FACTS);
  const open = opened({ kind: 'material', roof: 1 });

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
    expect(picker(opened({ kind: 'material', roof: 9 }))).toBeNull();
  });
});
