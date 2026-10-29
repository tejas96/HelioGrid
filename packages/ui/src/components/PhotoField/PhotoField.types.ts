import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { PickedFile } from '../Dropzone/Dropzone.types';

/**
 * ONE image, captured into the circle it will live in. Not `Dropzone`, which captures MANY files
 * into a dashed rectangle and carries a held-on-device queue — a profile photo is an ordinary
 * server write, nothing drags on a phone, and a dashed rectangle promises a rectangle when what is
 * kept is a circular crop.
 *
 * THE FALLBACK IS ON SCREEN, which is what makes "optional" honest: with no photo the circle shows
 * the initials the caller's `name` derives, so the frame shows the exact result of not choosing
 * one. That is also why there is no `Skip` act — there is no gate to skip past.
 */

/** The circle's diameter. 72 is the phone's row; 120 opens a desktop composition. */
export type PhotoFieldSize = 72 | 120;

/** The act's glyph: the camera on the phone, the upload arrow at 1536, the retry arrow after a refusal. */
export type PhotoFieldActIcon = 'camera' | 'upload' | 'retry';

export interface PhotoFieldProps {
  /** The group's accessible name — say that the photo is optional. Already translated. */
  label: TranslatedText;
  /** The chosen image. Absent means no photo, which is a legitimate resting state. */
  src?: string;
  /**
   * Whose photo this is. Its initials are the fallback. **Empty is a real state** — a person who
   * has not said their name yet gets a neutral mark rather than an empty tinted circle.
   */
  name?: string;
  size?: PhotoFieldSize;
  /** Opens the platform's own camera-or-gallery chooser. Absent makes the field read-only. */
  onChoose?: () => void;
  /** Present only when a photo is chosen — removing it returns the initials, destroying nothing. */
  onRemove?: () => void;
  /**
   * The 1536 composition only: an image dropped onto the circle, which takes an accent ring while a
   * file is over it. A `PickedFile`, not the DOM `File` the design system types, which the phone
   * half cannot hold (Laws 7, 10); the native half ignores it — nothing drags on a phone.
   */
  onDrop?: (file: PickedFile) => void;
  /** The act's words when there is no photo yet. Required — a control nobody can read is not one. */
  chooseLabel: TranslatedText;
  /** The act's words when a photo is already chosen. */
  replaceLabel?: TranslatedText;
  /** The removal's words. Required whenever `onRemove` is given. */
  removeLabel?: TranslatedText;
  /** The act's glyph (`camera` default). The act is always `Button` secondary, size `md`. */
  actIcon?: PhotoFieldActIcon;
  /**
   * The photo was refused or did not upload: a danger `Banner` (`kind="validation"`) INSIDE the
   * photo group — above the act in the 120 composition, under the circle and act on the 72 row — so
   * a name that saved is not put in doubt.
   */
  error?: TranslatedText;
  /** The refusal banner's bold first line. */
  errorTitle?: TranslatedText;
  /** A sentence under the acts — what the fallback will be, where the photo ends up afterwards. */
  helper?: ReactNode;
  /** The photo is being written. The circle shimmers; the act is not offered greyed out. */
  loading?: boolean;
  disabled?: boolean;
}
