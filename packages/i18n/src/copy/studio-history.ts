import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioChange } from '@heliogrid/domain';
import type { Translator } from '../runtime';

type T = Translator['t'];

/** What the studio's Undo and Redo say: the change they took back or made again (`T-M05-002`). */
const HISTORY = {
  undone: /*i18n*/ { id: 'Undone. Redo puts it back.' },
  redone: /*i18n*/ { id: 'Redone. Undo takes it back.' },
  undoneWhat: /*i18n*/ { id: 'Undone: {what}. Redo puts it back.' },
  redoneWhat: /*i18n*/ { id: 'Redone: {what}. Undo takes it back.' },
  changeRoofAdded: /*i18n*/ { id: 'the new roof' },
  changeRoofDeleted: /*i18n*/ { id: 'the deleted roof' },
  changePicture: /*i18n*/ { id: 'the picture change' },
  changeSize: /*i18n*/ { id: 'the picture size' },
  changeHeight: /*i18n*/ { id: 'the height change' },
  changeShape: /*i18n*/ { id: 'the shape change' },
};

/** What one change did, as Undo and Redo name it; a change nobody sees is not named. */
const CHANGE_WORD: Record<Exclude<StudioChange, 'other'>, (t: T) => TranslatedText> = {
  roof_added: (t) => t(HISTORY.changeRoofAdded),
  roof_deleted: (t) => t(HISTORY.changeRoofDeleted),
  picture: (t) => t(HISTORY.changePicture),
  size: (t) => t(HISTORY.changeSize),
  height: (t) => t(HISTORY.changeHeight),
  shape: (t) => t(HISTORY.changeShape),
};

/** The bar's line after Undo (`undone`) or Redo, naming what it changed. */
export function historyLine(t: T, undone: boolean, change: StudioChange): TranslatedText {
  if (change === 'other') return t(undone ? HISTORY.undone : HISTORY.redone);
  const what = CHANGE_WORD[change](t);
  return t(undone ? HISTORY.undoneWhat : HISTORY.redoneWhat, { what });
}
