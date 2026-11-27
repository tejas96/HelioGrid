import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFocusRequest } from '../../primitives/use-focus-request';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { renderProvenance } from '../Provenance';
import type { SliderProps } from './Slider.types';
import {
  clampToRange,
  fillPercent,
  formatValue,
  markPercent,
  nudged,
  stepperOff,
  tickNudged,
  ticksOnTrack,
} from './slider-math';
import { useHeldValue } from './use-held-value';

interface WebSliderProps extends SliderProps {
  className?: string;
  style?: CSSProperties;
}

interface StepButtonProps {
  disabled: boolean;
  glyph: ShellGlyphName;
  label: TranslatedText;
  onPress: () => void;
}

/** A 44px minus/plus either side of the track. */
function StepButton({ disabled, glyph, label, onPress }: StepButtonProps) {
  return (
    <button
      className="hg-slider-step"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
    >
      <ShellGlyph name={glyph} size="sm" tone="current" />
    </button>
  );
}

/**
 * Slider with stepper buttons. The step-wide law (MS3-27): a drag reports live via `onInput` and
 * commits exactly once via `onCommit`, so one drag is one undo entry. A component with a single
 * callback forces every studio screen to invent its own debounce, and they diverge.
 */
export function Slider({
  value = 0,
  onInput,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  label,
  labelSpokenOnly = false,
  unit,
  hint,
  words,
  mark,
  ticks,
  format,
  steppers = true,
  disabled = false,
  focusRequest,
  provenance,
  density = 'expressive',
  id,
  className,
  style,
}: WebSliderProps) {
  const range = useRef<HTMLInputElement>(null);
  useFocusRequest(range, focusRequest);
  const autoId = useId();
  const sid = id ?? autoId;
  const held = useHeldValue(value);
  const percent = fillPercent(held.shown, min, max);
  const marked = markPercent(mark, min, max);
  const shown = formatValue(held.shown, unit, format);

  const live = (next: number) => {
    held.hold(next);
    onInput?.(clampToRange(next, min, max, step));
  };
  const commit = (next: number) => {
    held.let();
    onCommit?.(clampToRange(next, min, max, step));
  };
  const stepped = (direction: -1 | 1) =>
    ticks === undefined || ticks.length === 0
      ? nudged(value, direction, min, max, step)
      : tickNudged(value, direction, ticks, step);
  const nudge = (direction: -1 | 1) => {
    const next = stepped(direction);
    if (next === null) return;
    live(next);
    commit(next);
  };
  const off = (direction: -1 | 1) =>
    stepperOff(direction, value, min, max, disabled) || stepped(direction) === null;
  const onTrack = ticksOnTrack(ticks, min, max);
  const named = onTrack.filter(({ tick }) => tick.label !== undefined);
  /* A props object or a bare tier — `Provenance`'s own resolver decides, at the
     12px type floor. `"unmarked"` comes back null and the slot collapses. */
  const provenanceNode = renderProvenance(provenance, { size: 12 });

  return (
    <div className={classNames('hg-slider', className)} style={style}>
      {labelSpokenOnly ? (
        <label className="hg-spoken-only" htmlFor={sid}>
          {label}
        </label>
      ) : label !== undefined || unit !== undefined || hint !== undefined ? (
        <div className="hg-slider-head" data-density={density}>
          <label className="hg-slider-label" htmlFor={sid}>
            {label}
          </label>
          <span className="hg-slider-value" data-disabled={disabled}>
            {shown}
          </span>
        </div>
      ) : null}
      <div className="hg-slider-row">
        {steppers ? (
          <StepButton
            disabled={off(-1)}
            glyph="minus"
            label={words.decrease(label)}
            onPress={() => nudge(-1)}
          />
        ) : null}
        <div className="hg-slider-track">
          {/* The unfilled rail carries --track-edge: an OUTSET hairline in field mode, `none`
              otherwise. Not the inset --control-edge — on 6px that reads as a filled track. */}
          <span className="hg-slider-rail" aria-hidden="true" />
          <span
            className="hg-slider-fill"
            aria-hidden="true"
            data-disabled={disabled}
            style={{ width: `${percent}%` }}
          />
          {marked === null ? null : (
            <span className="hg-slider-mark" aria-hidden="true" style={{ left: `${marked}%` }} />
          )}
          {onTrack.map(({ tick, percent: at }) => (
            <span
              key={tick.value}
              className="hg-slider-tick"
              aria-hidden="true"
              style={{ left: `${at}%` }}
            />
          ))}
          <input
            ref={range}
            className="hg-slider-range"
            id={sid}
            type="range"
            min={min}
            max={max}
            step={step}
            value={held.shown}
            disabled={disabled}
            aria-valuetext={shown}
            onChange={(event) => live(Number(event.target.value))}
            onPointerUp={(event) => commit(Number(event.currentTarget.value))}
            // A touch the browser took back (a scroll) saves nothing: the given value shows again,
            // and a caller that showed a held value live is handed the given one back — only when
            // it moved, so a caller that saves live is never sent the value it already has.
            onPointerCancel={() => {
              const was = held.shown;
              held.let();
              if (was !== value) onInput?.(value);
            }}
            onKeyUp={(event) => commit(Number(event.currentTarget.value))}
            onBlur={(event) => commit(Number(event.currentTarget.value))}
          />
        </div>
        {steppers ? (
          <StepButton
            disabled={off(1)}
            glyph="plus"
            label={words.increase(label)}
            onPress={() => nudge(1)}
          />
        ) : null}
      </div>
      {named.length === 0 ? null : (
        <div className="hg-slider-ticks" data-steppers={steppers} aria-hidden="true">
          {named.map(({ tick, percent: at }) => (
            <span key={tick.value} className="hg-slider-tick-word" style={{ left: `${at}%` }}>
              {tick.label}
            </span>
          ))}
        </div>
      )}
      {provenanceNode === null ? null : (
        <div className="hg-slider-provenance">{provenanceNode}</div>
      )}
      {hint !== undefined ? <p className="hg-slider-hint">{hint}</p> : null}
    </div>
  );
}
