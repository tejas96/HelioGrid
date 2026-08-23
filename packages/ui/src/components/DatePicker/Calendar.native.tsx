import { theme } from '@heliogrid/theme';
import { useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { CalendarCell, CalendarNav, GRID_WIDTH, styles } from './CalendarChrome.native';
import { iso, monthCells, monthStart, parse } from './calendar-grid';
import { inRange, isDisabledDate, isSelected, nextValue } from './calendar-selection';
import type { CalendarProps } from './DatePicker.types';

interface NativeCalendarProps extends CalendarProps {
  style?: StyleProp<ViewStyle>;
}

function initialView(value: CalendarProps['value']): Date {
  if (Array.isArray(value)) {
    return monthStart(parse(value[0]) ?? new Date());
  }
  if (value !== undefined && typeof value === 'object') {
    return monthStart(parse(value.from) ?? new Date());
  }
  return monthStart(parse(typeof value === 'string' ? value : null) ?? new Date());
}

const SKELETON_CELLS = 35;

const local = StyleSheet.create({
  frame: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-lg'],
    padding: theme.spacing['sp-4'],
  },
  frameFunctional: {
    borderRadius: theme.radius['rf-xl'],
    padding: theme.spacing['sp-3'],
  },
  skeletonCell: {
    width: 44,
    height: 44,
    borderRadius: theme.radius['r-sm'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
});

/**
 * Month grid, same market facts and same 44px cells as the web half. Two platform mappings:
 * the grid is a fixed 320dp — seven 44dp cells plus the 2dp gaps, which is exactly the web's
 * min-width — and the loading state is static rather than shimmering, since a looping animation on
 * a field device is the thing reduced-motion asks us to drop first.
 */
export function Calendar({
  value,
  onChange,
  mode = 'single',
  month,
  onMonthChange,
  min,
  max,
  markers = {},
  disabledDates = [],
  density = 'expressive',
  lockedDates = [],
  onBlocked,
  state = 'ready',
  emptyMessage,
  footer = null,
  style,
}: NativeCalendarProps) {
  const mkt = useFormat();
  const [innerMonth, setInnerMonth] = useState(() => initialView(value));
  const controlled = parse(month);
  const view = controlled === null ? innerMonth : monthStart(controlled);

  /* A `month` with no `onMonthChange` is a PINNED view, and a pinned view draws no arrows. */
  const pinned = month !== undefined && onMonthChange === undefined;
  useEffect(() => {
    if (pinned) {
      console.warn(
        'Calendar: `month` was passed without `onMonthChange`, so the view is pinned and the month arrows are not drawn. Hold the month in state and pass both, or pass neither.',
      );
    }
  }, [pinned]);

  const setView = (d: Date) => {
    if (onMonthChange === undefined) {
      setInnerMonth(d);
      return;
    }
    onMonthChange(iso(d));
  };

  const cells = monthCells(view, mkt.firstDayOfWeek);
  const narrowDays = mkt.weekdayNames('narrow');
  const longDays = mkt.weekdayNames('long');
  const todayIso = iso(new Date());

  const pick = (d: Date) => {
    if (isDisabledDate(d, min, max, disabledDates)) {
      return;
    }
    if (mode === 'set' && lockedDates.includes(iso(d))) {
      onBlocked?.(iso(d));
      return;
    }
    onChange?.(nextValue(mode, value, d));
  };

  return (
    <View
      style={[local.frame, density === 'functional' ? local.frameFunctional : undefined, style]}
    >
      <View style={styles.head}>
        {pinned ? null : (
          <CalendarNav
            dir={-1}
            label="Previous month"
            onPress={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          />
        )}
        {/* The month is re-read when the arrows move it — the web half's `aria-live="polite"` on
            this same heading. A pinned view has no arrows, so it has nothing to announce. */}
        <View
          accessibilityLiveRegion={pinned ? 'none' : 'polite'}
          style={pinned ? styles.titlePinned : undefined}
        >
          <Text variant="h4" align={pinned ? 'center' : undefined}>
            {mkt.monthYear(view)}
          </Text>
        </View>
        {pinned ? null : (
          <CalendarNav
            dir={1}
            label="Next month"
            onPress={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          />
        )}
      </View>

      {state === 'loading' ? (
        /* Web's skeleton grid is `role="status"`; RN has no such role, and `progressbar` would
           claim a position 35 blank cells cannot report. `accessible` here folds only those cells
           — no CalendarCell is rendered in this branch — so nothing focusable goes out of reach. */
        <View
          accessible
          accessibilityLabel="Loading"
          accessibilityLiveRegion="polite"
          style={styles.grid}
        >
          {Array.from({ length: SKELETON_CELLS }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells have no identity but their slot.
            <View key={`skeleton-${i}`} style={local.skeletonCell} />
          ))}
        </View>
      ) : state === 'empty' ? (
        <View style={styles.empty}>
          <Text variant="body-sm" color="secondary" align="center">
            {emptyMessage ?? 'No records for this month.'}
          </Text>
        </View>
      ) : (
        <>
          {/* The month's STRUCTURE is spelled out here the way the web half spells it — a header
              `row` of `columnheader`s over a `grid` of cells. RN has no table elements, so every
              one of those words has to be written; the cell itself is declared in
              CalendarChrome.native, beside the web half's own cell. */}
          <View role="row" style={[styles.grid, { width: GRID_WIDTH }]}>
            {/* The eye reads the narrow letter, the screen reader hears the whole weekday — the
                web half's `role="columnheader" aria-label={long}` over the same narrow glyph. */}
            {narrowDays.map((day, i) => (
              <View
                key={longDays[i] ?? day}
                role="columnheader"
                accessibilityLabel={longDays[i] ?? day}
                style={styles.weekday}
              >
                <Text variant="caption" color="tertiary" align="center">
                  {day}
                </Text>
              </View>
            ))}
          </View>
          <View role="grid" style={styles.grid}>
            {cells.map((d, i) =>
              d === null ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: a leading blank has no identity but its slot.
                <View key={`blank-${i}`} style={styles.blank} />
              ) : (
                <CalendarCell
                  key={iso(d)}
                  date={d}
                  selected={isSelected(mode, value, d)}
                  between={inRange(mode, value, d)}
                  disabled={isDisabledDate(d, min, max, disabledDates)}
                  locked={mode === 'set' && lockedDates.includes(iso(d))}
                  today={iso(d) === todayIso}
                  marker={markers[iso(d)]}
                  spokenDate={mkt.date(d)}
                  onPick={pick}
                />
              ),
            )}
          </View>
        </>
      )}
      {footer === null ? null : <View style={styles.footer}>{footer}</View>}
    </View>
  );
}
