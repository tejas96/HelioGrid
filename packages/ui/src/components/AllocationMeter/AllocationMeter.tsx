import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { AllocationModel } from './AllocationMeter.model';
import {
  allocationFigure,
  allocationModel,
  allocationSentences,
  drawnState,
  legendKey,
  meterTop,
  partValue,
} from './AllocationMeter.model';
import type {
  AllocationMeterProps,
  AllocationMeterWords,
  AllocationPart,
  AllocationState,
} from './AllocationMeter.types';
import { AllocationSplit } from './AllocationSplit';

type WebAllocationMeterProps = AllocationMeterProps & {
  className?: string;
  style?: CSSProperties;
};

/* The state's second channel: a tick for met, a plus for over, a hollow ring for under. The OVER
   mark takes --warning-text — plain --warning measures 2.17:1 on white and could not be seen. */
function Mark({ state }: { state: AllocationState }) {
  if (state === 'under') {
    return <span aria-hidden="true" className="hg-allocation-mark" data-state="under" />;
  }
  const met = state === 'met';
  return (
    <span aria-hidden="true" className="hg-allocation-mark" data-state={state}>
      <svg
        aria-hidden="true"
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={met ? '4.8' : '3'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={met ? 'tick-small' : 'plus-small'} />
      </svg>
    </span>
  );
}

function Head({
  label,
  sum,
  target,
  unit,
  words,
}: {
  label?: TranslatedText;
  sum: number | null;
  target: number;
  unit: string;
  words: AllocationMeterWords;
}) {
  return (
    <div className="hg-allocation-head">
      <span className="hg-allocation-label">{label}</span>
      {sum === null ? null : (
        <span className="hg-allocation-figure">
          {`${allocationFigure(sum, unit)} `}
          <span className="hg-allocation-denominator">
            {words.ofTarget(allocationFigure(target, unit))}
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * The track scales to max(allocated, target), so an over-allocation has somewhere to go and the
 * target line moves left to meet it. A clamped bar would draw 118% as "done".
 */
function Track({
  model,
  target,
  density,
  valueText,
}: {
  model: AllocationModel;
  target: number;
  density: 'expressive' | 'functional';
  valueText?: string;
}) {
  const meter =
    model.sum === null
      ? {}
      : {
          role: 'meter',
          'aria-valuenow': model.sum,
          'aria-valuemin': 0,
          'aria-valuemax': meterTop(target, model.sum),
          'aria-valuetext': valueText,
        };
  return (
    <div className="hg-allocation-track" data-density={density} {...meter}>
      {model.spans.map((span) => (
        <span
          key={span.key}
          className="hg-allocation-span"
          data-over={span.over ? 'true' : undefined}
          title={span.label}
          style={{ width: `${span.width}%` }}
        />
      ))}
      {/* The target line, drawn only when something has passed it — before that it IS the edge. */}
      {model.state === 'over' ? (
        <span
          aria-hidden="true"
          className="hg-allocation-tick"
          style={{ left: `calc(${model.tickAt}% - 1px)` }}
        />
      ) : null}
    </div>
  );
}

/** Names each segment beside the bar. Off by default: at 375px the bar and the words come first. */
function Legend({ parts, unit }: { parts: AllocationPart[]; unit: string }) {
  return (
    <ul className="hg-allocation-legend">
      {parts.map((part) => (
        <li key={legendKey(part)}>
          <span aria-hidden="true" className="hg-allocation-swatch" />
          {part.label}
          <span className="hg-allocation-legend-value">
            {allocationFigure(partValue(part), unit)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Note({ words }: { words: TranslatedText | null | undefined }) {
  return words === null || words === undefined ? null : (
    <p className="hg-allocation-note">{words}</p>
  );
}

/** An allocation against an exact target, with the shortfall or the excess stated in words. */
export function AllocationMeter(props: WebAllocationMeterProps) {
  const {
    label,
    target = 100,
    unit = '%',
    targetLabel,
    note,
    showLegend = false,
    density = 'expressive',
    className,
    style,
  } = props;
  const model = allocationModel(props);
  if (props.variant === 'split') {
    return (
      <AllocationSplit
        label={label}
        parts={model.parts}
        unit={unit}
        density={density}
        className={className}
        style={style}
      />
    );
  }
  const said = allocationSentences(model, props.words, props);
  const state = drawnState(model);

  return (
    <section
      className={classNames('hg-allocation-meter', className)}
      aria-label={props.words.name(label)}
      style={style}
    >
      <Head label={label} sum={model.sum} target={target} unit={unit} words={props.words} />
      <Note words={targetLabel} />
      <Track model={model} target={target} density={density} valueText={said.figure} />
      <p className="hg-allocation-words" data-state={state}>
        <Mark state={state} />
        <span>{said.remainder}</span>
      </p>
      {showLegend && model.parts.length > 0 ? <Legend parts={model.parts} unit={unit} /> : null}
      <Note words={said.enforcement} />
      <Note words={note} />
    </section>
  );
}
