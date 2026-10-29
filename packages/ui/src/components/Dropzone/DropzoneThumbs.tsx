import { closingPress, type FocusAfter } from '../../primitives/FocusAfter';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { isStillUploading, progressPercent, thumbName } from './Dropzone.logic';
import type { DropzoneFile, DropzoneWords } from './Dropzone.types';
import { FileGlyph } from './DropzoneGlyphs';

interface DropzoneThumbsProps {
  files: DropzoneFile[];
  onRemove?: (file: DropzoneFile, index: number) => void;
  words: Pick<DropzoneWords, 'uploadedPhoto' | 'remove'>;
  /** Where focus lands once a removed file has taken its thumbnail away — the capture surface. */
  focusAfter: FocusAfter;
}

/** The captured files. The remove control is a 28px circle inside a 44px target — two rectangles. */
export function DropzoneThumbs({ files, onRemove, words, focusAfter }: DropzoneThumbsProps) {
  return (
    <ul className="hg-dropzone-thumbs">
      {files.map((file, index) => (
        <li key={file.id ?? file.name ?? index} className="hg-dropzone-thumb">
          {file.url === undefined ? (
            <span className="hg-dropzone-thumb-glyph">
              <FileGlyph />
            </span>
          ) : (
            <img className="hg-dropzone-thumb-image" src={file.url} alt={thumbName(file, words)} />
          )}
          {isStillUploading(file) ? (
            <span className="hg-dropzone-thumb-track">
              <span
                className="hg-dropzone-thumb-fill"
                style={{ width: `${progressPercent(file.progress)}%` }}
              />
            </span>
          ) : null}
          {onRemove === undefined ? null : (
            <button
              type="button"
              className="hg-dropzone-thumb-remove"
              aria-label={words.remove(file.name)}
              onClick={closingPress(focusAfter)(() => onRemove(file, index))}
            >
              <span className="hg-dropzone-thumb-remove-circle">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <ShellGlyphMarks name="close" />
                </svg>
              </span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
