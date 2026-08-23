import { Fragment } from 'react';
import type { ImageMetaFacts } from './Image.logic';
import { imageMetaParts } from './Image.logic';

export interface ImageCaptionProps extends ImageMetaFacts {
  caption?: string;
}

/**
 * The words under the frame: the caption, then the credit / meta / reference / age line, joined
 * by dots that are decoration and are hidden from a screen reader. Nothing renders when there is
 * nothing to say.
 */
export function ImageCaption({ caption, ...facts }: ImageCaptionProps) {
  const parts = imageMetaParts(facts);
  if (!caption && parts.length === 0) return null;
  return (
    <figcaption className="hg-image-caption">
      {caption ? <div className="hg-image-caption-text">{caption}</div> : null}
      <div className="hg-image-meta" data-after-caption={caption ? 'true' : undefined}>
        {parts.map((part, i) => (
          <Fragment key={part.key}>
            <span>{part.text}</span>
            {i < parts.length - 1 ? <span aria-hidden="true">·</span> : null}
          </Fragment>
        ))}
      </div>
    </figcaption>
  );
}
