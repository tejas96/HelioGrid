/**
 * `Dropzone`'s own words (`packages/ui`'s `DropzoneWords`): the line under the act, a refused file's
 * line, the thumbnails' names, and the held queue's count, sentence and retry — authored once for
 * both platforms. Each line is one whole message; a size, a count or a name is its slot.
 */
import type { Translator } from '../runtime';
import { PRICE_BOOK } from './price-book';

const DROPZONE = {
  uploading: /*i18n*/ { id: 'Uploading…' },
  captureOrUpload: /*i18n*/ { id: 'Tap to capture or upload' },
  tooLarge: /*i18n*/ {
    id: 'That file is over {size} MB. Retake the photo at a lower resolution or pick a smaller file.',
  },
  uploadedPhoto: /*i18n*/ { id: 'Uploaded photo' },
  removePhoto: /*i18n*/ { id: 'Remove photo' },
  held: /*i18n*/ {
    id: "Saved on this phone. They upload once there's a connection — nothing captured is lost.",
  },
  photosWaiting: /*i18n*/ { id: '{count, plural, one {# photo waiting} other {# photos waiting}}' },
  filesWaiting: /*i18n*/ { id: '{count, plural, one {# file waiting} other {# files waiting}}' },
  nounWaiting: /*i18n*/ { id: '{count} {noun} waiting' },
  tryUploadingNow: /*i18n*/ { id: 'Try uploading now' },
  flushFailed: /*i18n*/ { id: 'Still nothing to upload over — they stay on this phone.' },
  flushTimedOut: /*i18n*/ { id: "That's taking too long to answer — they stay on this phone." },
} as const;

/** The line under the act: a drop target on the web, browse-only on a phone; images or PDFs. */
const BROWSE = {
  drop: {
    image: /*i18n*/ { id: 'Drop files here or tap to browse · JPG or PNG up to {size} MB' },
    pdf: /*i18n*/ { id: 'Drop files here or tap to browse · PDF up to {size} MB' },
  },
  tap: {
    image: /*i18n*/ { id: 'Tap to browse · JPG or PNG up to {size} MB' },
    pdf: /*i18n*/ { id: 'Tap to browse · PDF up to {size} MB' },
  },
} as const;

/** Every word `Dropzone` draws or speaks on its own, in the reader's language — its `words` prop. */
export function dropzoneWords(t: Translator['t']) {
  return {
    uploading: t(DROPZONE.uploading),
    captureOrUpload: t(DROPZONE.captureOrUpload),
    browse: (facts: {
      readonly drop: boolean;
      readonly kind: 'image' | 'pdf';
      readonly maxSizeMB: number;
    }) => t(BROWSE[facts.drop ? 'drop' : 'tap'][facts.kind], { size: facts.maxSizeMB }),
    tooLarge: (maxSizeMB: number) => t(DROPZONE.tooLarge, { size: maxSizeMB }),
    uploadedPhoto: t(DROPZONE.uploadedPhoto),
    remove: (name: string | undefined) =>
      name === undefined ? t(DROPZONE.removePhoto) : t(PRICE_BOOK.removeRate, { name }),
    held: t(DROPZONE.held),
    heldCount: (facts: { readonly count: number; readonly kind: 'photo' | 'file' }) =>
      t(facts.kind === 'photo' ? DROPZONE.photosWaiting : DROPZONE.filesWaiting, {
        count: facts.count,
      }),
    heldCountOf: (count: number, noun: string) => t(DROPZONE.nounWaiting, { count, noun }),
    tryUploadingNow: t(DROPZONE.tryUploadingNow),
    flushFailed: t(DROPZONE.flushFailed),
    flushTimedOut: t(DROPZONE.flushTimedOut),
  };
}
