import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/* Catalog settings' sheet feet (`SCR-M01-15` sheetFoot): the line centred, *Cancel* 1 to the
   act's 1.6. */
export const styles = StyleSheet.create({
  foot: {
    gap: theme.spacing['sp-3'],
  },
  footActs: {
    flexDirection: 'row',
    gap: theme.spacing['sp-3'],
  },
  footCancel: {
    flex: 1,
  },
  footAct: {
    flex: 1.6,
  },
});
