import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * Inline accent text link (login.md §4 composition — Button ghost is the wrong shape
 * for prose links). Press swaps to accent-hover, mirroring the web hover; the web focus
 * ring maps to the platform focus treatment. ≥44pt target via vertical hitSlop around
 * the single text line.
 */
export interface TextLinkProps {
  children: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export function TextLink({ children, onPress, style }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      // 44pt target: one body line (~23pt) — vertical hitSlop extends the touch area.
      hitSlop={{ top: 12, bottom: 12 }}
      style={[styles.root, style]}
    >
      {({ pressed }) => (
        <AppText weight="500" color={pressed ? theme.colors['accent-hover'] : theme.colors.accent}>
          {children}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'flex-start' },
});
