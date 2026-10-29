import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { useImageLoad } from './Image.load';
import {
  aspectRatioOf,
  IMAGE_DEFAULTS,
  imageRadiusOf,
  imageView,
  isCompact,
  THUMBNAIL_DEFAULTS,
} from './Image.logic';
import type { ImageProps, ThumbnailProps } from './Image.types';
import { ImageCaption } from './ImageCaption';
import { Glyph } from './ImageMarks';
import { ImageMissing, ImagePhoto } from './ImageStates';
import { usePhotoCredit } from './use-photo-credit';

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
  alt,
  status = IMAGE_DEFAULTS.status,
  ratio = IMAGE_DEFAULTS.ratio,
  width = IMAGE_DEFAULTS.width,
  height,
  fit = IMAGE_DEFAULTS.fit,
  position = 'center',
  radius,
  caption,
  credit,
  attribution,
  meta,
  staleAt,
  referenceOnly = false,
  words,
  referenceLabel = words.referenceOnly,
  referenceNote = words.neverMeasured,
  missingReason = IMAGE_DEFAULTS.missingReason,
  missingLabel,
  missingDetail,
  onRetry,
  retryLabel,
  onClick,
  lazy = false,
  density = IMAGE_DEFAULTS.density,
  className,
  style,
}: WebImageProps) {
  const load = useImageLoad(src);
  /* The frame holds every face, so focus lands on it once a retry has left. */
  const frame = useRef<HTMLDivElement>(null);

  const who = usePhotoCredit(credit, attribution);

  const { state, reason } = imageView(status, src, load.loaded, load.failed, missingReason);

  const r = imageRadiusOf(radius, density);
  const compact = isCompact(width);

  const vars: StyleVars = {
    '--hg-image-w': px(width),
    '--hg-image-radius': `${r}px`,
    '--hg-image-fit': fit,
    '--hg-image-position': position,
    ...(height !== undefined
      ? { '--hg-image-h': px(height) }
      : { '--hg-image-ratio': aspectRatioOf(ratio) }),
  };

  const figure = (
    <figure
      className={classNames('hg-image', className)}
      data-density={density}
      data-compact={compact ? 'true' : undefined}
      data-sized={height !== undefined ? 'height' : 'ratio'}
      style={onClick ? style : { ...vars, ...style }}
    >
      <div
        ref={frame}
        tabIndex={onRetry !== undefined ? -1 : undefined}
        className={classNames(
          'hg-image-frame',
          onRetry !== undefined ? 'hg-focus-target' : undefined,
        )}
      >
        {state === 'missing' ? (
          <ImageMissing
            alt={alt}
            width={width}
            reason={reason}
            missingLabel={missingLabel}
            missingDetail={missingDetail}
            onRetry={onRetry}
            retryLabel={retryLabel}
            words={words}
            focusAfter={frame}
          />
        ) : (
          <ImagePhoto src={src} alt={alt} state={state} lazy={lazy} load={load} />
        )}
        <div className="hg-image-sheen" aria-hidden="true" />
        {referenceOnly ? (
          <span className="hg-image-ref">
            <Glyph name="eye" size={13} />
            {compact ? words.referenceShort : referenceLabel}
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
        words={words}
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
  size = THUMBNAIL_DEFAULTS.size,
  ratio = THUMBNAIL_DEFAULTS.ratio,
  radius,
  density = THUMBNAIL_DEFAULTS.density,
  ...rest
}: WebThumbnailProps) {
  return (
    <Image
      width={size}
      ratio={ratio}
      radius={radius ?? THUMBNAIL_DEFAULTS.radius}
      density={density}
      {...rest}
    />
  );
}

/**
 * `Image` shadows the browser's native constructor: a top-level `const { Image } = …` binding
 * breaks `new Image()` for every script on the page, silently and globally. `ImageFrame` is the
 * same component under a name that can't collide — PREFER IT.
 */
export const ImageFrame = Image;
