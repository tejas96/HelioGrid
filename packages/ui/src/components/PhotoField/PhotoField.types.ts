import type { ReactNode } from 'react';

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

export interface PhotoFieldProps {
  /** The group's accessible name — say that the photo is optional. Already translated. */
  label: string;
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
  /** The act's words when there is no photo yet. Required — a control nobody can read is not one. */
  chooseLabel: string;
  /** The act's words when a photo is already chosen. */
  replaceLabel?: string;
  /** The removal's words. Required whenever `onRemove` is given. */
  removeLabel?: string;
  /**
   * The upload failed. The words carry it and the ring is the second channel (`F7-12`); it attaches
   * to this group rather than to the page, so a name that saved is not put in doubt.
   */
  error?: string;
  /** A sentence under the acts — what the fallback will be, where the photo ends up afterwards. */
  helper?: ReactNode;
  /** The photo is being written. The circle waits; the act is not offered greyed out. */
  loading?: boolean;
  disabled?: boolean;
}
