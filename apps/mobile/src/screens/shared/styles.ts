import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/** Shared scaffold layout — full-screen centred container. */
export const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // The page is `surface` (`F7-15`, `F7-49`).
    // biome-ignore lint/plugin/raw-white: page-ground — an app's page or door: the page is white
    backgroundColor: theme.colors.surface,
  },
});
