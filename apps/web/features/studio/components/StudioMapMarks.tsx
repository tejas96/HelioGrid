'use client';
import type { MeasurementSystem, ScaleBar, StudioView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { ShellGlyph, useFormat } from '@heliogrid/ui';
import { type Ref, useEffect, useImperativeHandle, useRef } from 'react';
import type { StudioMarks } from './StudioCameraRig';

/** The longest the scale bar is drawn, in screen pixels. */
const BAR_MAX_PX = 96;

/** What the camera hands the marks each time it moves. */
export interface StudioMapMarksHandle {
  show(marks: StudioMarks): void;
}

/**
 * The map's two quiet marks in a corner: the north arrow, turned with the view, and the scale bar —
 * the longest round length that fits, in the reader's metres or feet. The bar shows only in the flat
 * views, where one length holds across the whole window. The camera moves them each frame by
 * writing to them directly, never through a render.
 */
export function StudioMapMarks({
  handle,
  view,
  units,
  scaleBar,
  words,
}: {
  handle: Ref<StudioMapMarksHandle>;
  view: StudioView;
  units: MeasurementSystem;
  /** The scale bar for the ground one screen pixel covers, in the reader's units. */
  scaleBar: (metresPerPixel: number, maxPixels: number) => ScaleBar | null;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const arrow = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  /** The camera's last word: the marks draw again from it when the units or the view change. */
  const last = useRef<StudioMarks | null>(null);
  const draw = (marks: StudioMarks) => {
    last.current = marks;
    if (arrow.current !== null) arrow.current.style.transform = `rotate(${marks.turn}rad)`;
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
  return (
    <div className="hg-studio-glass hg-studio-marks" aria-hidden>
      <span ref={arrow} className="hg-studio-north" title={words.north}>
        <ShellGlyph name="north" size="sm" tone="current" />
        <span className="hg-studio-north-letter">{words.northLetter}</span>
      </span>
      {flat ? (
        <span className="hg-studio-scale">
          <span ref={label} className="hg-studio-scale-words" />
          <span ref={bar} className="hg-studio-scale-bar" />
        </span>
      ) : null}
    </div>
  );
}
