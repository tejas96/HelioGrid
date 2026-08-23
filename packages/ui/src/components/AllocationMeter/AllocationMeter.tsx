import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import type { AllocationModel } from './AllocationMeter.model';
import { allocationModel, formatAllocation, partValue } from './AllocationMeter.model';
import type {
  AllocationMeterProps,
  AllocationPart,
  AllocationState,
} from './AllocationMeter.types';

interface WebAllocationMeterProps extends AllocationMeterProps {
  className?: string;
  style?: CSSProperties;
}

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
        viewBox={met ? '0 0 12 12' : '0 0 24 24'}
        fill="none"
        stroke="currentColor"
        strokeWidth={met ? '2.4' : '3'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={met ? 'M2.5 6.5 5 9l4.5-5' : 'M12 6v12M6 12h12'} />
      </svg>
    </span>
  );
}

function Head({
  label,
  sum,
  target,
  unit,
}: {
  label?: string;
  sum: number | null;
  target: number;
  unit: string;
}) {
  return (
    <div className="hg-allocation-head">
      <span className="hg-allocation-label">{label}</span>
      {sum === null ? null : (
        <span className="hg-allocation-figure">
          {`${formatAllocation(sum)}${unit} `}
          <span className="hg-allocation-denominator">
            {`of ${formatAllocation(target)}${unit}`}
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
          'aria-valuemax': Math.max(target, model.sum),
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
        <li key={`${part.label ?? ''}-${partValue(part)}`}>
          <span aria-hidden="true" className="hg-allocation-swatch" />
          {part.label}
          <span className="hg-allocation-legend-value">
            {`${formatAllocation(partValue(part))}${unit}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Note({ words }: { words: ReactNode }) {
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
    remainderWords,
    enforcementNote,
    unresolvedNote = 'Nothing allocated yet.',
    note,
    showLegend = false,
    density = 'expressive',
    className,
    style,
  } = props;
  const model = allocationModel(props);
  const words = remainderWords ?? model.remainder ?? unresolvedNote;
  const state = model.resolved ? model.state : 'under';
  const valueText =
    model.sum === null
      ? undefined
      : `${formatAllocation(model.sum)}${unit} of ${formatAllocation(target)}${unit} — ${typeof words === 'string' ? words : ''}`;

  return (
    <section
      className={classNames('hg-allocation-meter', className)}
      aria-label={label === undefined ? 'Allocation' : `${label} allocation`}
      style={style}
    >
      <Head label={label} sum={model.sum} target={target} unit={unit} />
      <Note words={targetLabel} />
      <Track model={model} target={target} density={density} valueText={valueText} />
      <p className="hg-allocation-words" data-state={state}>
        <Mark state={state} />
        <span>{words}</span>
      </p>
      {showLegend && model.parts.length > 0 ? <Legend parts={model.parts} unit={unit} /> : null}
      <Note words={enforcementNote ?? model.enforcement} />
      <Note words={note} />
    </section>
  );
}
