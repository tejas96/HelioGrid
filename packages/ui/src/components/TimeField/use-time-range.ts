import { useState } from 'react';
import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import type { TimeString } from './TimeField.types';
import { formatTime, normaliseTime, parseTime, showTime } from './time-parse';

export interface TimeRangeOptions {
  /** The active market's format, from `useFormat()`. Both sentences are spelled in its clock. */
  format?: MarketFormat;
  from: TimeString;
  max?: TimeString;
  min?: TimeString;
  onCommit?: (value: { from: TimeString; to: TimeString }) => void;
  to: TimeString;
  windowName?: string;
}

export interface TimeRange {
  /** The default line under an unerrored pair — the statutory hours, or null when unbounded. */
  boundSentence: string | null;
  /** The pair's own refusal: an end at or before its start, rather than a silent reorder. */
  orderError: string | null;
  set: (which: 'from' | 'to', next: TimeString) => void;
}

/** The pair's rule, in one declaration both platform halves read. */
export function useTimeRange(options: TimeRangeOptions): TimeRange {
  const { format = IN_FORMAT, from, max, min, onCommit, to, windowName } = options;
  const [orderError, setOrderError] = useState<string | null>(null);

  const set = (which: 'from' | 'to', next: TimeString) => {
    const pair = which === 'from' ? { from: next, to } : { from, to: next };
    const start = parseTime(pair.from);
    const end = parseTime(pair.to);
    if (start !== null && end !== null && start >= end) {
      const a = showTime(formatTime(start), format);
      const b = showTime(formatTime(end), format);
      setOrderError(`The window has to end after it starts — ${a} to ${b} is not a window.`);
      return;
    }
    setOrderError(null);
    onCommit?.(pair);
  };

  const lower = min === undefined ? null : normaliseTime(min);
  const upper = max === undefined ? null : normaliseTime(max);
  let boundSentence: string | null = null;
  if (lower !== null && upper !== null) {
    const named = windowName === undefined ? '' : `${windowName}: `;
    const span = `${showTime(lower, format)}–${showTime(upper, format)}`;
    boundSentence = `${named}calls are permitted ${span} only.`;
  }

  return { boundSentence, orderError, set };
}
