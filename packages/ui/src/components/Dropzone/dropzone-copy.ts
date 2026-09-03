/* THE FILE TYPES ONLY — never a size. The ceiling comes from `maxSizeMB` below, because a component
   that states a limit nobody told it promises one thing while the caller refuses another. */
const ACCEPTS_HINT: Record<string, string> = {
  image: 'JPG or PNG',
  pdf: 'PDF',
};

export interface CaptureLineInput {
  busy: boolean;
  hint: string | undefined;
  accept: string;
  capture: 'user' | 'environment' | undefined;
  maxSizeMB: number;
  /** "Drop files here or tap to browse" on web; "Tap to browse" where there is no drop target. */
  browsePhrase: string;
}

/**
 * The line UNDER the label.
 *
 * THE NAME OF THE ACT SURVIVES THE WAIT: "Uploading…" is this line, never the label — replacing the
 * label is the shape the readme names as a defect on `Button loading`. The spinner is the progress
 * channel; the state goes here, where the hint lives.
 */
export function captureLine({
  busy,
  hint,
  accept,
  capture,
  maxSizeMB,
  browsePhrase,
}: CaptureLineInput): string {
  if (busy) {
    return 'Uploading…';
  }
  if (hint !== undefined) {
    return hint;
  }
  if (capture !== undefined) {
    return 'Tap to capture or upload';
  }
  const acceptHint = ACCEPTS_HINT[accept.startsWith('image') ? 'image' : 'pdf'];
  const limit = `up to ${maxSizeMB} MB`;
  return `${browsePhrase} · ${acceptHint === undefined ? limit : `${acceptHint} ${limit}`}`;
}

/** The default when a file was refused: state the problem AND the fix. */
export function sizeErrorMessage(maxSizeMB: number): string {
  return `That file is over ${maxSizeMB} MB. Retake the photo at a lower resolution or pick a smaller file.`;
}
