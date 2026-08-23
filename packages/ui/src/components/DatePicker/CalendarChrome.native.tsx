import { theme } from '@heliogrid/theme';
import { Text as RNText, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { DayMarker, DayMarkerTone } from './DatePicker.types';

const CELL = 44;
const GAP = 2;
/** Seven 44dp cells plus the six 2dp gaps — the same 320 the web grid takes as its min-width. */
export const GRID_WIDTH = CELL * 7 + GAP * 6;

/* A marker's label is read out with the date, so the tone is never the only channel. --warning is
   not a legal mark anywhere in this system; a leave dot takes --warning-text. */
const MARKER_TONE: Record<DayMarkerTone, string> = {
  present: theme.colors['success-text'],
  absent: theme.colors['danger-text'],
  leave: theme.colors['warning-text'],
  holiday: theme.colors['info-text'],
  scheduled: theme.colors.accent,
  neutral: theme.colors['text-tertiary'],
};

export const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing['sp-2'],
  },
  titlePinned: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, width: GRID_WIDTH },
  weekday: { width: CELL, height: theme.spacing['sp-6'], justifyContent: 'center' },
  blank: { width: CELL, height: CELL },
  empty: { paddingVertical: theme.spacing['sp-8'], paddingHorizontal: theme.spacing['sp-2'] },
  footer: { marginTop: theme.spacing['sp-3'] },
  nav: { width: CELL, height: CELL, borderRadius: theme.radius['r-pill'] },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: theme.radius['r-sm'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBetween: { borderRadius: 0, backgroundColor: theme.colors['accent-subtle'] },
  cellSelected: {
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  /* RN cannot inset a ring, so today's outline is a border of the same 1.5px and colour. */
  cellToday: { borderWidth: 1.5, borderColor: theme.colors['canvas-sunken'] },
  numeral: {
    fontFamily: theme.type.families.sans,
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors['text-primary'],
  },
  numeralStrong: { fontWeight: '700' },
  numeralSelected: { color: theme.colors['text-inverse'] },
  numeralDisabled: { color: theme.colors['text-disabled'] },
  lockBar: {
    position: 'absolute',
    bottom: theme.spacing['sp-1'],
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: theme.colors['text-tertiary'],
  },
  marker: { position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: 2.5 },
  onSelected: { backgroundColor: theme.colors['text-inverse'] },
});

interface CalendarNavProps {
  dir: -1 | 1;
  label: string;
  onPress: () => void;
}

/** A month arrow. The Pressable primitive owns the 44dp target. */
export function CalendarNav({ dir, label, onPress }: CalendarNavProps) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={styles.nav}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d={dir < 0 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}
          stroke={theme.colors['text-secondary']}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

interface CalendarCellProps {
  date: Date;
  selected: boolean;
  between: boolean;
  disabled: boolean;
  locked: boolean;
  today: boolean;
  marker: DayMarker | undefined;
  spokenDate: string;
  onPick: (d: Date) => void;
}

/** The whole fact in the accessible name — a marker's label is read out with its date. */
function cellName(spokenDate: string, marker: DayMarker | undefined, locked: boolean): string {
  const markerSuffix = marker === undefined ? '' : `, ${marker.label ?? marker.tone ?? ''}`;
  const lockedSuffix = locked ? ', supplied by the market pack, cannot be removed' : '';
  return `${spokenDate}${markerSuffix}${lockedSuffix}`;
}

interface CellMarkProps {
  marker: DayMarker | undefined;
  locked: boolean;
  selected: boolean;
}

/**
 * A locked set member's second channel is a BAR, not a tone and not a tooltip; the origin itself is
 * persistent content in the list beside the grid (DateSet). A display marker is a dot, and its label
 * already rides in the cell's accessible name, so the tone is never the only channel.
 */
function CellMark({ marker, locked, selected }: CellMarkProps) {
  if (locked) {
    return <View style={[styles.lockBar, selected ? styles.onSelected : undefined]} />;
  }
  if (marker === undefined) {
    return null;
  }
  return (
    <View
      style={[
        styles.marker,
        { backgroundColor: MARKER_TONE[marker.tone ?? 'neutral'] },
        selected ? styles.onSelected : undefined,
      ]}
    />
  );
}

/**
 * One day. A locked cell stays pressable and hands the attempt to `onBlocked` — RN keeps it in the
 * accessibility tree, so the refusal is reachable by the person who needs to hear it.
 */
export function CalendarCell({
  date,
  selected,
  between,
  disabled,
  locked,
  today,
  marker,
  spokenDate,
  onPick,
}: CalendarCellProps) {
  const shell = [
    styles.cell,
    between ? styles.cellBetween : undefined,
    today && !selected ? styles.cellToday : undefined,
    selected ? styles.cellSelected : undefined,
  ];
  const numeral = [
    styles.numeral,
    selected || today ? styles.numeralStrong : undefined,
    selected ? styles.numeralSelected : undefined,
    disabled ? styles.numeralDisabled : undefined,
  ];
  return (
    /* The web half puts `role="gridcell"` on the button itself — which is the DS's own spelling and
       the reason that file carries an ARIA-redundancy waiver. RN has no elements to carry it and
       the Pressable primitive's vocabulary is interactive roles only, so the cell is the View and
       the button lives inside it. Same word, correctly nested. */
    <View role="cell">
      <Pressable
        accessibilityLabel={cellName(spokenDate, marker, locked)}
        /* WHICH DATE IS CHOSEN, said rather than tinted (F7-12) — the web's `aria-pressed`. And a
           LOCKED date announces off while staying pressable, so the refusal it hands to `onBlocked`
           is reachable: the web's `aria-disabled={locked}`, which is deliberately not the `disabled`
           prop. An omitted member falls back to that prop inside the primitive. */
        accessibilityState={{ selected, disabled: locked || undefined }}
        disabled={disabled}
        onPress={() => onPick(date)}
        style={shell}
      >
        <RNText style={numeral}>{date.getDate()}</RNText>
        <CellMark marker={marker} locked={locked} selected={selected} />
      </Pressable>
    </View>
  );
}
