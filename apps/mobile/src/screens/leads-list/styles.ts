import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/** The Leads page's own layout on the phone; the filters and the list's read are `packages/ui`'s. */
export const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-5'] },
  /** *Import*, under the title for who may import: the pill's (+) is the page's other way in. */
  acts: { flexDirection: 'row', justifyContent: 'flex-start' },
});
