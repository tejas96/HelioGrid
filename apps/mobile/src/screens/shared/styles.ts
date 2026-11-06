import { colors } from '@heliogrid/ui';
import { StyleSheet } from 'react-native';

/** Shared scaffold layout — full-screen centred container. */
export const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // The page is the canvas, under the glow.
    backgroundColor: colors.canvas,
  },
});
