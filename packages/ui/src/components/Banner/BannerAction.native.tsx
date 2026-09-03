import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { BannerActionProps } from './Banner.types';

interface NativeBannerActionProps extends BannerActionProps {
  /** Lands on the PILL — the thing a caller can see, not the invisible 44px target. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Inline text action for a banner — "Take the new value", "Pay now". Never a filled button.
 *
 * THE TARGET AND THE VISIBLE PILL ARE TWO DIFFERENT RECTANGLES. The Pressable primitive carries
 * the 44px floor; the pill inside it stays 32, which keeps a banner's density unchanged. The
 * negative margin is the 6px per side the target borrows back.
 */
export function BannerAction({ children, onClick, style }: NativeBannerActionProps) {
  return (
    <Pressable onPress={onClick} style={styles.target}>
      <View style={[styles.pill, style]}>
        <Text variant="body-sm" style={styles.words}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    marginVertical: -6,
    paddingHorizontal: theme.spacing['sp-0-5'],
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  words: {
    fontWeight: '500',
  },
});
