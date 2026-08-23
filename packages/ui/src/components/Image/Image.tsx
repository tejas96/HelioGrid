import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { classNames } from '../../primitives/class-names';
import { useImageLoad } from './Image.load';
import { imageView, isCompact } from './Image.logic';
import { IMAGE_RATIOS } from './Image.missing';
import type { ImageProps, ThumbnailProps } from './Image.types';
import { ImageCaption } from './ImageCaption';
import { Glyph } from './ImageMarks';
import { ImageMissing, ImagePhoto } from './ImageStates';

/** Per-instance geometry rides in as custom properties; every colour stays in Image.css. */
type StyleVars = CSSProperties & Record<string, string | number | undefined>;

interface WebImageProps extends ImageProps {
  className?: string;
  style?: CSSProperties;
}

interface WebThumbnailProps extends ThumbnailProps {
  className?: string;
  style?: CSSProperties;
}

const px = (v: number | string): string => (typeof v === 'number' ? `${v}px` : v);

/**
 * Three-state photo surface: loading · present · permanently missing, all in one footprint that is
 * fixed before anything loads. **Missing is a resting state, not an error**, and the two kinds of
 * missing are different facts so they don't look the same.
 *
 * Shortfall reports before age (MS11-11): `staleAt` is suppressed while the image is missing.
 * `referenceOnly` (M05-29) shows in ALL THREE states — the law doesn't lapse because the photo
 * hasn't loaded.
 */
export function Image({
  src,
  alt = '',
  status = 'auto',
  ratio = 'photo',
  width = '100%',
  height,
  fit = 'cover',
  position = 'center',
  radius,
  caption,
  credit,
  attribution,
  meta,
  staleAt,
  referenceOnly = false,
  referenceLabel = 'Reference only',
  referenceNote = 'Never measured from',
  missingReason = 'not-captured',
  missingLabel,
  missingDetail,
  onRetry,
  retryLabel = 'Try again',
  onClick,
  lazy = false,
  density = 'expressive',
  className,
  style,
}: WebImageProps) {
  const load = useImageLoad(src);

  /* THE PHOTO CREDIT IS `credit`, NOT `attribution`. `attribution` is a system-wide slot — which
     layer supplied an un-overridden value, rendered by ValueSource — and this prop held a
     photographer's name under the same word. The old name still works and warns. */
  const who = credit ?? attribution;
  useEffect(() => {
    if (attribution !== undefined) {
      console.warn(
        'Image: `attribution` is now `credit` (who took the photograph). `attribution` is the system’s ValueSource slot — which layer supplied a value — and an image frame does not have one.',
      );
    }
  }, [attribution]);

  const { state, reason } = imageView(status, src, load.loaded, load.failed, missingReason);

  const r = radius ?? (density === 'functional' ? 12 : 20);
  const compact = isCompact(width);

  const vars: StyleVars = {
    '--hg-image-w': px(width),
    '--hg-image-radius': `${r}px`,
    '--hg-image-fit': fit,
    '--hg-image-position': position,
    ...(height !== undefined
      ? { '--hg-image-h': px(height) }
      : { '--hg-image-ratio': IMAGE_RATIOS[ratio] ?? ratio }),
  };

  const figure = (
    <figure
      className={classNames('hg-image', className)}
      data-density={density}
      data-compact={compact ? 'true' : undefined}
      data-sized={height !== undefined ? 'height' : 'ratio'}
      style={onClick ? style : { ...vars, ...style }}
    >
      <div className="hg-image-frame">
        {state === 'missing' ? (
          <ImageMissing
            alt={alt}
            width={width}
            reason={reason}
            missingLabel={missingLabel}
            missingDetail={missingDetail}
            onRetry={onRetry}
            retryLabel={retryLabel}
          />
        ) : (
          <ImagePhoto src={src} alt={alt} state={state} lazy={lazy} load={load} />
        )}
        <div className="hg-image-sheen" aria-hidden="true" />
        {referenceOnly ? (
          <span className="hg-image-ref">
            <Glyph name="eye" size={13} />
            {compact ? 'Ref' : referenceLabel}
          </span>
        ) : null}
      </div>
      <ImageCaption
        caption={caption}
        credit={who}
        meta={meta}
        referenceOnly={referenceOnly}
        referenceNote={referenceNote}
        staleAt={staleAt}
        missing={state === 'missing'}
      />
    </figure>
  );

  if (!onClick) return figure;
  return (
    <button type="button" className="hg-image-button" style={vars} onClick={onClick}>
      {figure}
    </button>
  );
}

/**
 * Thumbnail — the same three states in a small square. Compact below 140px: the icon carries the
 * state visually and the accessible name carries the words.
 */
export function Thumbnail({
  size = 64,
  ratio = 'square',
  radius,
  density = 'functional',
  ...rest
}: WebThumbnailProps) {
  return <Image width={size} ratio={ratio} radius={radius ?? 12} density={density} {...rest} />;
}

/**
 * `Image` shadows the browser's native constructor: a top-level `const { Image } = …` binding
 * breaks `new Image()` for every script on the page, silently and globally. `ImageFrame` is the
 * same component under a name that can't collide — PREFER IT.
 */
export const ImageFrame = Image;
