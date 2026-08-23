import { useEffect, useState } from 'react';
import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import type { TimeString } from './TimeField.types';
import {
  formatTime,
  outsideWindow,
  parseTime,
  refusalFor,
  shapeRefusalFor,
  showTime,
} from './time-parse';

/** What a typed draft turns out to be. Split out so the refusal rule has one shape, not three. */
type Verdict =
  | { kind: 'empty' }
  | { kind: 'shape'; raw: string }
  | { kind: 'outside'; minutes: number }
  | { kind: 'ok'; minutes: number };

function judge(raw: string, minMinutes: number | null, maxMinutes: number | null): Verdict {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { kind: 'empty' };
  }
  const minutes = parseTime(trimmed);
  if (minutes === null) {
    return { kind: 'shape', raw: trimmed };
  }
  return outsideWindow(minutes, minMinutes, maxMinutes)
    ? { kind: 'outside', minutes }
    : { kind: 'ok', minutes };
}

export interface TimeEntryOptions {
  /**
   * The active market's format, from `useFormat()`. The draft, the presets and every refusal are
   * spelled in the pack's clock; the prop, the commit and the bounds stay canonical 24-hour.
   */
  format?: MarketFormat;
  max?: TimeString;
  min?: TimeString;
  onCommit?: (value: TimeString) => void;
  /** The shape named in the unparseable refusal — "HH:MM", or "h:mm AM" in a 12-hour market. */
  placeholder: string;
  refusalMessage?: string;
  value: TimeString;
  windowName?: string;
}

export interface TimeEntry {
  /** Focus left the box: commit what is there. */
  blur: () => void;
  /** Escape: throw the draft away, keep the value. */
  cancel: () => void;
  draft: string;
  focus: boolean;
  /** Focus arrived: a refusal is this component's own act and clears the moment you return. */
  focusOn: () => void;
  /** The thumb path. A preset outside the window is refused exactly like a typed time. */
  pick: (candidate: TimeString) => void;
  refused: string | null;
  setDraft: (next: string) => void;
  /** Enter: commit without leaving the box. */
  submit: () => void;
}

/**
 * Commit-once time entry: the draft, the focus flag and the REFUSAL, in one declaration both
 * platform halves read. A time outside the window restores the last good value and states the
 * permitted hours — it is never clamped, because a calling window is a compliance boundary and
 * silently turning 21:00 into 19:00 hands an EPC a window they never chose.
 */
export function useTimeEntry(options: TimeEntryOptions): TimeEntry {
  const {
    format = IN_FORMAT,
    max,
    min,
    onCommit,
    placeholder,
    refusalMessage,
    value,
    windowName,
  } = options;
  const [draft, setDraft] = useState(() => showTime(value, format));
  const [focus, setFocus] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);
  const minMinutes = min === undefined ? null : parseTime(min);
  const maxMinutes = max === undefined ? null : parseTime(max);

  /* The market is a dependency, not a constant: a pack swapped under a mounted field must respell
     the draft it is showing, or the box keeps the previous market's clock. */
  useEffect(() => {
    if (!focus) {
      setDraft(showTime(value, format));
    }
  }, [value, focus, format]);

  const refuse = (minutes: number) =>
    setRefused(refusalMessage ?? refusalFor(minutes, minMinutes, maxMinutes, windowName, format));

  const restore = () => setDraft(showTime(value, format));

  const accept = (minutes: number) => {
    setRefused(null);
    const next = formatTime(minutes);
    if (next !== value && onCommit !== undefined) {
      onCommit(next);
      return;
    }
    setDraft(showTime(next, format));
  };

  const submit = () => {
    const verdict = judge(draft, minMinutes, maxMinutes);
    if (verdict.kind === 'ok') {
      accept(verdict.minutes);
      return;
    }
    restore();
    if (verdict.kind === 'shape') {
      setRefused(shapeRefusalFor(verdict.raw, placeholder, format));
    } else if (verdict.kind === 'outside') {
      refuse(verdict.minutes);
    } else {
      setRefused(null);
    }
  };

  const pick = (candidate: TimeString) => {
    const verdict = judge(candidate, minMinutes, maxMinutes);
    if (verdict.kind === 'ok') {
      setRefused(null);
      setDraft(showTime(formatTime(verdict.minutes), format));
      onCommit?.(formatTime(verdict.minutes));
    } else if (verdict.kind === 'outside') {
      refuse(verdict.minutes);
    }
  };

  return {
    blur: () => {
      setFocus(false);
      submit();
    },
    cancel: () => {
      restore();
      setRefused(null);
    },
    draft,
    focus,
    focusOn: () => {
      setFocus(true);
      setRefused(null);
    },
    pick,
    refused,
    setDraft,
    submit,
  };
}
