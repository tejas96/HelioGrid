import type { DropzoneFile } from './Dropzone.types';
import { FileGlyph } from './DropzoneGlyphs';

interface DropzoneThumbsProps {
  files: DropzoneFile[];
  onRemove?: (file: DropzoneFile, index: number) => void;
}

/** The captured files. The remove control is a 28px circle inside a 44px target — two rectangles. */
export function DropzoneThumbs({ files, onRemove }: DropzoneThumbsProps) {
  return (
    <ul className="hg-dropzone-thumbs">
      {files.map((file, index) => (
        <li key={file.id ?? file.name ?? index} className="hg-dropzone-thumb">
          {file.url === undefined ? (
            <span className="hg-dropzone-thumb-glyph">
              <FileGlyph />
            </span>
          ) : (
            <img
              className="hg-dropzone-thumb-image"
              src={file.url}
              alt={file.name ?? 'Uploaded photo'}
            />
          )}
          {file.progress !== undefined && file.progress < 100 ? (
            <span className="hg-dropzone-thumb-track">
              <span
                className="hg-dropzone-thumb-fill"
                style={{ width: `${Math.max(0, Math.min(100, file.progress))}%` }}
              />
            </span>
          ) : null}
          {onRemove === undefined ? null : (
            <button
              type="button"
              className="hg-dropzone-thumb-remove"
              aria-label={`Remove ${file.name ?? 'photo'}`}
              onClick={() => onRemove(file, index)}
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
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
