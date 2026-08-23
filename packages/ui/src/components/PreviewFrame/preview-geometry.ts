export interface PreviewGeometry {
  /** The scale the subject is drawn at — `minScale` when the fitted scale falls below it. */
  scale: number;
  /** True when the frame refused to shrink further and cut the subject instead. */
  cropped: boolean;
  /** The window's height, or null when the subject has no natural height and no cap. */
  boxHeight: number | null;
}

/**
 * The frame's whole arithmetic, in one platform-neutral place: fit, floor, crop, and the window
 * the crop cuts against.
 *
 * A crop needs a WINDOW, or it is only a wider sheet with its right edge trimmed: scaling to
 * 0.82 inside a 343px frame makes the subject 394px wide, and with no height cap the sheet still
 * ran its full length. The window is the footprint a FITTED sheet would have had
 * (`designHeight × raw`), so the frame occupies the space it always would have and the enlarged
 * subject is cut at that boundary, anchored top-left — where a letterhead is. An explicit
 * `maxHeight` still wins.
 */
export function previewGeometry(
  ownWidth: number | null,
  designWidth: number,
  designHeight: number | undefined,
  minScale: number,
  maxHeight: number | undefined,
): PreviewGeometry {
  const raw = ownWidth === null ? 1 : Math.min(1, ownWidth / designWidth);
  const cropped = raw < minScale;
  const scale = cropped ? minScale : raw;
  const naturalHeight = designHeight === undefined ? null : designHeight * scale;
  const fittedHeight = designHeight === undefined || ownWidth === null ? null : designHeight * raw;
  let boxHeight: number | null;
  if (maxHeight !== undefined) {
    boxHeight = Math.min(maxHeight, naturalHeight ?? maxHeight);
  } else if (cropped && fittedHeight !== null) {
    boxHeight = fittedHeight;
  } else {
    boxHeight = naturalHeight;
  }
  return { scale, cropped, boxHeight };
}
