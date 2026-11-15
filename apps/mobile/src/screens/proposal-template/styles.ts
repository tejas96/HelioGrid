import { colors } from '@heliogrid/ui';
import { StyleSheet } from 'react-native';

/* Proposal defaults is a focus screen (`T-M01-030`): it fills the window on the page's ground. */
export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
