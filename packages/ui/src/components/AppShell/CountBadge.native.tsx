import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { clampCount } from '../../utils/count';
import type { CountBadgeProps, CountBadgeTone } from './AppShell.types';

interface NativeCountBadgeProps extends CountBadgeProps {
  style?: StyleProp<ViewStyle>;
}

interface TonePair {
  bg: string;
  fg: string;
  mark: string;
}

/* The numeral is WORDS, so the fill is the -bg tint and the digits the -text partner. The DOT is
   a mark and takes the plain token — except warning, which measures 2.17 and is never a mark
   anywhere in this system, so the warning dot takes --warning-text. */
const TONES: Record<CountBadgeTone, TonePair> = {
  danger: {
    bg: theme.colors['danger-bg'],
    fg: theme.colors['danger-text'],
    mark: theme.colors.danger,
  },
  warning: {
    bg: theme.colors['warning-bg'],
    fg: theme.colors['warning-text'],
    mark: theme.colors['warning-text'],
  },
  success: {
    bg: theme.colors['success-bg'],
    fg: theme.colors['success-text'],
    mark: theme.colors.success,
  },
  info: { bg: theme.colors['info-bg'], fg: theme.colors['info-text'], mark: theme.colors.info },
  neutral: {
    bg: theme.colors['neutral-bg'],
    fg: theme.colors['neutral-text'],
    mark: theme.colors.neutral,
  },
  accent: {
    bg: theme.colors['accent-subtle'],
    fg: theme.colors.accent,
    mark: theme.colors.accent,
  },
};

/**
 * The unread count — a NUMERAL, not a red dot. Renders nothing at zero; over `max` it reads
 * "99+". The web's `box-shadow: 0 0 0 2px var(--surface)` ring is a real 2px border here, RN
 * having no spread shadow; the ring reads the same and the pill keeps its 20dp box.
 */
export function CountBadge({
  count,
  max = 99,
  label = 'items',
  tone = 'danger',
  style,
}: NativeCountBadgeProps) {
  const n = typeof count === 'number' ? count : null;
  if (n !== null && n <= 0) {
    return null;
  }
  if (n === null && count !== true) {
    return null;
  }
  const pair = TONES[tone];
  const shown = n === null ? null : clampCount(n, max);
  const words = n === null ? `Unread ${label}` : `${n} unread ${label}`;
  if (shown === null) {
    /* The bare dot draws no digits, so there is no text node to hang the sentence on — the view
       needs a role of its own. `text` is the honest one: a mark that states a fact and does
       nothing. Inside `ShellAction` the host Pressable's own label still wins, exactly as the
       web's `aria-label` wins over this badge's sr-only span. */
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={words}
        style={[styles.dot, { backgroundColor: pair.mark }, style]}
      />
    );
  }
  return (
    /* Same role for the pill: the badge states one fact and holds no control, so it is a text
       element whose name is the whole sentence — the web half's digits plus its visually hidden
       "3 unread alerts", said once. */
    <View
      accessibilityRole="text"
      accessibilityLabel={words}
      style={[styles.pill, { backgroundColor: pair.bg }, style]}
    >
      <Text variant="caption" style={[styles.digits, { color: pair.fg }]}>
        {shown}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: theme.spacing['sp-5'],
    height: theme.spacing['sp-5'],
    borderWidth: 2,
    borderColor: theme.colors.surface,
    borderRadius: theme.radius['r-pill'],
    paddingHorizontal: 6,
  },
  dot: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  digits: {
    fontWeight: '700',
    lineHeight: theme.type.roles.caption.fontSize,
    fontVariant: ['tabular-nums'],
  },
});
