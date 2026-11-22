'use client';
import type { MeasurementSystem, ScaleBar, StudioView } from '@heliogrid/domain';
import { useFormat } from '@heliogrid/ui';
import { type Ref, useEffect, useImperativeHandle, useRef } from 'react';
import type { StudioMarks } from './StudioCameraRig';

/** The longest the scale bar is drawn, in screen pixels. */
const BAR_MAX_PX = 96;

/** What the camera hands the marks each time it moves. */
export interface StudioMapMarksHandle {
  show(marks: StudioMarks): void;
}

/**
 * The map's scale bar in a corner: the longest round length that fits, in the reader's metres or
 * feet. It shows only in the flat views, where one length holds across the whole window (the
 * compass is `StudioCompass`). The camera moves it each frame by writing to it directly, never
 * through a render.
 */
export function StudioMapMarks({
  handle,
  view,
  units,
  scaleBar,
  off,
}: {
  handle: Ref<StudioMapMarksHandle>;
  view: StudioView;
  units: MeasurementSystem;
  /** The scale bar for the ground one screen pixel covers, in the reader's units. */
  scaleBar: (metresPerPixel: number, maxPixels: number) => ScaleBar | null;
  /** Put away by focus mode: on a phone while a length is set, the slider takes the low screen. */
  off: boolean;
}) {
  const format = useFormat();
  const bar = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  /** The camera's last word: the marks draw again from it when the units or the view change. */
  const last = useRef<StudioMarks | null>(null);
  const draw = (marks: StudioMarks) => {
    last.current = marks;
    const scale = scaleBar(marks.metresPerPixel, BAR_MAX_PX);
    if (bar.current === null || label.current === null) return;
    bar.current.dataset.hidden = String(scale === null);
    if (scale === null) return;
    bar.current.style.inlineSize = `${scale.pixels}px`;
    if (shown.current === scale.metres) return;
    shown.current = scale.metres;
    label.current.textContent = format.length(scale.metres, units);
  };
  useImperativeHandle(handle, () => ({ show: draw }));
  const flat = view === 'top';
  // After each render — metres or feet picked, the bar shown again — the marks draw from the camera's
  // last word, whatever the camera does next.
  useEffect(() => {
    shown.current = null;
    if (last.current !== null) draw(last.current);
  });
  if (!flat) return null;
  return (
    <div className="hg-studio-glass hg-studio-marks" data-off={off} aria-hidden>
      <span className="hg-studio-scale">
        <span ref={label} className="hg-studio-scale-words" />
        <span ref={bar} className="hg-studio-scale-bar" />
      </span>
    </div>
  );
}
