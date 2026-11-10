import { theme } from '@heliogrid/theme';
import type { ViewStyle } from 'react-native';
import { colors } from '../../primitives/Color/colors';

/**
 * An import's one raised card on the phone — a mapping row, the kept reports, and the catalog's
 * overview, fix cards, group lines and lists of rows: white at `e2` over the sheet, rounded by the
 * caller. Declared once, so the parts that sit one under another never draw two whites or two
 * shadows.
 */
export const raisedCard = {
  // biome-ignore lint/plugin/raw-white: float — a menu, a list, a calendar, a toast, a bubble: white with its shadow (F7-15)
  backgroundColor: colors.surface,
  ...theme.elevation.e2,
} satisfies ViewStyle;

/** The thin line between two rows of one card: the web half's inset `--line-soft` edge. */
export const rowDivider = {
  borderTopWidth: 1,
  borderTopColor: colors['line-soft'],
} satisfies ViewStyle;

/** The board's card radius for the lists, the fix cards and the group lines: no step names it. */
export const CARD_RADIUS = 18;
