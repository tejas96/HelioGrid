import { cloneElement, isValidElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import type { IconProps } from './Icon.types';
import { ICON_SIZE } from './Icon.types';

interface NativeIconProps extends IconProps {
  /**
   * Colour for the glyph — RN has no currentColor, so the composer passes a theme value
   * down. Never a raw colour at a call site.
   */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** Sizing ladder + a11y. Decorative (no label) icons are hidden from assistive tech. */
export function Icon({ children, size = 'md', label, color, style }: NativeIconProps) {
  const px = ICON_SIZE[size];
  const labelled = label !== undefined;
  const glyph = isValidElement<SvgProps>(children)
    ? cloneElement(children, {
        width: px,
        height: px,
        ...(color !== undefined ? { color } : {}),
      })
    : children;
  return (
    <View
      accessible={labelled}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
      style={[{ width: px, height: px }, style]}
    >
      {glyph}
    </View>
  );
}
