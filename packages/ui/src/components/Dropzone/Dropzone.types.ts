import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { NoConnectionProps } from '../NoConnection/NoConnection.types';

export interface DropzoneFile {
  id?: string | number;
  name?: string;
  /** Object URL or remote URL for the thumbnail. */
  url?: string;
  /** 0–100 while this file is uploading. */
  progress?: number;
}

/**
 * A file the user picked.
 *
 * The DS hands back the DOM `File`, which does not exist on React Native, so the shared contract
 * carries the facts both platforms can supply plus the platform's own handle beside them. Cast
 * `source` at the edge that consumes it — a `File` on web, the picker's asset on native.
 */
export interface PickedFile {
  name: string;
  /** Bytes, where the platform reports it. */
  size?: number;
  /** MIME type, where the platform reports it. */
  type?: string;
  /** An asset URI on native; an object URL on web when one was made. */
  uri?: string;
  /** The platform's own handle. */
  source: unknown;
}

/** What the line under the label names: whether the surface takes a drop, what it takes, its ceiling. */
export interface DropzoneBrowseFacts {
  /** A drop target — the web; a phone has none and only browses. */
  readonly drop: boolean;
  readonly kind: 'image' | 'pdf';
  readonly maxSizeMB: number;
}

/** How many are waiting, in the default noun for what the surface takes. */
export interface DropzoneHeldFacts {
  readonly count: number;
  readonly kind: 'photo' | 'file';
}

/**
 * Every word the capture area draws or speaks on its own, in the reader's language
 * (`packages/i18n`'s `dropzoneWords`). Required: the area holds no word of its own.
 */
export interface DropzoneWords {
  /** The line under the label while a file uploads — *Uploading…*. */
  uploading: TranslatedText;
  /** The line under a camera capture's label — *Tap to capture or upload*. */
  captureOrUpload: TranslatedText;
  /** The line under the label otherwise — *Drop files here or tap to browse · JPG or PNG up to 10 MB*. */
  browse: (facts: DropzoneBrowseFacts) => TranslatedText;
  /** A refused file when the caller words none: the problem and the fix — *That file is over 10 MB. …* */
  tooLarge: (maxSizeMB: number) => TranslatedText;
  /** A thumbnail's name when its file has none — *Uploaded photo*. */
  uploadedPhoto: TranslatedText;
  /** A thumbnail's remove control — *Remove {name}*, or *Remove photo* when the file has no name. */
  remove: (name: string | undefined) => TranslatedText;
  /** The held queue's sentence — *Saved on this phone. They upload once there's a connection …* */
  held: TranslatedText;
  /** The held count in the default noun — *3 photos waiting*. */
  heldCount: (facts: DropzoneHeldFacts) => TranslatedText;
  /** The held count in the caller's `heldNoun` — *3 documents waiting*. */
  heldCountOf: (count: number, noun: string) => TranslatedText;
  /** The retry — *Try uploading now*. */
  tryUploadingNow: TranslatedText;
  /** A flush that reported failure — *Still nothing to upload over — they stay on this phone.* */
  flushFailed: TranslatedText;
  /** A flush that never answered — *That's taking too long to answer — they stay on this phone.* */
  flushTimedOut: TranslatedText;
}

export interface DropzoneProps {
  /** Every word the area says on its own — see `DropzoneWords`. */
  words: DropzoneWords;
  /** The act, always drawn — *Add roof photos*. */
  label: TranslatedText;
  hint?: TranslatedText;
  accept?: string;
  multiple?: boolean;
  /** "environment" opens the rear camera on Android — use for roof photos. */
  capture?: 'user' | 'environment';
  files?: DropzoneFile[];
  onFiles?: (files: PickedFile[]) => void;
  onRemove?: (file: DropzoneFile, index: number) => void;
  maxSizeMB?: number;
  state?: 'idle' | 'uploading' | 'error';
  /** State the problem and the fix. Without it, `words.tooLarge`. */
  errorMessage?: TranslatedText;
  /** 0–100 for the whole batch. */
  progress?: number | null;
  /**
   * What was captured is held on the device and uploads once there's a connection. The one place in
   * the product where anything is kept back. **Not an app-wide connection state** — for that, see
   * `NoConnection`. The noun is `heldNoun`'s, not always "photo": `SCR-M08-03`'s checklist rows
   * hold PDFs.
   */
  heldOnDevice?: boolean;
  /**
   * **How many are waiting** (`M11-37` P0 / `SCR-M11-03`: *"with its waiting count and a retry shown
   * on the capture screen itself"*, `F4-21`). Defaults to `files.length`; pass it when the device
   * queue is longer than the thumbnails on screen, which it usually is — a queue outlives this
   * mount. This is not a status line: photographs are the **one** thing in the product held back,
   * `F4-21` is *"nothing captured is unrecoverable"*, and a surveyor on a roof with no signal needs
   * to see that their eleven photos still exist. The count is a promise being kept.
   */
  heldCount?: number;
  /**
   * **The retry `M11-37` requires, on the capture surface** — attempt the held queue now. It sits
   * beside the count at 44px and **keeps its label while it works** (a spinner beside the words,
   * never instead of them).
   *
   * **It reports what actually happened**, the same contract `NoConnection.onRetry` has and for the
   * same reason: a flush attempted on a roof with no signal used to return in silence. Return
   * `false` or reject to say it failed and the block says so; a retry that never answers is stopped
   * at `retryTimeout` rather than spinning under someone who thinks it is still working. Any other
   * outcome says nothing — a success is never claimed unobserved.
   *
   * Typed as `NoConnection.onRetry` LITERALLY, because the design system says it is the same
   * contract: `() => void | boolean | Promise<unknown>`. Stating it once means the two can never
   * come to disagree about what a flush is allowed to answer.
   */
  onRetry?: NoConnectionProps['onRetry'];
  /** Overrides `words.tryUploadingNow`. */
  retryLabel?: TranslatedText;
  /** The words when a flush reports failure. Overrides `words.flushFailed`. */
  failedMessage?: TranslatedText;
  /** The words when a flush never answers within `retryTimeout`. Overrides `words.flushTimedOut`. */
  timeoutMessage?: TranslatedText;
  /** Milliseconds before a non-answering flush is called one. Default 10000. */
  retryTimeout?: number;
  /**
   * Overrides the generated held-queue **sentence**. The count and the retry stay — literally: the
   * count is its own element above the sentence, so this cannot take the number with it. That
   * mattered most on `SCR-M08-03`, where the generated wording was wrong for a PDF and
   * `heldMessage` was the only fix.
   */
  heldMessage?: ReactNode;
  /** What is waiting, singular — "document". Without it, photos for an image `accept`, else files. */
  heldNoun?: TranslatedText;
  /** Its plural. Without it the singular names any count. */
  heldNounPlural?: TranslatedText;
  /**
   * **Native only, and the one prop this port adds.** React Native has no file input, and a picker
   * needs a native module `@heliogrid/ui` must not depend on. The native half calls this when the
   * capture surface is pressed; the app opens its own picker and hands the result back through
   * `onFiles`. The web half ignores it — its `<input type="file">` is already the picker.
   */
  onRequestFiles?: () => void;
  density?: 'expressive' | 'functional';
  disabled?: boolean;
}
