import type { TranslatedText } from '@heliogrid/contracts';
import { takesImages } from './Dropzone.logic';
import type { DropzoneWords } from './Dropzone.types';

export interface CaptureLineInput {
  busy: boolean;
  hint: TranslatedText | undefined;
  accept: string;
  capture: 'user' | 'environment' | undefined;
  maxSizeMB: number;
  /** The web takes a drop; a phone only browses. */
  drop: boolean;
  words: DropzoneWords;
}

/**
 * The line UNDER the label.
 *
 * THE NAME OF THE ACT SURVIVES THE WAIT: "Uploading…" is this line, never the label — replacing the
 * label is the shape the readme names as a defect on `Button loading`. The spinner is the progress
 * channel; the state goes here, where the hint lives.
 *
 * The browse line names the file types and the ceiling from `maxSizeMB`, never a size of its own: a
 * component that states a limit nobody told it promises one thing while the caller refuses another.
 */
export function captureLine({
  busy,
  hint,
  accept,
  capture,
  maxSizeMB,
  drop,
  words,
}: CaptureLineInput): TranslatedText {
  if (busy) {
    return words.uploading;
  }
  if (hint !== undefined) {
    return hint;
  }
  if (capture !== undefined) {
    return words.captureOrUpload;
  }
  return words.browse({ drop, kind: takesImages(accept) ? 'image' : 'pdf', maxSizeMB });
}
