import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import type { TextInput as RNTextInput, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { fieldBox, fieldBoxText } from '../../primitives/FieldBox/FieldBox.native';
import { Text } from '../../primitives/Text/Text.native';
import { applyOtpEdit, erasedOtp, type OtpEdit, otpDigits, typedOtp } from './OtpInput.logic';
import type { OtpInputProps } from './OtpInput.types';

interface NativeOtpInputProps extends OtpInputProps {
  style?: StyleProp<ViewStyle>;
}

const BOX_WIDTH = 48;
const BOX_HEIGHT = 56;
/** A stroke, as FieldBox's rings are: the theme carries no stroke-width token. */
const BAR_HEIGHT = 2;

const styles = StyleSheet.create({
  label: { marginBottom: theme.spacing['sp-2'] },
  boxes: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  cell: { position: 'relative' },
  // The empty cell's mark: --mark-subtle clears 3:1 where the well itself does not (1.10:1).
  bar: {
    position: 'absolute',
    top: (BOX_HEIGHT - BAR_HEIGHT) / 2,
    left: (BOX_WIDTH - theme.spacing['sp-3']) / 2,
    width: theme.spacing['sp-3'],
    height: BAR_HEIGHT,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['mark-subtle'],
  },
  box: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    minWidth: 44,
    textAlign: 'center',
    fontFamily: theme.type.families.mono,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors['text-primary'],
    padding: 0,
  },
  message: { marginTop: theme.spacing['sp-2'], marginHorizontal: 2 },
});

/**
 * The verification-code field on touch. Same auto-advance, same backspace step-back, same
 * paste path (an SMS autofill lands in one box and fills the rest).
 *
 * ArrowLeft/ArrowRight have no touch equivalent — a thumb moves between boxes by tapping one,
 * which every box already accepts. Hardware-keyboard Backspace is read through `onKeyPress`.
 */
export function OtpInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  label,
  helper,
  error,
  words,
  disabled = false,
  readOnly = false,
  busy = false,
  autoFocus = false,
  style,
}: NativeOtpInputProps) {
  const refs = useRef<Array<RNTextInput | null>>([]);
  const [focused, setFocused] = useState(-1);
  const slots = otpDigits(value, length).map((char, index) => ({
    key: `otp-${index}`,
    index,
    char,
  }));

  const focusBox = (index: number) => refs.current[index]?.focus();
  const apply = (edit: OtpEdit | null) =>
    applyOtpEdit(edit, length, { onChange, onComplete }, focusBox);

  const onCharChange = (i: number, raw: string) => apply(typedOtp(value, i, raw, length));
  const onBackspace = (i: number) => apply(erasedOtp(value, i, length));

  return (
    <View style={style}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      {/* No `role="group"` wrapper: RN has no `group` role, so each box carries its own
          "Digit n" name and the visible label above names the set. */}
      <View style={styles.boxes}>
        {slots.map((slot) => (
          <View key={slot.key} style={styles.cell}>
            <TextInput
              ref={(el) => {
                refs.current[slot.index] = el;
              }}
              style={[
                styles.box,
                fieldBox({
                  focused: focused === slot.index,
                  tone: error === undefined ? 'none' : 'error',
                  disabled,
                  density: 'expressive',
                }),
                fieldBoxText(disabled),
              ]}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              accessibilityLabel={words.digitOf(label ?? words.code, slot.index + 1)}
              maxLength={length}
              editable={!disabled && !readOnly && !busy}
              accessibilityState={{ disabled, busy }}
              autoFocus={autoFocus && slot.index === 0}
              selectTextOnFocus
              value={slot.char}
              onChangeText={(text) => onCharChange(slot.index, text)}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Backspace') onBackspace(slot.index);
              }}
              onFocus={() => setFocused(slot.index)}
              onBlur={() => setFocused(-1)}
            />
            {slot.char === '' ? <View style={styles.bar} pointerEvents="none" /> : null}
          </View>
        ))}
      </View>
      {helper !== undefined || error !== undefined ? (
        <Text
          variant="caption"
          color={error !== undefined ? 'danger' : 'tertiary'}
          style={styles.message}
        >
          {error ?? helper}
        </Text>
      ) : null}
    </View>
  );
}
