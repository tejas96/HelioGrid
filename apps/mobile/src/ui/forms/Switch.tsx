import { theme } from '@heliogrid/tokens/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/** _adherence allowlist: checked, onChange, label, disabled, id, style. */
export interface SwitchProps {
  checked?: boolean;
  /** RN adaptation: receives the next checked value (web passes the change event). */
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  style?: ViewStyle;
}

const [x1, y1, x2, y2] = theme.motion.easings.spring;
// Thumb travel: left 4 → 24 in the 52×32 ds-ref track.
const TRAVEL = 20;

/** 52×32 switch. Track canvas-sunken → accent fill when on. White 24px thumb + e2, spring easing. */
export function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  style,
}: SwitchProps) {
  const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: checked ? 1 : 0,
      duration: theme.motion.durations.standard,
      easing: Easing.bezier(x1, y1, x2, y2),
      // JS driver: backgroundColor interpolation is not supported natively.
      useNativeDriver: false,
    }).start();
  }, [checked, anim]);
  const trackColor = disabled
    ? theme.colors['canvas-sunken']
    : anim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors['canvas-sunken'], theme.colors.accent],
      });
  return (
    <Pressable
      nativeID={id}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      // 44pt target: 32px visual track — vertical hitSlop extends the touch area.
      hitSlop={{ top: 6, bottom: 6 }}
      style={[styles.row, style]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [
                { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }) },
              ],
            },
          ]}
        />
      </Animated.View>
      {label != null && (
        <AppText
          role="body"
          color={disabled ? theme.colors['text-disabled'] : theme.colors['text-primary']}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing['sp-3'],
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: theme.radius['r-pill'],
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: 24,
    height: 24,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
});
