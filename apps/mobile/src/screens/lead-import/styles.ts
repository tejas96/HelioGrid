import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/** The wizard's slot under the large title: its parts space themselves, the slot gives them room. */
export const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'], paddingBottom: theme.spacing['sp-8'] },
});
