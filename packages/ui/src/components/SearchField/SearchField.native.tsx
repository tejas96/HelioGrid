import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { SearchFieldProps } from './SearchField.types';

interface NativeSearchFieldProps extends SearchFieldProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Borderless search input with a leading magnifier. e1 at rest, a 2px accent ring on focus,
 * never a border.
 *
 * Web draws the focus ring with `box-shadow`, which RN has no equivalent for, so the ring is a
 * 2px border that is ALWAYS present and merely transparent at rest — the box never reflows when
 * focus arrives, which is what the shadow ring buys on web.
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
        disabled ? styles.boxDisabled : undefined,
        focus ? styles.boxFocus : undefined,
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
        style={[styles.input, disabled ? styles.inputDisabled : undefined]}
        value={value}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={theme.colors['text-tertiary']}
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

const RING = 2;

const box: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  height: 44,
  minHeight: 44,
  /* 14 of padding less the always-present 2 of ring, so the inner box matches web exactly. */
  paddingHorizontal: 14 - RING,
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius['r-input-expressive'],
  borderWidth: RING,
  borderColor: 'transparent',
  ...theme.elevation.e1,
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
    borderRadius: theme.radius['r-input-functional'],
  },
  boxDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
  },
  boxFocus: {
    borderColor: theme.colors.accent,
  },
  input,
  inputDisabled: {
    color: theme.colors['text-disabled'],
  },
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
