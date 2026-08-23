import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
import type { FieldProps } from './Field.types';

const R = theme.type.roles;
const sans = theme.type.families.sans;

const container: ViewStyle = {
  gap: theme.spacing['sp-2'],
};

/* --fw-medium — the DS form-label weight (Input.jsx). */
const labelStyle: TextStyle = {
  fontFamily: sans,
  fontWeight: '500',
  fontSize: R['body-sm'].fontSize,
  lineHeight: R['body-sm'].lineHeight,
  color: theme.colors['text-secondary'],
};

const requiredStyle: TextStyle = {
  color: theme.colors['danger-text'],
};

const hintStyle: TextStyle = {
  fontFamily: sans,
  fontSize: R.caption.fontSize,
  lineHeight: R.caption.lineHeight,
  color: theme.colors['text-tertiary'],
};

const errorStyle: TextStyle = {
  fontFamily: sans,
  fontSize: R.caption.fontSize,
  lineHeight: R.caption.lineHeight,
  color: theme.colors['danger-text'],
};

interface NativeFieldProps extends FieldProps {
  style?: StyleProp<ViewStyle>;
}

/** Label + hint + error + required marker. The error is WORDS, never a tint alone. */
export function Field({ children, label, hint, error, required = false, style }: NativeFieldProps) {
  return (
    <View style={[container, style]}>
      <RNText style={labelStyle}>
        {label}
        {required ? <RNText style={requiredStyle}> *</RNText> : null}
      </RNText>
      {children}
      {hint !== undefined && error === undefined ? <RNText style={hintStyle}>{hint}</RNText> : null}
      {error !== undefined ? (
        <RNText accessibilityRole="alert" style={errorStyle}>
          {error}
        </RNText>
      ) : null}
    </View>
  );
}
