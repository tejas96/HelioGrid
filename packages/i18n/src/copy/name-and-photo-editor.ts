import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The words of Profile & preferences' *Edit name* editor (`SCR-M01-11`), for the frame domain's
 * first-run flow decides. It takes First-Run Profile's field and photo words as they stand; only
 * its act, its refusal and a failed removal (owner ruling 4 at `T-M01-011c`) are its own. A failed
 * upload reads the 1536 line at both widths: the phone's First-Run line points at this page.
 */

import type { FirstRunProfileFrame } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { FIRST_RUN_PROFILE, refusedPhotoLine } from './first-run-profile';
import { SHELL } from './shell';

export const NAME_AND_PHOTO_EDITOR = {
  save: /*i18n*/ { id: 'Save' },
  done: /*i18n*/ { id: 'Done' },
  nameNotSaved: /*i18n*/ { id: 'Your name did not save' },
  pressSave: /*i18n*/ { id: 'Press Save to try again.' },
  photoNotRemoved: /*i18n*/ { id: 'Your photo was not removed' },
  photoNotRemovedLine: /*i18n*/ { id: 'Try again, or remove it later.' },
};

/** Every word the editor draws for one frame; `null` where the frame has no such part. */
export interface NameAndPhotoEditorWords {
  readonly title: TranslatedText;
  readonly close: TranslatedText;
  readonly name: {
    readonly label: TranslatedText;
    readonly error: TranslatedText | null;
    readonly success: TranslatedText | null;
  };
  readonly photo: {
    readonly label: TranslatedText;
    /** The act on the phone, then at 1536: a photo is taken there, chosen here. */
    readonly choosePhone: TranslatedText;
    readonly chooseWide: TranslatedText;
    readonly replace: TranslatedText;
    readonly remove: TranslatedText;
    readonly error: { readonly title: TranslatedText; readonly line: TranslatedText } | null;
  };
  readonly act: TranslatedText;
  readonly saveFailed: { readonly title: TranslatedText; readonly line: TranslatedText } | null;
}

function photoErrorOf(
  t: Translator['t'],
  frame: FirstRunProfileFrame,
): NameAndPhotoEditorWords['photo']['error'] {
  const { photo } = frame;
  if (frame.kind === 'error-photo') {
    return photo.kind === 'none'
      ? {
          title: t(NAME_AND_PHOTO_EDITOR.photoNotRemoved),
          line: t(NAME_AND_PHOTO_EDITOR.photoNotRemovedLine),
        }
      : { title: t(FIRST_RUN_PROFILE.photoFailed), line: t(FIRST_RUN_PROFILE.photoFailedWide) };
  }
  if (photo.kind !== 'refused') return null;
  return { title: t(FIRST_RUN_PROFILE.photoRefused), line: refusedPhotoLine(t, photo) };
}

export function nameAndPhotoEditorWords(
  t: Translator['t'],
  frame: FirstRunProfileFrame,
): NameAndPhotoEditorWords {
  const retry = frame.photoAct === 'retry';
  return {
    title: t(FIRST_RUN_PROFILE.aboutTitle),
    close: t(SHELL.close),
    name: {
      label: t(FIRST_RUN_PROFILE.nameLabel),
      error: frame.kind === 'empty-pressed' ? t(FIRST_RUN_PROFILE.nameEmpty) : null,
      success: frame.kind === 'error-photo' ? t(FIRST_RUN_PROFILE.nameSaved) : null,
    },
    photo: {
      label: t(FIRST_RUN_PROFILE.photoLabel),
      choosePhone: t(retry ? FIRST_RUN_PROFILE.photoRetry : FIRST_RUN_PROFILE.photoAdd),
      chooseWide: t(retry ? FIRST_RUN_PROFILE.photoRetry : FIRST_RUN_PROFILE.photoChoose),
      replace: t(retry ? FIRST_RUN_PROFILE.photoRetry : FIRST_RUN_PROFILE.photoReplace),
      remove: t(FIRST_RUN_PROFILE.photoRemove),
      error: photoErrorOf(t, frame),
    },
    act: t(frame.act === 'continue' ? NAME_AND_PHOTO_EDITOR.done : NAME_AND_PHOTO_EDITOR.save),
    saveFailed:
      frame.kind === 'error-save'
        ? {
            title: t(NAME_AND_PHOTO_EDITOR.nameNotSaved),
            line: t(NAME_AND_PHOTO_EDITOR.pressSave),
          }
        : null,
  };
}
