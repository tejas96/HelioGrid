import type { FirstRunProfileFrame } from '@heliogrid/domain';
import type { PhotoFieldActIcon, PhotoFieldSize } from '../PhotoField/PhotoField.types';
import type { NameAndPhotoEditorWords } from './NameAndPhotoEditor.types';

/**
 * The photo group as the editor's form draws it: 72 and the camera on the sheet, 120 and the upload
 * glyph on the panel, the retry act once the photo alone failed — both halves read it here.
 */
export function editorPhoto(
  words: NameAndPhotoEditorWords,
  frame: FirstRunProfileFrame,
  picture: string | undefined,
  panel: boolean,
) {
  const retry = frame.photoAct === 'retry';
  const held = frame.photo.kind === 'chosen' || frame.photo.kind === 'saved';
  const size: PhotoFieldSize = panel ? 120 : 72;
  const wideIcon: PhotoFieldActIcon = panel ? 'upload' : 'camera';
  return {
    retry,
    // Once the photo alone failed the circle draws the initials and the retry is its one act
    // (`m-edit-photo-failed`): the picture waits in the hook to be sent again.
    src: held && !retry ? picture : undefined,
    size,
    actIcon: retry ? ('retry' as const) : wideIcon,
    chooseLabel: panel ? words.photo.chooseWide : words.photo.choosePhone,
    error: words.photo.error?.line,
    errorTitle: words.photo.error?.title,
  };
}
