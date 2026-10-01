import { theme } from '@heliogrid/theme';
import { Linking, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { type ExplainerPagerModel, INFO_GLYPH, type PlacedExplainer } from './Explainer.logic';
import type { ExplainerAction } from './Explainer.types';

/** The default "i", drawn from the same geometry as the web half's. */
export function InfoGlyph({ size, color }: { size: number; color: string }) {
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
      <Circle {...INFO_GLYPH.ring} />
      <Path d={INFO_GLYPH.stem} />
      <Circle {...INFO_GLYPH.dot} fill={color} stroke="none" />
    </Svg>
  );
}

export function ExplainerArrow({ placed }: { placed: PlacedExplainer }) {
  const vertical = placed.side === 'top' || placed.side === 'bottom';
  return (
    <View
      style={[
        styles.arrow,
        vertical ? { left: placed.arrow - 6 } : { top: placed.arrow - 6 },
        ARROW_SIDE[placed.side],
      ]}
    />
  );
}

/** The one action. A link has no `<a>` here, so it opens the address — still a 44dp target. */
export function ExplainerActionControl({ action }: { action: ExplainerAction }) {
  const { href, onPress } = action;
  if (href !== undefined) {
    /* An address the phone cannot open rejects; the tap does nothing rather than crash. */
    const follow = () => Linking.openURL(href).catch(() => undefined);
    return (
      <Pressable onPress={follow} style={styles.link}>
        <Text variant="body-sm" color="accent" style={styles.linkWords}>
          {action.label}
        </Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={[styles.pill, styles.filled]}>
      <Text variant="body-sm" color="inverse" style={styles.pillWords}>
        {action.label}
      </Text>
    </Pressable>
  );
}

/** Back and Next on EVERY page; at an edge one is announced off but stays reachable. */
export function ExplainerPager({
  pager,
  onMove,
}: {
  pager: ExplainerPagerModel;
  onMove: (step: 'next' | 'back') => void;
}) {
  return (
    <View style={styles.pager}>
      <Text variant="caption" color="tertiary" style={styles.position}>
        {pager.position}
      </Text>
      <View style={styles.pagerButtons}>
        <PagerButton
          label={pager.backLabel}
          enabled={pager.canBack}
          filled={false}
          onPress={() => onMove('back')}
        />
        <PagerButton
          label={pager.nextLabel}
          enabled={pager.canNext}
          filled
          onPress={() => onMove('next')}
        />
      </View>
    </View>
  );
}

function PagerButton(props: {
  label: string;
  enabled: boolean;
  filled: boolean;
  onPress: () => void;
}) {
  const look = !props.enabled ? styles.off : props.filled ? styles.filled : styles.ghost;
  return (
    <Pressable
      accessibilityState={{ disabled: !props.enabled }}
      onPress={props.enabled ? props.onPress : undefined}
      style={[styles.pill, look]}
    >
      <Text
        variant="body-sm"
        color={!props.enabled ? 'disabled' : props.filled ? 'inverse' : 'secondary'}
        style={styles.pillWords}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    width: 12,
    height: 12,
    // biome-ignore lint/plugin/raw-white: float — a menu, a list, a calendar, a toast, a bubble: white with its shadow (F7-15)
    backgroundColor: theme.colors.surface,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  arrowBottom: { top: -5 },
  arrowTop: { bottom: -5 },
  arrowRight: { left: -5 },
  arrowLeft: { right: -5 },
  link: { alignSelf: 'flex-start', marginVertical: -6 },
  linkWords: { fontWeight: '500', textDecorationLine: 'underline' },
  pager: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  position: { fontWeight: '700' },
  pagerButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 18, borderRadius: theme.radius['r-pill'] },
  /* Near-black, because a primary action is never coloured. */
  filled: { backgroundColor: theme.colors['action-primary'] },
  /* The web ghost reads --control-edge so field mode can ring it; RN has no field-mode edge yet. */
  ghost: { paddingHorizontal: 14 },
  off: { backgroundColor: theme.colors['canvas-sunken'] },
  pillWords: { fontWeight: '500' },
});

const ARROW_SIDE = {
  bottom: styles.arrowBottom,
  top: styles.arrowTop,
  right: styles.arrowRight,
  left: styles.arrowLeft,
} as const;
