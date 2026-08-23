import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { ToastProps, ToastTone } from './Toast.types';

interface TonePair {
  text: string;
  bg: string;
}

/** The semantic `-text` on `-bg` partner pairs — the same ones StatusMark resolves. */
const TONE: Record<ToastTone, TonePair> = {
  success: { text: theme.colors['success-text'], bg: theme.colors['success-bg'] },
  warning: { text: theme.colors['warning-text'], bg: theme.colors['warning-bg'] },
  danger: { text: theme.colors['danger-text'], bg: theme.colors['danger-bg'] },
  info: { text: theme.colors['info-text'], bg: theme.colors['info-bg'] },
  neutral: { text: theme.colors['neutral-text'], bg: theme.colors['neutral-bg'] },
};

interface NativeToastProps extends ToastProps {
  style?: StyleProp<ViewStyle>;
}

/** The default mark: a check. One glyph for every tone — the words carry the tone. */
function CheckGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6 9 17l-5-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * White toast card with a leading semantic icon in a circular tint. e5, sits above the bottom nav.
 * `accessibilityLiveRegion="polite"` is RN's `role="status"`: a toast never interrupts.
 */
export function Toast({
  tone = 'success',
  title,
  description,
  icon,
  action,
  style,
}: NativeToastProps) {
  const pair = TONE[tone];
  return (
    <View accessibilityLiveRegion="polite" style={[styles.card, style]}>
      <View style={[styles.mark, { backgroundColor: pair.bg }]}>
        {icon ?? <CheckGlyph color={pair.text} />}
      </View>
      <View style={styles.body}>
        <Text style={titleStyle}>{title}</Text>
        {description !== undefined ? (
          <Text variant="body-sm" color="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

/* -0.01em of the 15px body size, in points — RN letterSpacing has no em unit. */
const titleStyle: TextStyle = { fontWeight: '700', letterSpacing: -0.15 };

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    maxWidth: 420,
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    ...theme.elevation.e5,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
});
