import { colors, type ThemeColor } from '../../primitives/Color/colors';
import type { ShareFilterItem } from './ShareFilter.types';

/**
 * The phone's inks for a share: each part's hue as its mark, and the wash a pressed ring or count
 * takes — the hue's own tint token, so light and dark both hold their contrast.
 */
export const HUE_INK: Readonly<Record<ShareFilterItem['hue'], ThemeColor>> = {
  teal: colors['hue-teal'],
  ocean: colors['hue-ocean'],
  warning: colors['warning-text'],
  success: colors.success,
  danger: colors.danger,
};

/** A pressed ring's or count's wash: its hue's tint. */
export const HUE_WASH: Readonly<Record<ShareFilterItem['hue'], ThemeColor>> = {
  teal: colors['hue-teal-bg'],
  ocean: colors['hue-ocean-bg'],
  warning: colors['warning-bg'],
  success: colors['success-bg'],
  danger: colors['danger-bg'],
};

/** A part that asks: its label in the warning words. */
export const WARNING_WORDS: ThemeColor = colors['warning-text'];
