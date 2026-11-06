import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import type { CountBadgeProps, CountBadgeTone } from './AppShell.types';
import { badgeDigits, isBadgeDrawn } from './CountBadge.logic';

interface NativeCountBadgeProps extends CountBadgeProps {
  style?: StyleProp<ViewStyle>;
}

interface TonePair {
  bg: ThemeColor;
  fg: ThemeColor;
  mark: ThemeColor;
}

/* The numeral is WORDS, so the fill is the -bg tint and the digits the -text partner. The DOT is
   a mark and takes the plain token — except warning, which measures 2.17 and is never a mark
   anywhere in this system, so the warning dot takes --warning-text. */
const TONES: Record<CountBadgeTone, TonePair> = {
  danger: {
    bg: colors['danger-bg'],
    fg: colors['danger-text'],
    mark: colors.danger,
  },
  warning: {
    bg: colors['warning-bg'],
    fg: colors['warning-text'],
    mark: colors['warning-text'],
  },
  success: {
    bg: colors['success-bg'],
    fg: colors['success-text'],
    mark: colors.success,
  },
  info: { bg: colors['info-bg'], fg: colors['info-text'], mark: colors.info },
  neutral: {
    bg: colors['neutral-bg'],
    fg: colors['neutral-text'],
    mark: colors.neutral,
  },
  accent: {
    bg: colors['accent-subtle'],
    fg: colors.accent,
    mark: colors.accent,
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
  label,
  tone = 'danger',
  style,
}: NativeCountBadgeProps) {
  // The ring cuts the badge out of what it rides on, so it is that ground's colour.
  const { ground } = useGround();
  if (!isBadgeDrawn(count)) {
    return null;
  }
  const pair = TONES[tone];
  const shown = badgeDigits(count, max);
  if (shown === null) {
    /* The bare dot draws no digits, so there is no text node to hang the sentence on — the view
       needs a role of its own. `text` is the honest one: a mark that states a fact and does
       nothing. Inside `ShellAction` the host Pressable's own label still wins, exactly as the
       web's `aria-label` wins over this badge's sr-only span. */
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={label}
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
      accessibilityLabel={label}
      style={[styles.pill, { backgroundColor: pair.bg, borderColor: ground }, style]}
    >
      <Text variant="caption" fixedSize style={[styles.digits, { color: pair.fg }]}>
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
