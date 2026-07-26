import { theme } from '@heliogrid/tokens/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';

/**
 * Linear progress. 6px pill track; fill accent, or brand gradient for AI/long-running
 * ops only. Web ref: _ds_bundle components/feedback/ProgressBar.jsx.
 * RN adaptation: no LinearGradient dependency — gradient={true} approximates
 * --gradient-brand as a hard two-stop fill (iris-violet base + iris-blue right half via
 * a nested view). Swap for a real gradient if react-native-linear-gradient ever lands.
 */
export interface ProgressBarProps {
  value?: number;
  gradient?: boolean;
  style?: ViewStyle;
}

// Web-ref dimension (component spec, not a spacing-scale value).
const TRACK_HEIGHT = 6;

const EASE_STANDARD = Easing.bezier(...theme.motion.easings.standard);

export function ProgressBar({ value = 0, gradient = false, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const anim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: theme.motion.durations.emphasised,
      easing: EASE_STANDARD,
      useNativeDriver: false, // width is a layout property
    }).start();
  }, [pct, anim]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={[styles.track, style]}
    >
      <Animated.View
        style={[styles.fill, gradient ? styles.fillGradientBase : styles.fillAccent, { width }]}
      >
        {gradient && <View pointerEvents="none" style={styles.fillGradientEnd} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    width: '100%',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius['r-pill'],
    overflow: 'hidden',
  },
  fillAccent: {
    backgroundColor: theme.colors.accent,
  },
  fillGradientBase: {
    backgroundColor: theme.colors['iris-violet'],
  },
  fillGradientEnd: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '50%',
    backgroundColor: theme.colors['iris-blue'],
    borderTopRightRadius: theme.radius['r-pill'],
    borderBottomRightRadius: theme.radius['r-pill'],
  },
});
