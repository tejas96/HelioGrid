import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, StyleSheet } from 'react-native';
import type { SheetBackdropProps } from './Sheet.types';

interface NativeSheetBackdropProps extends SheetBackdropProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Backdrop: fades the layer behind toward white. Never darkens — that inversion is a signature of
 * the system, so this file is the only place the recipe lives.
 *
 * TWO WEB BEHAVIOURS MAPPED FOR TOUCH:
 * · `backdrop-filter: blur(8px)` has no RN equivalent without a native blur dependency, so the
 *   canvas tint carries the separation alone and is weighted up from the web's 0.35 to compensate
 *   for the missing blur. The law it must never break — lighten, never darken — is unchanged.
 * · This is NOT the Pressable primitive: it is a full-bleed dismissal region, not a control with a
 *   44px target, and it carries no accessible name (the web half is `aria-hidden`). The named,
 *   focusable act is the header close button, and that one does go through Pressable.
 */
export function SheetBackdrop({ onClick, style }: NativeSheetBackdropProps) {
  return (
    <RNPressable
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onPress={onClick}
      style={[styles.backdrop, style]}
    />
  );
}

const styles = StyleSheet.create({
  /* The absolute-fill four, spelled out: this RN typing does not expose `absoluteFillObject`. */
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.canvas,
    opacity: 0.72,
  },
});
