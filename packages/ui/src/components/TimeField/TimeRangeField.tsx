import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider/market-context';
import { TimeField } from './TimeField';
import type { TimeRangeFieldProps } from './TimeField.types';
import { TimeFieldMessage } from './TimeFieldMessage';
import { useTimeRange } from './use-time-range';

interface WebTimeRangeFieldProps extends TimeRangeFieldProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A start–end window — the calling window an EPC's voice agent may dial inside.
 *
 * Both ends refuse anything outside the market pack's statutory hours, and the pair itself refuses
 * an end at or before its start rather than reordering silently. ONE SENTENCE UNDER THE PAIR,
 * DESCRIBING BOTH BOXES: the ring is drawn on each half and the reason once, so `describedBy`
 * carries that one id into both `aria-describedby` attributes — a ring with `aria-invalid` and no
 * description is "invalid" with no why.
 */
export function TimeRangeField({
  from = '',
  to = '',
  onCommit,
  label,
  min,
  max,
  windowName,
  helper,
  error,
  disabled = false,
  density = 'expressive',
  className,
  style,
}: WebTimeRangeFieldProps) {
  const format = useFormat();
  const rangeId = useId();
  const msgId = `${rangeId}-msg`;
  const range = useTimeRange({ format, from, max, min, onCommit, to, windowName });
  const hasError = error !== undefined && error !== null && error !== false;
  const ringed = hasError || range.orderError !== null;
  const half = {
    density,
    disabled,
    max,
    min,
    windowName,
    invalid: ringed,
    className: 'hg-time-range-half',
    describedBy: ringed ? msgId : undefined,
  };

  return (
    <fieldset className={classNames('hg-time-range', className)} style={style}>
      {label !== undefined ? <legend className="hg-time-range-legend">{label}</legend> : null}
      <div className="hg-time-range-row">
        <TimeField
          {...half}
          label="From"
          value={from}
          onCommit={(next) => range.set('from', next)}
        />
        <TimeField {...half} label="To" value={to} onCommit={(next) => range.set('to', next)} />
      </div>
      {/* ONE MESSAGE COMPONENT, NOT TWO. This pair used to re-implement `TimeFieldMessage` inline
          for the sake of putting the id on the refusal branch — same precedence, same class, same
          `role="alert"`, spelled twice. The id now rides both danger branches of the shared
          component, so the announced refusal, the described error and the helper are decided in
          ONE place on this half, opposite the one file the native half already delegates to. */}
      <TimeFieldMessage
        errorId={msgId}
        error={error}
        helper={helper ?? range.boundSentence ?? undefined}
        refused={range.orderError}
      />
    </fieldset>
  );
}
