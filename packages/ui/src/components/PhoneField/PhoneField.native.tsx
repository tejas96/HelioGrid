import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { FIELD_BOX_EDGE, fieldBox, fieldBoxText } from '../../primitives/FieldBox/FieldBox.native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/MarketProvider.native';
import { NON_DIGIT } from './PhoneField.logic';
import type { PhoneFieldDensity, PhoneFieldProps, PhoneValueProps } from './PhoneField.types';

interface NativePhoneFieldProps extends PhoneFieldProps {
  style?: StyleProp<ViewStyle>;
}
interface NativePhoneValueProps extends PhoneValueProps {
  style?: StyleProp<ViewStyle>;
}

const SHELL_HEIGHT: Record<PhoneFieldDensity, number> = {
  expressive: theme.layout['field-h'],
  functional: theme.spacing['sp-10'],
};

const styles = StyleSheet.create({
  column: { gap: theme.spacing['sp-2'], minWidth: 0 },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: 44,
    // Pinned: the declared height is the height, so a tall form cannot squash the field to 44.
    flexShrink: 0,
    // The well's edge is always drawn, so the padding gives up its width and the digits sit where they did.
    paddingHorizontal: theme.spacing['sp-4'] - FIELD_BOX_EDGE,
  },
  /* The code is part of the number, so it is read at the number's weight rather than dimmed to
     furniture — a +91 nobody can read is a number nobody can check. */
  dial: {
    flexShrink: 0,
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.field.value,
    color: theme.colors['text-secondary'],
  },
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.field.value,
    color: theme.colors['text-primary'],
  },
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
  readOnly = false,
  announceError = false,
  autoFocus = false,
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
      <Text variant="field-label" color="secondary">
        {label}
      </Text>
      <View
        style={[
          styles.shell,
          { height: SHELL_HEIGHT[density] },
          fieldBox({
            focused: focus,
            tone: error === undefined ? 'none' : 'error',
            disabled,
            density,
          }),
        ]}
      >
        <Text style={styles.dial}>{dialCode}</Text>
        <TextInput
          autoFocus={autoFocus}
          // The whole number, so the reader hears one number rather than a code and some groups.
          accessibilityLabel={`${label}, ${mkt.phone(value)}`}
          editable={!disabled && !readOnly}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          value={shown}
          onChangeText={commit}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[styles.input, fieldBoxText(disabled)]}
        />
      </View>
      {message === undefined ? null : (
        <Text
          variant="field-helper"
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
