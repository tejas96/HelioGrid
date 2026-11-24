import type { StudioDocument } from '../../src/studio/document';
import { roofListOf } from '../../src/studio/roof-list-build';
import { roofSheetRowsOf } from '../../src/studio/roof-sheet-build';
import { roofsWorked } from '../../src/studio/roof-worked';
import { sideSheetRowsOf } from '../../src/studio/side-sheet-build';
import { box, FACTS, roofOf } from './roof-meet-support';

/** A roof's sheet and a side's sheet, worked out as the studio does, for the sheet tests. */
export const SLIDE = { min: 2, max: 20 };
export const NORTH_OF_EQUATOR = 18.5;

export const sheetOf = (design: StudioDocument, roof: number) => {
  const worked = roofsWorked(design, FACTS, NORTH_OF_EQUATOR);
  const row = roofListOf(design, FACTS, worked).rows.find((each) => each.roof === roof);
  if (row === undefined) throw new Error('no row');
  const sheet = roofSheetRowsOf(design, roof, FACTS, worked, row, NORTH_OF_EQUATOR, SLIDE);
  if (sheet === null) throw new Error('no sheet');
  return sheet;
};
export const sideOf = (design: StudioDocument, roof: number, side: number) => {
  const worked = roofsWorked(design, FACTS, NORTH_OF_EQUATOR);
  const sheet = sideSheetRowsOf(design, roof, side, FACTS, worked, NORTH_OF_EQUATOR);
  if (sheet === null) throw new Error('no side');
  return sheet;
};
/** A metal roof set to a shed: its slope runs one way. */
export const LEAN = roofOf('lean', box(10, 0, 4, 8), {
  material: { type: 'trapezoidal_sheet', setBy: 'person', confirmed: true },
  shape: { is: 'shed', setBy: 'person' },
});
export const shaped = (shape: string, more = {}) =>
  roofOf('house', box(0, 0, 12, 8), {
    material: { type: 'rcc', setBy: 'person', confirmed: true },
    shape: { is: shape, setBy: 'person' },
    ...more,
  });
