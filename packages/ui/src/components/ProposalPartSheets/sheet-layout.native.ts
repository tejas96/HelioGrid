import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';

/** The part sheets' shared layout on the phone: a column of fields, a field with its head, a row. */
export const sheetLayout = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  list: { gap: theme.spacing['sp-2'] },
  field: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-tile'],
  },
  rowOn: { borderWidth: 2, borderColor: colors.accent },
  outlined: { borderWidth: 1.5, borderColor: colors['line-strong'] },
  words: { flex: 1, minWidth: 0 },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  foot: { gap: theme.spacing['sp-2'] },
  mark: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-sm'],
  },
  check: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1.5,
    borderColor: colors['line-strong'],
  },
  checkOn: { borderWidth: 0, backgroundColor: colors.accent },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    height: 24,
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['success-bg'],
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 },
});
