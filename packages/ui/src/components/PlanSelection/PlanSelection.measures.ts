import { theme } from '@heliogrid/theme';

const { spacing } = theme;

/**
 * The comparison's tracks, on the spacing scale. At 375 two whole plan columns and the label track
 * fit the 335px content box (104 + 104 + 120); at 1536 four columns of 216 and a 176 label track
 * fit the plans' content column beside the settings list.
 */
export const COMPARE_COLUMNS = {
  pair: {
    column: spacing['sp-24'] + spacing['sp-2'],
    label: spacing['sp-24'] + spacing['sp-6'],
  },
  all: {
    column: 2 * spacing['sp-24'] + spacing['sp-6'],
    label: spacing['sp-24'] + spacing['sp-20'],
  },
} as const;
