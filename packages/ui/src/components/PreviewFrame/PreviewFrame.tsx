import type { CSSProperties } from 'react';
import { Children, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import type { PreviewFrameGroupProps, PreviewFrameProps } from './PreviewFrame.types';
import { DEFAULT_DESIGN_WIDTH, DEFAULT_MIN_SCALE } from './PreviewFrame.types';
import { previewGeometry } from './preview-geometry';
import { useDetunedSubject, useOwnWidth } from './preview-hooks';

/** Per-instance geometry rides into PreviewFrame.css as custom properties. */
type CssVars = CSSProperties & Record<`--${string}`, string>;

interface WebPreviewFrameProps extends PreviewFrameProps {
  className?: string;
  style?: CSSProperties;
}

interface WebPreviewFrameGroupProps extends PreviewFrameGroupProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A FRAME THAT HOSTS SUBJECTS, not a preview per screen:
 *
 *   A preview is a framed, scaled, NON-INTERACTIVE window onto customer-facing output. The
 *   frame is this component. The subject is the real component that draws that output. A
 *   settings screen never draws a preview of its own.
 *
 * Non-interactive AND readable — deliberately not `inert`, which would take the subject out of
 * the accessibility tree, and on `SCR-M01-18` the preview is the thing being judged. The subject
 * is made unoperable instead: `pointer-events: none` for the pointer and `tabindex="-1"` on
 * every focusable inside for the keyboard. DO NOT PUT `inert` BACK.
 */
export function PreviewFrame({
  label,
  caption,
  note,
  designWidth = DEFAULT_DESIGN_WIDTH,
  designHeight,
  minScale = DEFAULT_MIN_SCALE,
  maxHeight,
  surface = 'sheet',
  action,
  children,
  className,
  style,
}: WebPreviewFrameProps) {
  const [ref, ownWidth] = useOwnWidth<HTMLElement>();
  const inner = useRef<HTMLDivElement | null>(null);
  useDetunedSubject(inner);

  const { scale, cropped, boxHeight } = previewGeometry(
    ownWidth,
    designWidth,
    designHeight,
    minScale,
    maxHeight,
  );

  const vars: CssVars = {
    '--hg-preview-design-width': `${designWidth}px`,
    '--hg-preview-scale': `${scale}`,
    ...(designHeight === undefined ? {} : { '--hg-preview-design-height': `${designHeight}px` }),
    ...(boxHeight === null ? {} : { '--hg-preview-box-height': `${boxHeight}px` }),
    ...style,
  };

  return (
    <figure ref={ref} className={classNames('hg-preview-frame', className)} style={vars}>
      {label === undefined ? null : (
        <Text as="span" variant="overline" color="tertiary">
          {label}
        </Text>
      )}
      <div className="hg-preview-frame-window" data-surface={surface}>
        {/* aria-live="off": the subject redraws as the settings change; announcing every
            redraw would flood a screen reader that is reading the preview on purpose. */}
        <div ref={inner} aria-live="off" className="hg-preview-frame-subject">
          {children}
        </div>
      </div>
      {caption === undefined && note === undefined && !cropped && !action ? null : (
        <figcaption className="hg-preview-frame-caption">
          <span className="hg-preview-frame-words">
            {caption}
            {cropped ? (
              <span className="hg-preview-frame-line">
                Showing the top left, at a size you can read.
              </span>
            ) : null}
            {note === undefined ? null : (
              <span className="hg-preview-frame-line hg-preview-frame-note">{note}</span>
            )}
          </span>
          {action ? <span className="hg-preview-frame-action">{action}</span> : null}
        </figcaption>
      )}
    </figure>
  );
}

/** Two subjects, one state — `SCR-M01-18`'s document and page side by side, stacking on a phone. */
export function PreviewFrameGroup({
  children,
  stackBelow = 560,
  gap = 20,
  className,
  style,
}: WebPreviewFrameGroupProps) {
  const [ref, ownWidth] = useOwnWidth<HTMLDivElement>();
  const stacked = ownWidth !== null && ownWidth < stackBelow;
  const vars: CssVars = {
    '--hg-preview-group-gap': `${gap}px`,
    '--hg-preview-group-columns': stacked ? '1' : `${Children.count(children)}`,
    ...style,
  };
  return (
    <div ref={ref} className={classNames('hg-preview-frame-group', className)} style={vars}>
      {children}
    </div>
  );
}

PreviewFrame.Group = PreviewFrameGroup;
