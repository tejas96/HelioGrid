import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { FIELD_BOX_EDGE, fieldBox, fieldWords } from '../../primitives/FieldBox/FieldBox.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { useFormat } from '../MarketProvider/market-context';
import { Calendar } from './Calendar.native';
import { closesPicker } from './calendar-selection';
import type { DatePickerProps } from './DatePicker.types';
import { triggerText } from './date-text';

interface NativeDatePickerProps extends DatePickerProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  wrap: { minWidth: 0 },
  trigger: {
    width: '100%',
    minHeight: theme.layout['field-h'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    // The well and its edge are FieldBox's; the padding gives up the edge's width.
    paddingHorizontal: theme.spacing['sp-4'] - FIELD_BOX_EDGE,
  },
  triggerFunctional: {
    paddingHorizontal: theme.spacing['sp-3'] - FIELD_BOX_EDGE,
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
  words,
  value,
  onChange,
  mode = 'single',
  label,
  placeholder = words.selectDate,
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
  const text = triggerText(mode, value, mkt, words);

  return (
    <View style={[styles.wrap, style]}>
      {label === undefined ? null : (
        <Text variant="field-label" color="secondary">
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
          fieldBox({
            focused: open,
            tone: error === undefined ? 'none' : 'error',
            disabled,
            density,
          }),
        ]}
      >
        <View style={styles.value}>
          <Text color={fieldWords(text === '', disabled)}>{text === '' ? placeholder : text}</Text>
        </View>
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors['text-tertiary']}
          strokeWidth={1.5}
          strokeLinecap="round"
        >
          <ShellGlyphMarks name="calendar" />
        </Svg>
      </Pressable>
      {helper === undefined && error === undefined ? null : (
        <View style={styles.note}>
          <Text variant="field-helper" color={error === undefined ? 'tertiary' : 'danger'}>
            {error ?? helper}
          </Text>
        </View>
      )}
      {open ? (
        /* The web half's popover is `role="dialog" aria-label`, so the native one is a `dialog`
           too: a ROLE, never `accessible` — folding this View would swallow every day cell, the
           month arrows and the footer into one unreachable blob. */
        <View role="dialog" accessibilityLabel={label ?? words.chooseDate} style={styles.popover}>
          <Calendar
            words={words}
            value={value}
            onChange={(next) => {
              onChange?.(next);
              if (closesPicker(mode, next)) {
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
