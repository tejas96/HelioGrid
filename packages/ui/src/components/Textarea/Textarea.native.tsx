import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  FIELD_BOX_EDGE,
  FIELD_BOX_PLACEHOLDER,
  fieldBox,
  fieldBoxText,
} from '../../primitives/FieldBox/FieldBox.native';
import { Text } from '../../primitives/Text/Text.native';
import { renderAttribution } from '../ValueSource/ValueSource.native';
import type { TextareaProps } from './Textarea.types';

interface NativeTextareaProps extends TextareaProps {
  style?: StyleProp<ViewStyle>;
}

const R = theme.type.roles;
const PAD_Y = theme.spacing['sp-3'];

/** 'near' at 90% of the limit, 'full' at it — the counter warns before it blocks. */
function countColor(length: number, maxLength: number): 'danger' | 'tertiary' | 'warning' {
  if (length >= maxLength) {
    return 'danger';
  }
  return length > maxLength * 0.9 ? 'warning' : 'tertiary';
}

/**
 * Multi-line field: a well (`FieldBox`), whose ring sits on its own edge on the phone. Its padding
 * gives up the edge's width, so the text sits where it did.
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
        <Text variant="field-label" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          { minHeight: Math.max(88, rows * R.body.lineHeight + PAD_Y * 2) },
          density === 'functional' ? styles.inputFunctional : undefined,
          fieldBox({
            focused: focus,
            tone: error === undefined ? 'none' : 'error',
            disabled,
            density,
          }),
          fieldBoxText(disabled),
        ]}
        value={value}
        multiline
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={FIELD_BOX_PLACEHOLDER}
        maxLength={maxLength}
        accessibilityLabel={label}
        textAlignVertical="top"
        onChangeText={(next) => onChange?.(next)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      {attributionNode === null ? null : <View style={styles.attribution}>{attributionNode}</View>}
      {helper !== undefined || error !== undefined || hasCounter ? (
        <View style={styles.foot}>
          <Text variant="field-helper" color={error !== undefined ? 'danger' : 'tertiary'}>
            {error ?? helper ?? ''}
          </Text>
          {maxLength !== undefined ? (
            <Text variant="field-helper" color={countColor(length, maxLength)} style={styles.count}>
              {`${length}/${maxLength}`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const input: TextStyle = {
  width: '100%',
  paddingVertical: PAD_Y - FIELD_BOX_EDGE,
  paddingHorizontal: theme.spacing['sp-4'] - FIELD_BOX_EDGE,
  fontFamily: theme.type.families.sans,
  fontSize: theme.type.field.value,
  lineHeight: R.body.lineHeight,
  color: theme.colors['text-primary'],
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
  input,
  inputFunctional: {
    paddingVertical: 10 - FIELD_BOX_EDGE,
    paddingHorizontal: theme.spacing['sp-3'] - FIELD_BOX_EDGE,
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
