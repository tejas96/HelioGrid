import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { Calendar } from './Calendar.native';
import { asRange, asSet, parse } from './calendar-grid';
import type { CalendarValue, DatePickerProps, MarketFormat } from './DatePicker.types';

interface NativeDatePickerProps extends DatePickerProps {
  style?: StyleProp<ViewStyle>;
}

function triggerText(
  mode: DatePickerProps['mode'],
  value: CalendarValue | undefined,
  mkt: MarketFormat,
): string {
  if (mode === 'range') {
    const range = asRange(value);
    if (range.from === null) {
      return '';
    }
    return `${mkt.date(range.from)} – ${range.to === null ? '…' : mkt.date(range.to)}`;
  }
  if (mode === 'set') {
    const set = asSet(value);
    return set.length === 0 ? '' : `${set.length} date${set.length === 1 ? '' : 's'}`;
  }
  const single = parse(typeof value === 'string' ? value : null);
  return single === null ? '' : mkt.date(single);
}

const styles = StyleSheet.create({
  wrap: { minWidth: 0 },
  trigger: {
    width: '100%',
    minHeight: theme.spacing['sp-12'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-input-expressive'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  triggerFunctional: {
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-input-functional'],
  },
  /* RN cannot draw a ring; the open and error states take a 2px border of the same colour. */
  triggerOpen: { borderWidth: 2, borderColor: theme.colors.accent },
  triggerError: { borderWidth: 2, borderColor: theme.colors.danger },
  triggerDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
    shadowOpacity: 0,
    elevation: 0,
  },
  value: { flex: 1, minWidth: 0 },
  note: { marginTop: theme.spacing['sp-1'], marginHorizontal: theme.spacing['sp-0-5'] },
  popover: { marginTop: theme.spacing['sp-2'] },
});

/**
 * The field and its calendar. Below `sheetBelow` px of its own width the DS anchors the popover
 * full-width UNDER the field — which is every phone — so the native half renders the calendar
 * inline beneath the trigger and never floats it. Two web routes have no touch counterpart and are
 * not faked: Escape, and dismiss-on-outside-click. Tapping the trigger again closes it.
 */
export function DatePicker({
  value,
  onChange,
  mode = 'single',
  label,
  placeholder = 'Select a date',
  min,
  max,
  markers,
  disabledDates,
  lockedDates,
  onBlocked,
  density = 'expressive',
  disabled = false,
  helper,
  error,
  style,
}: NativeDatePickerProps) {
  const mkt = useFormat();
  const [open, setOpen] = useState(false);
  const text = triggerText(mode, value, mkt);

  return (
    <View style={[styles.wrap, style]}>
      {label === undefined ? null : (
        <Text variant="body-sm" color="secondary">
          {label}
        </Text>
      )}
      <Pressable
        accessibilityLabel={label}
        /* THE CALENDAR IS OPEN OR IT IS NOT, and the trigger says which — the web half's
           `aria-expanded={open}`. Without it the only channel is the accent border (F7-12). */
        accessibilityState={{ expanded: open }}
        disabled={disabled}
        onPress={() => setOpen((o) => !o)}
        style={[
          styles.trigger,
          density === 'functional' ? styles.triggerFunctional : undefined,
          open ? styles.triggerOpen : undefined,
          error === undefined ? undefined : styles.triggerError,
          disabled ? styles.triggerDisabled : undefined,
        ]}
      >
        <View style={styles.value}>
          <Text color={text === '' ? 'tertiary' : 'primary'}>
            {text === '' ? placeholder : text}
          </Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect
            x={3}
            y={5}
            width={18}
            height={16}
            rx={2.5}
            stroke={theme.colors['text-tertiary']}
            strokeWidth={1.5}
          />
          <Path
            d="M3 10h18M8 3v4M16 3v4"
            stroke={theme.colors['text-tertiary']}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
      {helper === undefined && error === undefined ? null : (
        <View style={styles.note}>
          <Text variant="caption" color={error === undefined ? 'tertiary' : 'danger'}>
            {error ?? helper}
          </Text>
        </View>
      )}
      {open ? (
        /* The web half's popover is `role="dialog" aria-label`, so the native one is a `dialog`
           too: a ROLE, never `accessible` — folding this View would swallow every day cell, the
           month arrows and the footer into one unreachable blob. */
        <View role="dialog" accessibilityLabel={label ?? 'Choose a date'} style={styles.popover}>
          <Calendar
            value={value}
            onChange={(next) => {
              onChange?.(next);
              const closes =
                mode === 'single' ||
                (mode === 'range' && !Array.isArray(next) && typeof next === 'object' && next.to);
              if (closes) {
                setOpen(false);
              }
            }}
            mode={mode}
            min={min}
            max={max}
            markers={markers}
            disabledDates={disabledDates}
            lockedDates={lockedDates}
            onBlocked={onBlocked}
            density={density}
          />
        </View>
      ) : null}
    </View>
  );
}
