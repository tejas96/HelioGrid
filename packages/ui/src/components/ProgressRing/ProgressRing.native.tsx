import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../primitives/Color/colors';
import { usePalette } from '../../primitives/Color/use-palette.native';
import { Text } from '../../primitives/Text';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { RollingNumber } from '../RollingNumber/RollingNumber.native';
import { RING_SIDE, RING_STROKE, ringArcOf } from './ProgressRing.logic';
import type { ProgressRingProps } from './ProgressRing.types';

const [x1, y1, x2, y2] = theme.motion.easings.enter;
const ENTER = Easing.bezier(x1, y1, x2, y2);

/** The arc turning in once on the native driver from a quarter back; still under reduced motion. */
function useSweep() {
  const reduced = useReducedMotion();
  const turn = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      turn.setValue(1);
      return;
    }
    const anim = Animated.timing(turn, {
      toValue: 1,
      duration: theme.motion.durations.data,
      easing: ENTER,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [turn, reduced]);
  return {
    opacity: turn,
    transform: [
      { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '-90deg'] }) },
    ],
  };
}

/**
 * The phone half: a track and an arc drawn as two SVG circles, the arc's length its share — the
 * brand sweep, or one flat `ink` on a well track — and its centre at the middle.
 */
export function ProgressRing(props: ProgressRingProps) {
  const { share, size = 'md', onPanel = false, ink } = props;
  const palette = usePalette();
  const sweep = useSweep();
  const side = RING_SIDE[size];
  const stroke = RING_STROKE[size];
  const { radius, length, arc } = ringArcOf(side, stroke, share);
  const named = props.spokenName !== undefined;
  const track = ink === undefined ? (onPanel ? palette['on-panel'] : palette.accent) : undefined;
  return (
    <View
      accessible={named}
      accessibilityRole={named ? 'image' : undefined}
      accessibilityLabel={props.spokenName}
      style={[styles.ring, { width: side, height: side }]}
    >
      <Svg width={side} height={side} style={StyleSheet.absoluteFill}>
        <Circle
          cx={side / 2}
          cy={side / 2}
          r={radius}
          stroke={track ?? colors['canvas-sunken']}
          strokeOpacity={track === undefined ? 1 : 0.14}
          strokeWidth={stroke}
          fill="none"
        />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, sweep]}>
        <Svg width={side} height={side}>
          {ink === undefined ? (
            <Defs>
              <LinearGradient id="hg-ring-arc" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={theme.brand.teal} />
                <Stop offset="1" stopColor={palette.accent} />
              </LinearGradient>
            </Defs>
          ) : null}
          {arc > 0 ? (
            <Circle
              cx={side / 2}
              cy={side / 2}
              r={radius}
              stroke={ink ?? 'url(#hg-ring-arc)'}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${arc} ${length}`}
              fill="none"
            />
          ) : null}
        </Svg>
      </Animated.View>
      <View
        style={styles.centre}
        importantForAccessibility={named ? 'no-hide-descendants' : undefined}
      >
        {named ? <Figure {...props} size={size} /> : props.children}
      </View>
    </View>
  );
}

function Figure({ value, caption, size }: ProgressRingProps & { size: string }) {
  if (size === 'sm') return <Text variant="mono">{value ?? ''}</Text>;
  return (
    <>
      <RollingNumber value={value ?? ''} variant={size === 'lg' ? 'display' : 'figure'} />
      <Text variant="caption" style={styles.caption}>
        {caption ?? ''}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  centre: { alignItems: 'center', gap: theme.spacing['sp-0-5'] },
  caption: { color: colors['on-panel-muted'], textAlign: 'center' },
});
