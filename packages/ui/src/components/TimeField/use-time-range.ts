import type { TranslatedText } from '@heliogrid/contracts';
import { useState } from 'react';
import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import type { TimeRangeFieldWords, TimeString } from './TimeField.types';
import { formatTime, normaliseTime, parseTime, showTime } from './time-parse';

export interface TimeRangeOptions {
  /** The active market's format, from `useFormat()`. Both sentences are spelled in its clock. */
  format?: MarketFormat;
  from: TimeString;
  max?: TimeString;
  min?: TimeString;
  onCommit?: (value: { from: TimeString; to: TimeString }) => void;
  to: TimeString;
  windowName?: TranslatedText;
  words: Pick<TimeRangeFieldWords, 'endBeforeStart' | 'permitted'>;
}

export interface TimeRange {
  /** The default line under an unerrored pair — the statutory hours, or null when unbounded. */
  boundSentence: TranslatedText | null;
  /** The pair's own refusal: an end at or before its start, rather than a silent reorder. */
  orderError: TranslatedText | null;
  set: (which: 'from' | 'to', next: TimeString) => void;
}

/** The pair's rule, in one declaration both platform halves read. */
export function useTimeRange(options: TimeRangeOptions): TimeRange {
  const { format = IN_FORMAT, from, max, min, onCommit, to, windowName, words } = options;
  const [orderError, setOrderError] = useState<TranslatedText | null>(null);

  const set = (which: 'from' | 'to', next: TimeString) => {
    const pair = which === 'from' ? { from: next, to } : { from, to: next };
    const start = parseTime(pair.from);
    const end = parseTime(pair.to);
    if (start !== null && end !== null && start >= end) {
      setOrderError(
        words.endBeforeStart({
          from: showTime(formatTime(start), format),
          to: showTime(formatTime(end), format),
        }),
      );
      return;
    }
    setOrderError(null);
    onCommit?.(pair);
  };

  const lower = min === undefined ? null : normaliseTime(min);
  const upper = max === undefined ? null : normaliseTime(max);
  const boundSentence =
    lower === null || upper === null
      ? null
      : words.permitted({
          from: showTime(lower, format),
          to: showTime(upper, format),
          ...(windowName === undefined ? {} : { window: windowName }),
        });

  return { boundSentence, orderError, set };
}
