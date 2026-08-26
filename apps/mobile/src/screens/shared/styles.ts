import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/** Shared scaffold layout — full-screen centred container. */
export const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.canvas,
  },
});
