import type { CSSProperties } from 'react';
import { useId, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { progressPercent, refusalLine, takesImages } from './Dropzone.logic';
import type { DropzoneProps, PickedFile } from './Dropzone.types';
import { CameraGlyph, DropzoneSpinner, FileGlyph } from './DropzoneGlyphs';
import { DropzoneHeld } from './DropzoneHeld';
import { DropzoneThumbs } from './DropzoneThumbs';
import { captureLine } from './dropzone-copy';
import { HELD_RETRY_TIMEOUT, heldCountWords, heldTotal } from './dropzone-held';
import { pickedFileOf } from './picked-file';

interface WebDropzoneProps extends DropzoneProps {
  className?: string;
  style?: CSSProperties;
}

function toPicked(list: FileList): PickedFile[] {
  return Array.from(list, pickedFileOf);
}

/**
 * File / photo capture area.
 *
 * BORDER EXCEPTION — the 1.5px dashed edge is one of only two legal exceptions to the system's
 * no-borders rule (the other is the opt-in high-contrast field mode). It is the affordance, not a
 * container border: it is what says "this area accepts a drop". Do not replace it with a shadow.
 *
 * ONE TAB STOP, AND IT IS THE INPUT. The visible surface is the file input's `<label>` — no
 * `role="button"`, no `tabIndex`, no click or keydown handler of its own. The focus ring is drawn on
 * the label from the input's own focus, which puts it on the rectangle the eye is already on. The
 * drop handlers stay on the label, so the drop target is still one rectangle.
 */
export function Dropzone({
  words,
  label,
  hint,
  accept = 'image/*',
  multiple = true,
  capture,
  files = [],
  onFiles,
  onRemove,
  maxSizeMB = 10,
  state = 'idle',
  errorMessage,
  progress = null,
  heldOnDevice = false,
  heldCount,
  onRetry,
  retryLabel = words.tryUploadingNow,
  heldMessage,
  heldNoun,
  heldNounPlural,
  failedMessage = words.flushFailed,
  timeoutMessage = words.flushTimedOut,
  retryTimeout = HELD_RETRY_TIMEOUT,
  density = 'expressive',
  disabled = false,
  className,
  style,
}: WebDropzoneProps) {
  const autoId = useId();
  const [over, setOver] = useState(false);
  /* A removed file takes its thumbnail away: focus goes to the surface, the one tab stop. */
  const surface = useRef<HTMLInputElement>(null);
  const isError = state === 'error';
  const busy = state === 'uploading';
  const isImage = takesImages(accept);
  const heldId = `${autoId}-held`;
  const errorId = `${autoId}-err`;
  const countWords = heldCountWords(
    heldTotal(heldCount, files.length),
    { accept, heldNoun, heldNounPlural },
    words,
  );
  /* Both notes describe the surface, and the held queue is one of them: the input is the control a
     screen reader lands on, so it is what has to carry "eleven photos are waiting". */
  const notes = [isError ? errorId : null, heldOnDevice ? heldId : null].filter(
    (note) => note !== null,
  );

  const pick = (list: FileList | null) => {
    if (onFiles !== undefined && list !== null && list.length > 0) {
      onFiles(toPicked(list));
    }
  };

  const line = captureLine({
    busy,
    hint,
    accept,
    capture,
    maxSizeMB,
    drop: true,
    words,
  });

  return (
    <div className={classNames('hg-dropzone', className)} style={style}>
      <label
        className="hg-dropzone-surface"
        data-density={density}
        data-over={over ? 'true' : undefined}
        data-error={isError ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        onDragOver={(event) => {
          if (disabled) {
            return;
          }
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          if (!disabled) {
            pick(event.dataTransfer.files);
          }
        }}
      >
        <span className="hg-dropzone-glyph">
          {busy ? <DropzoneSpinner /> : isImage ? <CameraGlyph /> : <FileGlyph />}
        </span>
        {/* THE NAME OF THE ACT SURVIVES THE WAIT. "Uploading…" never replaces the label; the
            spinner is the progress channel and the state goes in the line below. */}
        <div className="hg-dropzone-label">{label}</div>
        <div className="hg-dropzone-line">{line}</div>
        <input
          ref={surface}
          className="hg-dropzone-input"
          type="file"
          accept={accept}
          multiple={multiple}
          capture={capture}
          disabled={disabled}
          aria-describedby={notes.length === 0 ? undefined : notes.join(' ')}
          onChange={(event) => pick(event.target.files)}
        />
      </label>

      {busy && progress !== null ? (
        <div className="hg-dropzone-track">
          <div className="hg-dropzone-fill" style={{ width: `${progressPercent(progress)}%` }} />
        </div>
      ) : null}

      {isError ? (
        <p className="hg-dropzone-error" id={errorId} role="alert">
          {refusalLine(errorMessage, words, maxSizeMB)}
        </p>
      ) : null}

      {heldOnDevice ? (
        <DropzoneHeld
          busy={busy}
          countWords={countWords}
          failedMessage={failedMessage}
          held={words.held}
          heldMessage={heldMessage}
          id={heldId}
          onRetry={onRetry}
          retryLabel={retryLabel}
          retryTimeout={retryTimeout}
          timeoutMessage={timeoutMessage}
        />
      ) : null}

      {files.length > 0 ? (
        <DropzoneThumbs files={files} onRemove={onRemove} words={words} focusAfter={surface} />
      ) : null}
    </div>
  );
}
