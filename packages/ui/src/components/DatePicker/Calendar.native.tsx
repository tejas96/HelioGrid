import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { CalendarCell, CalendarNav, GRID_WIDTH, styles } from './CalendarChrome.native';
import { iso, monthGridOf, SKELETON_CELLS } from './calendar-grid';
import { dayPicker, dayStateOf } from './calendar-selection';
import type { CalendarProps } from './DatePicker.types';
import { useCalendarMonth } from './use-calendar-month';

interface NativeCalendarProps extends CalendarProps {
  style?: StyleProp<ViewStyle>;
}

const local = StyleSheet.create({
  frame: {
    // biome-ignore lint/plugin/raw-white: float — a menu, a list, a calendar, a toast, a bubble: white with its shadow (F7-15)
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
  words,
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
  const { view, pinned, stepMonth } = useCalendarMonth({ value, month, onMonthChange });
  const rules = { mode, value, min, max, disabledDates, lockedDates };

  const { cells, narrowDays, longDays, todayIso } = monthGridOf(view, mkt);

  const pick = dayPicker(rules, onChange, onBlocked);

  return (
    <View
      style={[local.frame, density === 'functional' ? local.frameFunctional : undefined, style]}
    >
      <View style={styles.head}>
        {pinned ? null : (
          <CalendarNav dir={-1} label={words.previousMonth} onPress={() => stepMonth(-1)} />
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
          <CalendarNav dir={1} label={words.nextMonth} onPress={() => stepMonth(1)} />
        )}
      </View>

      {state === 'loading' ? (
        /* Web's skeleton grid is `role="status"`; RN has no such role, and `progressbar` would
           claim a position 35 blank cells cannot report. `accessible` here folds only those cells
           — no CalendarCell is rendered in this branch — so nothing focusable goes out of reach. */
        <View
          accessible
          accessibilityLabel={words.loading}
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
            {emptyMessage ?? words.noRecords}
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
                  {...dayStateOf(rules, d, todayIso)}
                  marker={markers[iso(d)]}
                  spokenDate={mkt.date(d)}
                  onPick={pick}
                  words={words}
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
