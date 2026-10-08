import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import {
  FIELD_BOX_EDGE,
  fieldBox,
  fieldBoxPlaceholder,
  fieldBoxText,
} from '../../primitives/FieldBox/FieldBox.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { SearchFieldProps } from './SearchField.types';

interface NativeSearchFieldProps extends SearchFieldProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Borderless search input with a leading magnifier: a well (`FieldBox`), whose ring sits on its
 * own edge on the phone and is always laid out, so the box never reflows when focus arrives.
 */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search name, phone or city',
  density = 'expressive',
  onClear,
  disabled = false,
  ariaLabel,
  style,
}: NativeSearchFieldProps) {
  const [focus, setFocus] = useState(false);
  const hasValue = value !== undefined && value !== '';
  return (
    <View
      style={[
        styles.box,
        density === 'functional' ? styles.boxFunctional : undefined,
        fieldBox({ focused: focus, disabled, density }),
        style,
      ]}
    >
      {/* 18dp is the DS glyph size; it is off the Icon primitive's ladder, so the Svg is direct. */}
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors['text-tertiary']}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Circle cx={11} cy={11} r={7} />
        <Path d="m20 20-3.5-3.5" />
      </Svg>
      <TextInput
        style={[styles.input, fieldBoxText(disabled)]}
        value={value}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={fieldBoxPlaceholder(disabled)}
        accessibilityLabel={ariaLabel ?? placeholder}
        onChangeText={(next) => onChange?.(next)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        returnKeyType="search"
        autoCorrect={false}
      />
      {hasValue && onClear !== undefined ? (
        <Pressable accessibilityLabel="Clear search" onPress={onClear} style={styles.clear}>
          {/* 44dp target, 28dp pill: the two rectangles again. */}
          <View style={styles.clearPill}>
            <Svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors['text-secondary']}
              strokeWidth={2}
              strokeLinecap="round"
            >
              <Path d="M18 6 6 18M6 6l12 12" />
            </Svg>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const box: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  height: 44,
  minHeight: 44,
  /* 14 of padding less the always-present edge, so the inner box matches web exactly. */
  paddingHorizontal: 14 - FIELD_BOX_EDGE,
};

const input: TextStyle = {
  flex: 1,
  minWidth: 0,
  alignSelf: 'stretch',
  padding: 0,
  fontFamily: theme.type.families.sans,
  fontSize: theme.type.roles.body.fontSize,
  color: theme.colors['text-primary'],
};

const styles = StyleSheet.create({
  box,
  boxFunctional: {
    height: 40,
  },
  input,
  clear: {
    /* The 44dp target, with the extra width taken back so the row geometry is unchanged. */
    width: 44,
    height: 44,
    marginLeft: -8,
    marginRight: -12,
  },
  clearPill: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['neutral-bg'],
  },
});
