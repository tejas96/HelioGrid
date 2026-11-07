import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import type { ToastProps, ToastTone } from './Toast.types';

interface TonePair {
  text: ThemeColor;
  bg: ThemeColor;
}

/** The semantic `-text` on `-bg` partner pairs — the same ones StatusMark resolves. */
const TONE: Record<ToastTone, TonePair> = {
  success: { text: colors['success-text'], bg: colors['success-bg'] },
  warning: { text: colors['warning-text'], bg: colors['warning-bg'] },
  danger: { text: colors['danger-text'], bg: colors['danger-bg'] },
  info: { text: colors['info-text'], bg: colors['info-bg'] },
  neutral: { text: colors['neutral-text'], bg: colors['neutral-bg'] },
};

interface NativeToastProps extends ToastProps {
  style?: StyleProp<ViewStyle>;
}

/** The default mark: a check. One glyph for every tone — the words carry the tone. */
function CheckGlyph({ color }: { color: ThemeColor }) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name="tick-long" />
    </Svg>
  );
}

/**
 * The ink pill with a leading semantic icon in a circular tint, or a Lottie moment. e5, sits above
 * the bottom nav.
 * `accessibilityLiveRegion="polite"` is RN's `role="status"`: a toast never interrupts.
 */
export function Toast({
  tone = 'success',
  title,
  description,
  icon,
  moment,
  action,
  style,
}: NativeToastProps) {
  const pair = TONE[tone];
  return (
    <View accessibilityLiveRegion="polite" style={[styles.card, style]}>
      {moment === undefined ? (
        <View style={[styles.mark, { backgroundColor: pair.bg }]}>
          {icon ?? <CheckGlyph color={pair.text} />}
        </View>
      ) : (
        <View style={styles.moment}>
          <LottieMoment name={moment} size={48} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={[titleStyle, onInk]}>{title}</Text>
        {description !== undefined ? (
          <Text variant="body-sm" style={onInk}>
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

/* -0.01em of the 15px body size, in points — RN letterSpacing has no em unit. */
const titleStyle: TextStyle = { fontWeight: '600', letterSpacing: -0.15 };
/* The pill's words: the page's own colour on the ink (`on-ink` on `ink`). */
const onInk: TextStyle = { color: colors['on-ink'] };

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    maxWidth: 420,
    paddingVertical: theme.spacing['sp-2'],
    paddingLeft: theme.spacing['sp-2'],
    paddingRight: theme.spacing['sp-5'],
    /* The ink pill, as the active nav item and a tooltip are. */
    backgroundColor: colors.ink,
    borderRadius: theme.radius['r-pill'],
    ...theme.elevation.e5,
  },
  moment: { flexShrink: 0, marginVertical: -theme.spacing['sp-1'] },
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
