import { useEffect, useState } from 'react';
import { initialView, iso, monthAfter, monthStart, parse } from './calendar-grid';
import type { CalendarProps } from './DatePicker.types';

export interface CalendarMonth {
  /** The first day of the month on screen. */
  view: Date;
  /** A `month` with no `onMonthChange`: the view cannot move, so no month arrows are drawn. */
  pinned: boolean;
  /** Move the view a month back or on — the caller's to hold when it owns the month. */
  stepMonth: (by: -1 | 1) => void;
}

/** The month on screen: the caller's when it passes `month`, the calendar's own otherwise. */
export function useCalendarMonth({
  value,
  month,
  onMonthChange,
}: Pick<CalendarProps, 'value' | 'month' | 'onMonthChange'>): CalendarMonth {
  const [innerMonth, setInnerMonth] = useState(() => initialView(value));
  const controlled = parse(month);
  const view = controlled === null ? innerMonth : monthStart(controlled);

  /* A `month` WITH NO `onMonthChange` IS A PINNED VIEW, AND A PINNED VIEW DRAWS NO MONTH ARROWS:
     `view` reads `month` while `stepMonth` writes `innerMonth`, so the two 44px arrows would move
     nothing. Either own the month or don't pass it. */
  const pinned = month !== undefined && onMonthChange === undefined;
  useEffect(() => {
    if (pinned) {
      console.warn(
        'Calendar: `month` was passed without `onMonthChange`, so the view is pinned and the month arrows are not drawn. Hold the month in state and pass both, or pass neither.',
      );
    }
  }, [pinned]);

  const stepMonth = (by: -1 | 1) => {
    const next = monthAfter(view, by);
    if (onMonthChange === undefined) {
      setInnerMonth(next);
      return;
    }
    onMonthChange(iso(next));
  };

  return { view, pinned, stepMonth };
}
