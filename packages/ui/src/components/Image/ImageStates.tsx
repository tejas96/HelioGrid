import { RetryButton } from '../Button/RetryButton';
import type { ImageLoad } from './Image.load';
import type { ImageState } from './Image.logic';
import { missingFaceOf } from './Image.logic';
import type { ImageMissingProps } from './Image.types';
import { Glyph } from './ImageMarks';

/**
 * The frame's resting face: no photo, said in words. **Missing is not an error** — the two kinds
 * are different facts, so `not-captured` is neutral and permanent while `unavailable` takes the
 * warning tint and offers the retry. It fills the footprint the frame reserved, so nothing
 * reflows if a photo arrives later.
 */
export function ImageMissing({ onRetry, retryLabel, focusAfter, ...missing }: ImageMissingProps) {
  const face = missingFaceOf(missing);
  return (
    <div className="hg-image-missing" data-tone={face.tone}>
      {/* THE NAME GOES ON THE PICTURE, NEVER ON THE PANEL. `role="img"` makes its whole subtree
          presentational: name the panel and the detail sentence is swallowed into the concatenated
          label while the retry becomes an unnamed focus stop. The mark IS the glyph-and-words
          picture, so the sentence and the retry stay their own elements beside it — the same shape
          the native half holds with `accessible` on its mark View. */}
      <div className="hg-image-missing-mark" role="img" aria-label={face.name}>
        <Glyph name={face.icon} size={face.glyphSize} />
        {face.showsLabel ? <span className="hg-image-missing-label">{face.label}</span> : null}
      </div>
      {face.detail === undefined ? null : (
        <span className="hg-image-missing-detail">{face.detail}</span>
      )}
      {face.offersRetry ? (
        <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
      ) : null}
    </div>
  );
}

export interface ImagePhotoProps {
  src?: string;
  alt?: string;
  state: ImageState;
  lazy: boolean;
  load: ImageLoad;
}

/**
 * The photograph, and the skeleton that holds its box until it decodes — the skeleton sits under
 * the image and is revealed by its opacity, so the box is never empty.
 */
export function ImagePhoto({ src, alt, state, lazy, load }: ImagePhotoProps) {
  return (
    <>
      {state === 'loading' ? <div className="hg-image-skeleton" aria-hidden="true" /> : null}
      {src ? (
        <img
          ref={load.img}
          className="hg-image-img"
          data-state={state}
          src={src}
          alt={alt ?? ''}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={load.onLoad}
          onError={load.onError}
        />
      ) : null}
    </>
  );
}
