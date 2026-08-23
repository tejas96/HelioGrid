import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { bannerKind, isNeverDismissible } from './Banner.kinds';
import type { BannerGlyph, BannerProps, BannerTone } from './Banner.types';

interface NativeBannerProps extends BannerProps {
  style?: StyleProp<ViewStyle>;
}

interface TonePair {
  text: string;
  bg: string;
}

/* Every tone is a -text token on its -bg partner: the tint is the mark, the words are the message. */
const TONES: Record<BannerTone, TonePair> = {
  danger: { text: theme.colors['danger-text'], bg: theme.colors['danger-bg'] },
  warning: { text: theme.colors['warning-text'], bg: theme.colors['warning-bg'] },
  info: { text: theme.colors['info-text'], bg: theme.colors['info-bg'] },
  success: { text: theme.colors['success-text'], bg: theme.colors['success-bg'] },
  accent: { text: theme.colors.accent, bg: theme.colors['accent-subtle'] },
  neutral: { text: theme.colors['text-secondary'], bg: theme.colors['neutral-bg'] },
};

const GLYPH_PATHS: Record<BannerGlyph, string[]> = {
  alert: ['M12 9v4M12 17h.01'],
  info: ['M12 11v5M12 8h.01'],
  rupee: ['M7 5h10M7 9h10M15 5c0 4-3.5 4-8 4l8 10'],
  review: ['M12 3 3 20h18z', 'M12 10v4M12 17h.01'],
  spark: ['M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18'],
};

const GLYPH_CIRCLE: Record<BannerGlyph, boolean> = {
  alert: true,
  info: true,
  rupee: false,
  review: false,
  spark: false,
};

function Glyph({ name, size, color }: { name: BannerGlyph; size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPH_CIRCLE[name] ? <Circle cx={12} cy={12} r={9} /> : null}
      {GLYPH_PATHS[name].map((d) => (
        <Path key={d} d={d} />
      ))}
    </Svg>
  );
}

/**
 * Without a title the body IS the statement, so it keeps the tone colour and a heavier weight.
 * Under a title it steps back to --text-secondary at 400: the title is the fact, this is detail.
 */
function Body({ title, children, tone }: { title?: string; children: ReactNode; tone: string }) {
  if (title === undefined) {
    return (
      <Text variant="body-sm" style={[styles.bodyAlone, { color: tone }]}>
        {children}
      </Text>
    );
  }
  return (
    <Text variant="body-sm" color="secondary" style={styles.bodyUnderTitle}>
      {children}
    </Text>
  );
}

function Dismiss({ tone, onDismiss }: { tone: string; onDismiss: () => void }) {
  return (
    <Pressable accessibilityLabel="Dismiss" onPress={onDismiss} style={styles.dismiss}>
      <Svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
      >
        <Path d="M18 6 6 18M6 6l12 12" />
      </Svg>
    </Pressable>
  );
}

/** The in-page statement of a fact about what's on screen. Never covers content, never blocks. */
export function Banner({
  kind = 'state',
  title,
  children,
  action,
  onDismiss,
  dismissible,
  tone,
  variant = 'block',
  density = 'expressive',
  icon,
  style,
}: NativeBannerProps) {
  const meta = bannerKind(kind);
  const pair = TONES[tone ?? meta.tone];
  const canDismiss = (dismissible ?? false) && !isNeverDismissible(kind) && onDismiss !== undefined;
  useEffect(() => {
    if (kind === 'disclaimer') {
      console.warn(
        'Banner kind="disclaimer" is superseded by <Disclosure>. M06-04 / SCR-M06-17 require the line in the reading flow at the weight of the figures it qualifies, on the customer\'s own surface — a banner is operator chrome (MS9-11), it can be capped by BannerStack, and its strip is the wrong weight. This banner is never dismissible, but move it.',
      );
    }
  }, [kind]);

  /* RN has no `status` role; a polite live region is its equivalent, and `alert` maps straight. */
  const alerting = meta.role === 'alert';
  const a11y = {
    accessibilityRole: alerting ? ('alert' as const) : undefined,
    accessibilityLiveRegion: alerting ? undefined : ('polite' as const),
  };

  if (variant === 'pill') {
    return (
      <View {...a11y} style={[styles.pill, { backgroundColor: pair.bg }, style]}>
        {icon ?? <Glyph name={meta.icon} size={16} color={pair.text} />}
        <Text variant="body-sm" style={[styles.pillWords, { color: pair.text }]}>
          {title ?? children}
        </Text>
        {action}
      </View>
    );
  }

  return (
    <View
      {...a11y}
      style={[
        styles.block,
        density === 'functional' ? styles.blockFunctional : styles.blockExpressive,
        { backgroundColor: pair.bg },
        style,
      ]}
    >
      <View style={styles.glyph}>
        {icon ?? <Glyph name={meta.icon} size={17} color={pair.text} />}
      </View>
      <View style={styles.content}>
        {title === undefined ? null : (
          <Text variant="body-sm" style={[styles.title, { color: pair.text }]}>
            {title}
          </Text>
        )}
        {children === undefined || children === null ? null : (
          <Body title={title} tone={pair.text}>
            {children}
          </Body>
        )}
      </View>
      {action === undefined ? null : <View style={styles.actionSlot}>{action}</View>}
      {canDismiss ? <Dismiss tone={pair.text} onDismiss={onDismiss} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  blockExpressive: {
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: 14,
    borderRadius: theme.radius['r-sm'],
  },
  blockFunctional: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-lg'],
  },
  glyph: {
    flexShrink: 0,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  bodyAlone: {
    fontWeight: '500',
  },
  bodyUnderTitle: {
    marginTop: theme.spacing['sp-0-5'],
  },
  actionSlot: {
    flexShrink: 0,
    marginTop: -2,
  },
  dismiss: {
    margin: -theme.spacing['sp-3'],
    marginLeft: 0,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    opacity: 0.7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing['sp-2'],
    minHeight: 32,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: theme.radius['r-pill'],
    ...theme.elevation.e1,
  },
  pillWords: {
    fontWeight: '500',
  },
});
