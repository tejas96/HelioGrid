/**
 * The drawing sheet's own words (`packages/ui`'s `DrawingSheetWords`): its counted numbering and
 * name, the empty slot's reservation, the north mark, the legend, the title block's fields and
 * the zoom controls (`MS8-02`) — authored once for the print surface, in three languages (`F3-07`).
 */
import type { Translator } from '../runtime';
import { MAP_SURFACE } from './map-surface';
import { PAGED_DOCUMENT } from './paged-document';

const DRAWING_SHEET = {
  rendersHere: /*i18n*/ { id: '{drawing} renders here' },
  north: /*i18n*/ { id: 'North' },
  legend: /*i18n*/ { id: 'Legend' },
  project: /*i18n*/ { id: 'Project' },
  drawing: /*i18n*/ { id: 'Drawing' },
  drawingNumber: /*i18n*/ { id: 'Drawing no.' },
  scale: /*i18n*/ { id: 'Scale' },
  paper: /*i18n*/ { id: 'Paper' },
  drawnBy: /*i18n*/ { id: 'Drawn by' },
  checked: /*i18n*/ { id: 'Checked' },
} as const;

/** Every word `DrawingSheet` draws or speaks of its own, in the reader's language. */
export function drawingSheetWords(t: Translator['t']) {
  return {
    sheetName: (drawing: string, sheet: number, sheets: number) =>
      t(PAGED_DOCUMENT.sheetName, { document: drawing, sheet, sheets }),
    sheetOf: (sheet: number, sheets: number) => t(PAGED_DOCUMENT.sheetOf, { sheet, sheets }),
    rendersHere: (drawing: string) => t(DRAWING_SHEET.rendersHere, { drawing }),
    north: t(DRAWING_SHEET.north),
    legend: t(DRAWING_SHEET.legend),
    project: t(DRAWING_SHEET.project),
    drawing: t(DRAWING_SHEET.drawing),
    drawingNumber: t(DRAWING_SHEET.drawingNumber),
    revision: t(PAGED_DOCUMENT.revision),
    scale: t(DRAWING_SHEET.scale),
    paper: t(DRAWING_SHEET.paper),
    issued: t(PAGED_DOCUMENT.issued),
    drawnBy: t(DRAWING_SHEET.drawnBy),
    checked: t(DRAWING_SHEET.checked),
    zoomIn: t(MAP_SURFACE.zoomIn),
    zoomOut: t(MAP_SURFACE.zoomOut),
  };
}
