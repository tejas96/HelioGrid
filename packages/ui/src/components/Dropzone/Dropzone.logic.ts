import type { TranslatedText } from '@heliogrid/contracts';
import type { DropzoneFile, DropzoneWords } from './Dropzone.types';

/** An `accept` of images takes photos — the camera glyph and the photo nouns; anything else, files. */
export function takesImages(accept: string): boolean {
  return accept.startsWith('image');
}

/** A progress figure as a bar's filled width, held to 0–100. */
export function progressPercent(progress: number): number {
  return Math.max(0, Math.min(100, progress));
}

/** A thumbnail draws its own bar only while its file is still on its way up. */
export function isStillUploading(file: DropzoneFile): file is DropzoneFile & { progress: number } {
  return file.progress !== undefined && file.progress < 100;
}

/** A thumbnail's name for a screen reader: the file's own, else the default. */
export function thumbName(file: DropzoneFile, words: Pick<DropzoneWords, 'uploadedPhoto'>): string {
  return file.name ?? words.uploadedPhoto;
}

/** A refused file says the caller's words, else that it is over the ceiling. */
export function refusalLine(
  errorMessage: TranslatedText | undefined,
  words: Pick<DropzoneWords, 'tooLarge'>,
  maxSizeMB: number,
): TranslatedText {
  return errorMessage ?? words.tooLarge(maxSizeMB);
}
