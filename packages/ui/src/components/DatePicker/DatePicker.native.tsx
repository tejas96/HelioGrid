import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { FIELD_BOX_EDGE, fieldBox, fieldWords } from '../../primitives/FieldBox/FieldBox.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useCloseOnBack } from '../../primitives/use-close-on-back.native';
import { usePopIn } from '../../primitives/use-pop-in.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { useFormat } from '../MarketProvider/market-context';
import { Calendar } from './Calendar.native';
import { closesPicker } from './calendar-selection';
import type { DatePickerProps } from './DatePicker.types';
import { triggerText } from './date-text';

// web-only part: Sheet — the web takes only its Escape stacking; the phone closes on Back instead.

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
  // Back closes the calendar first, and the sheet under it stays (`CLAUDE.md` §10).
  useCloseOnBack(open, () => setOpen(false));
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
        <ShellGlyph name="calendar" size="sm" ink={colors['text-tertiary']} />
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
        <Popover label={label ?? words.chooseDate}>
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
        </Popover>
      ) : null}
    </View>
  );
}

/** The calendar's popover: it pops in each time it opens (`usePopIn`), as `Menu`'s list does. */
function Popover({ label, children }: { label: TranslatedText; children: ReactNode }) {
  return (
    <Animated.View role="dialog" accessibilityLabel={label} style={[styles.popover, usePopIn()]}>
      {children}
    </Animated.View>
  );
}
