import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../primitives/Text';
import { roleOf } from '../../primitives/Text/Text.logic';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { DIGITS, figureParts } from './RollingNumber.logic';
import type { RollingNumberProps } from './RollingNumber.types';

const [x1, y1, x2, y2] = theme.motion.easings.enter;
const ENTER = Easing.bezier(x1, y1, x2, y2);

/**
 * The phone half: each digit is a box one line tall with its column of 0–9 inside, moved by one
 * native-driver transform from 0 to its digit the first time the figure is drawn. A later figure
 * (a refreshed read) settles at once; under reduced motion it is simply there. A screen reader
 * hears the settled figure, once.
 */
export function RollingNumber({ value, variant = 'body', color, bold }: RollingNumberProps) {
  const reduced = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const role = roleOf(variant);
  const line = Math.round((role.lineHeight ?? role.fontSize * 1.3) * fontScale);
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const rolled = useRef(false);
  useEffect(() => {
    if (rolled.current || reduced) {
      progress.setValue(1);
      return;
    }
    rolled.current = true;
    const roll = Animated.timing(progress, {
      toValue: 1,
      duration: theme.motion.durations.data,
      easing: ENTER,
      useNativeDriver: true,
    });
    roll.start();
    return () => roll.stop();
  }, [progress, reduced]);
  const digitStyle = [styles.tabular, { height: line, lineHeight: line }];
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={value} style={styles.row}>
      <View importantForAccessibility="no-hide-descendants" style={styles.row}>
        {figureParts(value).map((part, index) =>
          part.kind === 'mark' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: a figure's places never reorder
            <Text key={index} variant={variant} color={color} bold={bold} style={digitStyle}>
              {part.text}
            </Text>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: a figure's places never reorder
            <View key={index} style={[styles.window, { height: line }]}>
              <Animated.View
                style={{
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -part.digit * line],
                      }),
                    },
                  ],
                }}
              >
                {DIGITS.map((digit) => (
                  <Text key={digit} variant={variant} color={color} bold={bold} style={digitStyle}>
                    {digit}
                  </Text>
                ))}
              </Animated.View>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  window: { overflow: 'hidden' },
  tabular: { fontVariant: ['tabular-nums'] },
});
