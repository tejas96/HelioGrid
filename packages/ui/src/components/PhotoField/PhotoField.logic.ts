import type { TranslatedText } from '@heliogrid/contracts';
import { initialsOf } from '../Avatar/Avatar.types';
import type { PhotoFieldSize } from './PhotoField.types';

/** The act's words: replacing a photo is a different act from choosing a first one. */
export function actLabel(
  hasPhoto: boolean,
  chooseLabel: TranslatedText,
  replaceLabel?: TranslatedText,
): TranslatedText {
  return hasPhoto && replaceLabel !== undefined ? replaceLabel : chooseLabel;
}

/**
 * `Avatar` derives its fallback from `name`, so an EMPTY name renders an empty tinted circle. That
 * is a rendering fault rather than "no name yet", so a nameless field with no photo draws a
 * neutral mark — and `F7-19` forbids inventing an image to fill it.
 */
export function drawsNamelessMark(src: string | undefined, name: string): boolean {
  return src === undefined && initialsOf(name).length === 0;
}

/** The removal act — offered only when there is a photo to remove and the words to name it. */
export interface PhotoRemoval {
  remove: () => void;
  label: TranslatedText;
}

export function removalOf(
  hasPhoto: boolean,
  onRemove: (() => void) | undefined,
  removeLabel: TranslatedText | undefined,
): PhotoRemoval | null {
  return hasPhoto && onRemove !== undefined && removeLabel !== undefined
    ? { remove: onRemove, label: removeLabel }
    : null;
}

/** 120 opens the desktop composition: the banner, the acts and the helper stack beside the circle. */
export function isDesktopComposition(size: PhotoFieldSize): boolean {
  return size === 120;
}
