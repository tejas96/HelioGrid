import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/MarketProvider.native';
import type { PhoneFieldDensity, PhoneFieldProps, PhoneValueProps } from './PhoneField.types';

interface NativePhoneFieldProps extends PhoneFieldProps {
  style?: StyleProp<ViewStyle>;
}
interface NativePhoneValueProps extends PhoneValueProps {
  style?: StyleProp<ViewStyle>;
}

/** Everything that is not a digit — a pasted `+91 (98450) 27746` and a typed one must agree. */
const NON_DIGIT = /\D/g;

const SHELL_HEIGHT: Record<PhoneFieldDensity, number> = { expressive: 52, functional: 40 };

const styles = StyleSheet.create({
  column: { gap: theme.spacing['sp-1'], minWidth: 0 },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: 44,
    // Pinned: the declared height is the height, so a tall form cannot squash the field to 44.
    flexShrink: 0,
    paddingHorizontal: theme.spacing['sp-4'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-input-expressive'],
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  shellFunctional: { borderRadius: theme.radius['r-input-functional'] },
  /* RN cannot draw an inset ring, so the refusal is a 1.5px border of the same colour and width —
     the one place this half spells a border, and only where the web half insets one. */
  shellError: { borderWidth: 1.5, borderColor: theme.colors.danger },
  shellFocus: { borderWidth: 2, borderColor: theme.colors.accent },
  shellDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
    shadowOpacity: 0,
    elevation: 0,
  },
  /* The code is part of the number, so it is read at the number's weight rather than dimmed to
     furniture — a +91 nobody can read is a number nobody can check. */
  dial: {
    flexShrink: 0,
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles.body.fontSize,
    color: theme.colors['text-secondary'],
  },
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles.body.fontSize,
    color: theme.colors['text-primary'],
  },
  inputDisabled: { color: theme.colors['text-disabled'] },
  valueNumber: {
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles.body.fontSize,
    fontWeight: '700',
    color: theme.colors['text-primary'],
  },
});

/**
 * A phone number, entered. The dial code is a FIXED PREFIX beside the digits rather than characters
 * inside them: a person typing their own number does not type their country's code, and a code that
 * can be edited is a code that can be deleted.
 *
 * `value` and `onChange` are E.164 both ways, so a caller stores exactly what it is given.
 */
export function PhoneField({
  label,
  value = '',
  onChange,
  density = 'expressive',
  error,
  helper,
  disabled = false,
  announceError = false,
  style,
}: NativePhoneFieldProps) {
  const mkt = useFormat();
  const [focus, setFocus] = useState(false);
  const { dialCode } = mkt.pack.phone;
  const code = dialCode.replace(NON_DIGIT, '');

  const digits = value.replace(NON_DIGIT, '');
  const nsn = digits.startsWith(code) ? digits.slice(code.length) : digits;
  const shown = mkt.phone(nsn, { nsn: true });

  const commit = (typed: string): void => {
    const entered = typed.replace(NON_DIGIT, '');
    onChange?.(entered.length === 0 ? '' : `${dialCode}${entered}`);
  };

  const message = error ?? helper;

  return (
    <View style={[styles.column, style]}>
      <Text variant="body-sm" color="secondary">
        {label}
      </Text>
      <View
        style={[
          styles.shell,
          { height: SHELL_HEIGHT[density] },
          density === 'functional' ? styles.shellFunctional : undefined,
          error === undefined ? undefined : styles.shellError,
          focus ? styles.shellFocus : undefined,
          disabled ? styles.shellDisabled : undefined,
        ]}
      >
        <Text style={styles.dial}>{dialCode}</Text>
        <TextInput
          // The whole number, so the reader hears one number rather than a code and some groups.
          accessibilityLabel={`${label}, ${mkt.phone(value)}`}
          editable={!disabled}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          value={shown}
          onChangeText={commit}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[styles.input, disabled ? styles.inputDisabled : undefined]}
        />
      </View>
      {message === undefined ? null : (
        <Text
          variant="caption"
          color={error === undefined ? 'secondary' : 'danger'}
          live={error !== undefined && announceError}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

/**
 * A phone number, shown. The read-only half — a labelled value, grouped and monospaced, with one
 * sentence saying where it came from.
 *
 * NOT a disabled `PhoneField`: disabled is never the only signal (`N4`), and a greyed field reads
 * as *editable, later*. A value that cannot be edited is drawn as a value.
 */
export function PhoneValue({ label, value, note, style }: NativePhoneValueProps) {
  const mkt = useFormat();
  return (
    <View style={[styles.column, style]}>
      <Text variant="overline" color="tertiary">
        {label}
      </Text>
      <Text style={styles.valueNumber}>{mkt.phone(value)}</Text>
      {note === undefined ? null : (
        <Text variant="caption" color="secondary">
          {note}
        </Text>
      )}
    </View>
  );
}
