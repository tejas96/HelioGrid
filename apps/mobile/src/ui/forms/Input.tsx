import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  type KeyboardTypeOptions,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { AppText } from '../AppText';

/**
 * _adherence allowlist: label, value, onChange, onBlur, placeholder, type, density, error,
 * success, helper, disabled, mono, leading, trailing, id, style. `onBlur` joined the
 * allowlist on 2026-08-02 (owner ruling): web accepted it all along via
 * InputHTMLAttributes, so RN lacking it was a hidden Law 7 gap that left `useZodForm`'s
 * `mode: 'onTouched'` unable to validate on blur here.
 */
export interface InputProps {
  label?: string;
  value?: string;
  /** RN adaptation: receives the new text (web passes the change event). */
  onChange?: (text: string) => void;
  /** RN adaptation: zero-arg (web inherits the DOM FocusEventHandler). Forms validate on blur. */
  onBlur?: () => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  density?: 'expressive' | 'functional';
  error?: string;
  success?: boolean;
  helper?: string;
  disabled?: boolean;
  mono?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  id?: string;
  style?: ViewStyle;
}

const KEYBOARD: Record<string, KeyboardTypeOptions> = {
  email: 'email-address',
  number: 'numeric',
  tel: 'phone-pad',
};

type FieldStateArgs = {
  isExpr: boolean;
  radius: number;
  stateColor: string | null;
  focused: boolean;
  disabled: boolean;
};

/** The field box's style array — split out so the component body stays a flat read. */
function fieldStyle({ isExpr, radius, stateColor, focused, disabled }: FieldStateArgs) {
  return [
    styles.field,
    { borderRadius: radius },
    isExpr ? styles.fieldExpressive : styles.fieldFunctional,
    stateColor != null && !focused && !disabled && { borderWidth: 1.5, borderColor: stateColor },
    focused && !disabled && styles.fieldFocused,
    disabled && styles.fieldDisabled,
  ];
}

/**
 * Borderless input — e1 at rest, no border ever. Focus = elevation to e2 plus the
 * accent ring. RN adaptation: the web's double box-shadow ring (2px surface gap +
 * 2px accent) is a ring View around the field — border 2 + padding 2, negative
 * margin −4 so focusing never shifts layout. Error/success = 1.5px inset border
 * (RN borders draw inside, mirroring the web inset shadow).
 */
export function Input({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  density = 'expressive',
  error,
  success = false,
  helper,
  disabled = false,
  mono = false,
  leading,
  trailing,
  id,
  style,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const isExpr = density === 'expressive';
  const radius = isExpr ? theme.radius['r-input-expressive'] : theme.radius['r-input-functional'];
  const stateColor = error ? theme.colors.danger : success ? theme.colors.success : null;
  const fam = theme.fonts.staticFamilyByWeight;
  return (
    <View style={[styles.stack, style]}>
      {label != null && (
        <AppText role="body-sm" weight="500" color={theme.colors['text-secondary']}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.ring,
          { borderRadius: radius + 4 },
          focused && !disabled && styles.ringFocused,
        ]}
      >
        <View style={fieldStyle({ isExpr, radius, stateColor, focused, disabled })}>
          {leading}
          <TextInput
            nativeID={id}
            accessibilityLabel={label ?? placeholder}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors['text-tertiary']}
            editable={!disabled}
            keyboardType={KEYBOARD[type] ?? 'default'}
            secureTextEntry={type === 'password'}
            autoCapitalize={type === 'email' || type === 'password' ? 'none' : undefined}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            style={[
              styles.text,
              { fontFamily: mono ? fam.mono['400'] : fam.sans['400'] },
              disabled && styles.textDisabled,
            ]}
          />
          {trailing}
        </View>
      </View>
      {error != null ? (
        <AppText role="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : helper != null ? (
        <AppText role="caption" color={theme.colors['text-tertiary']}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 6 — ds-ref Input.jsx label/field/helper stack gap (reference geometry, no spacing token).
  stack: { gap: 6 },
  // Focus-ring wrapper: border 2 + padding 2 cancelled by margin −4 → zero layout shift.
  ring: { margin: -4, padding: 2, borderWidth: 2, borderColor: 'transparent' },
  ringFocused: { borderColor: theme.colors.accent },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-4'],
    ...theme.elevation.e1,
  },
  // ds-ref field heights: expressive 52 / functional 40.
  fieldExpressive: { height: 52, backgroundColor: theme.colors.surface },
  fieldFunctional: { height: 40, backgroundColor: theme.colors['surface-alt'] },
  fieldFocused: { ...theme.elevation.e2 },
  fieldDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
    // RN has no `box-shadow: none` — zeroing opacity/elevation removes e1 on iOS + Android.
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors['text-primary'],
    fontVariant: ['tabular-nums'],
  },
  textDisabled: { color: theme.colors['text-disabled'] },
});
