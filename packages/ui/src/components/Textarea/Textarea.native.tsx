import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { renderAttribution } from '../ValueSource/ValueSource.native';
import type { TextareaProps } from './Textarea.types';

interface NativeTextareaProps extends TextareaProps {
  style?: StyleProp<ViewStyle>;
}

const R = theme.type.roles;
/** The accent focus ring, outside; the danger edge, inside. Both are always laid out. */
const FOCUS_RING = 2;
const DANGER_RING = 1.5;
const PAD_Y = theme.spacing['sp-3'];

/** 'near' at 90% of the limit, 'full' at it — the counter warns before it blocks. */
function countColor(length: number, maxLength: number): 'danger' | 'tertiary' | 'warning' {
  if (length >= maxLength) {
    return 'danger';
  }
  return length > maxLength * 0.9 ? 'warning' : 'tertiary';
}

/**
 * Multi-line field. No border at rest (e1); a 2px accent ring on focus.
 *
 * RN has no `box-shadow`, so web's two-ring stack becomes two boxes: an outer view holding the
 * accent focus ring and the input itself holding the danger edge. Both rings when both are true,
 * accent outside — an error nobody but the caller clears must not delete the focus ring.
 *
 * `resize: vertical` has no RN counterpart: the box grows with its content instead, floored at
 * the web min-height and at `rows` lines.
 */
export function Textarea({
  value,
  onChange,
  label,
  placeholder,
  rows = 4,
  maxLength,
  attribution,
  density = 'expressive',
  disabled = false,
  helper,
  error,
  style,
}: NativeTextareaProps) {
  const [focus, setFocus] = useState(false);
  const length = (value ?? '').length;
  const hasCounter = maxLength !== undefined;
  /* A spec, a level string or a ready node — `ValueSource`'s own resolver decides. The field's
     name rides along, so `inherited`'s override action says which field it would override. */
  const attributionNode = renderAttribution(attribution, { fieldName: label });

  return (
    <View style={style}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.ring, focus ? styles.ringFocus : undefined]}>
        <TextInput
          style={[
            styles.input,
            { minHeight: Math.max(88, rows * R.body.lineHeight + PAD_Y * 2) },
            density === 'functional' ? styles.inputFunctional : undefined,
            disabled ? styles.inputDisabled : undefined,
            error !== undefined ? styles.inputError : undefined,
          ]}
          value={value}
          multiline
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={theme.colors['text-tertiary']}
          maxLength={maxLength}
          accessibilityLabel={label}
          textAlignVertical="top"
          onChangeText={(next) => onChange?.(next)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
      </View>
      {attributionNode === null ? null : <View style={styles.attribution}>{attributionNode}</View>}
      {helper !== undefined || error !== undefined || hasCounter ? (
        <View style={styles.foot}>
          <Text variant="caption" color={error !== undefined ? 'danger' : 'tertiary'}>
            {error ?? helper ?? ''}
          </Text>
          {maxLength !== undefined ? (
            <Text variant="caption" color={countColor(length, maxLength)} style={styles.count}>
              {`${length}/${maxLength}`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const ring: ViewStyle = {
  borderWidth: FOCUS_RING,
  borderColor: 'transparent',
  borderRadius: theme.radius['r-input-expressive'] + FOCUS_RING,
};

const input: TextStyle = {
  width: '100%',
  paddingVertical: PAD_Y - DANGER_RING,
  paddingHorizontal: theme.spacing['sp-4'] - DANGER_RING,
  borderRadius: theme.radius['r-input-expressive'],
  borderWidth: DANGER_RING,
  borderColor: 'transparent',
  backgroundColor: theme.colors.surface,
  fontFamily: theme.type.families.sans,
  fontSize: R.body.fontSize,
  lineHeight: R.body.lineHeight,
  color: theme.colors['text-primary'],
  ...theme.elevation.e2,
};

const foot: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: theme.spacing['sp-3'],
  marginTop: 6,
  marginHorizontal: theme.spacing['sp-0-5'],
};

const styles = StyleSheet.create({
  label: {
    fontWeight: '500',
    marginBottom: 6,
  },
  ring,
  ringFocus: {
    borderColor: theme.colors.accent,
  },
  input,
  inputFunctional: {
    paddingVertical: 10 - DANGER_RING,
    paddingHorizontal: theme.spacing['sp-3'] - DANGER_RING,
    borderRadius: theme.radius['r-input-functional'],
  },
  inputDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  attribution: {
    marginTop: 6,
    marginHorizontal: theme.spacing['sp-0-5'],
  },
  foot,
  count: {
    fontVariant: ['tabular-nums'],
  },
});
