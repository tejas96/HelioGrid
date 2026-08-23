import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import type { TextInput as RNTextInput, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { OtpInputProps } from './OtpInput.types';

interface NativeOtpInputProps extends OtpInputProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  label: { marginBottom: theme.spacing['sp-2'] },
  boxes: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  box: {
    width: 48,
    height: 56,
    minWidth: 44,
    textAlign: 'center',
    borderRadius: theme.radius['r-input-expressive'],
    backgroundColor: theme.colors.surface,
    fontFamily: theme.type.families.mono,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors['text-primary'],
    padding: 0,
    ...theme.elevation.e1,
  },
  boxDisabled: { backgroundColor: theme.colors['canvas-sunken'] },
  /* RN has no box-shadow ring: focus and error rings are borders of the same weight. */
  boxFocus: { borderWidth: 2, borderColor: theme.colors.accent, shadowOpacity: 0, elevation: 0 },
  boxError: { borderWidth: 2, borderColor: theme.colors.danger, shadowOpacity: 0, elevation: 0 },
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
  disabled = false,
  autoFocus = false,
  style,
}: NativeOtpInputProps) {
  const refs = useRef<Array<RNTextInput | null>>([]);
  const [focused, setFocused] = useState(-1);
  const slots = Array.from({ length }, (_, i) => ({
    key: `otp-${i}`,
    index: i,
    char: value.padEnd(length, ' ').slice(0, length).charAt(i).trim(),
  }));

  const set = (next: string) => {
    const v = next.slice(0, length);
    onChange?.(v);
    if (v.length === length) onComplete?.(v);
  };

  const onCharChange = (i: number, raw: string) => {
    const digit = (raw.match(/\d/g) ?? []).join('');
    if (digit === '') return;
    if (digit.length > 1) {
      set((value.slice(0, i) + digit).slice(0, length));
      refs.current[Math.min(length - 1, i + digit.length)]?.focus();
      return;
    }
    const arr = value.split('');
    arr[i] = digit;
    set(arr.join('').slice(0, length));
    refs.current[Math.min(length - 1, i + 1)]?.focus();
  };

  const onBackspace = (i: number) => {
    const arr = value.padEnd(length, ' ').split('');
    const here = arr[i];
    if (here !== undefined && here !== ' ') {
      arr[i] = ' ';
      set(arr.join('').trimEnd());
      return;
    }
    if (i > 0) {
      arr[i - 1] = ' ';
      set(arr.join('').trimEnd());
      refs.current[i - 1]?.focus();
    }
  };

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
          <TextInput
            key={slot.key}
            ref={(el) => {
              refs.current[slot.index] = el;
            }}
            style={[
              styles.box,
              disabled ? styles.boxDisabled : null,
              focused === slot.index && error === undefined ? styles.boxFocus : null,
              error !== undefined ? styles.boxError : null,
            ]}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            accessibilityLabel={`${label ?? 'Verification code'} — digit ${slot.index + 1}`}
            maxLength={length}
            editable={!disabled}
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
