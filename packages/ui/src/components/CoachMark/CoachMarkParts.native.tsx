import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { CoachMarkRect, PlacedCoachMark } from './coach-mark-place';

/** The system's own 2px accent ring around the live control. There is no scrim. */
export function CoachMarkRing({ rect, padding }: { rect: CoachMarkRect; padding: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        },
      ]}
    />
  );
}

interface HeadProps {
  counter: string | null;
  title: string;
  dismissLabel: string;
  onDismiss?: () => void;
}

export function CoachMarkHead({ counter, title, dismissLabel, onDismiss }: HeadProps) {
  return (
    <View style={styles.head}>
      <View style={styles.heading}>
        {counter === null ? null : (
          <Text variant="overline" color="tertiary">
            {counter}
          </Text>
        )}
        <Text variant="body" style={[styles.title, counter === null ? null : styles.titleGap]}>
          {title}
        </Text>
      </View>
      {onDismiss === undefined ? null : (
        <Pressable accessibilityLabel={dismissLabel} onPress={onDismiss} style={styles.dismiss}>
          <Svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors['text-tertiary']}
            strokeWidth={2}
            strokeLinecap="round"
          >
            <Path d="M18 6 6 18M6 6l12 12" />
          </Svg>
        </Pressable>
      )}
    </View>
  );
}

interface FootProps {
  steps: number;
  step?: number;
  isLast: boolean;
  nextLabel?: string;
  onNext?: () => void;
  onDismiss?: () => void;
}

/** The counter dots number only the marks the user will actually see, and the one forward act. */
export function CoachMarkFoot({ steps, step, isLast, nextLabel, onNext, onDismiss }: FootProps) {
  const dots = steps > 1 ? Array.from({ length: steps }, (_, index) => index + 1) : [];
  return (
    <View style={styles.foot}>
      <View style={styles.dots}>
        {dots.map((position) => (
          <View
            key={`dot-${position}`}
            style={[styles.dot, position === step ? styles.dotCurrent : null]}
          />
        ))}
      </View>
      <Pressable onPress={isLast ? (onDismiss ?? onNext) : onNext} style={styles.next}>
        <Text variant="body" style={styles.nextWords}>
          {nextLabel ?? (isLast ? 'Got it' : 'Next')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderRadius: theme.radius['r-md'],
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: 'transparent',
    /* The web half's second halo is a 10px accent bloom; RN draws one border, so the halo is a
       soft accent shadow instead. */
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
  },
  heading: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: theme.colors['text-primary'],
  },
  titleGap: {
    marginTop: 6,
  },
  dismiss: {
    marginTop: -12,
    marginRight: -12,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  dotCurrent: {
    width: 18,
    backgroundColor: theme.colors.accent,
  },
  /* Near-black, because a primary action is never coloured. */
  next: {
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['action-primary'],
  },
  nextWords: {
    fontWeight: '500',
    color: theme.colors['text-inverse'],
  },
  arrow: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: theme.colors.surface,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  arrowBottom: {
    top: -5,
  },
  arrowTop: {
    bottom: -5,
  },
});

export function CoachMarkArrow({ placed }: { placed: PlacedCoachMark }) {
  return (
    <View
      style={[
        styles.arrow,
        { left: placed.arrowX - 6 },
        placed.side === 'bottom' ? styles.arrowBottom : styles.arrowTop,
      ]}
    />
  );
}
