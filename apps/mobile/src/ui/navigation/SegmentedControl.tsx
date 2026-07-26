import { theme } from '@heliogrid/tokens/theme';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { AppText } from '../AppText';

/**
 * Segmented control — pill track on canvas-sunken, white active thumb (e1 per task spec;
 * web ref shows e2), spring slide. Web ref: _ds_bundle navigation/SegmentedControl.jsx.
 * RN adaptations: track stretches full width with equal-flex segments (the web inline
 * hug has no RN equivalent that keeps the thumb math exact — constrain via `style`);
 * spring params approximate the --ease-spring cubic-bezier overshoot; the label colour
 * change is instant (native-driver colour transitions are unsupported).
 */
export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  density?: 'expressive' | 'functional';
  style?: ViewStyle;
}

const TRACK_PAD = theme.spacing['sp-1'];
// Option heights: 36 expressive / 32 functional (web ref is 32; density varies spacing
// only). hitSlop tops both up to the 44pt target.
const OPTION_HEIGHT = { expressive: 36, functional: 32 } as const;
// Approximates --ease-spring cubic-bezier(0.34,1.56,0.64,1): damping ratio ~0.73.
const SPRING = { stiffness: 320, damping: 26, mass: 1 } as const;

export function SegmentedControl({
  options,
  value,
  onChange,
  density = 'expressive',
  style,
}: SegmentedControlProps) {
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [segWidth, setSegWidth] = useState(0);
  const tx = useRef(new Animated.Value(0)).current;
  const optionHeight = OPTION_HEIGHT[density];
  const hitSlopV = Math.max(0, (44 - optionHeight - TRACK_PAD * 2) / 2 + TRACK_PAD);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = (e.nativeEvent.layout.width - TRACK_PAD * 2) / Math.max(1, options.length);
    setSegWidth(w);
    tx.setValue(idx * w); // (re)position without animation on layout
  };

  useEffect(() => {
    if (segWidth <= 0) return;
    Animated.spring(tx, { toValue: idx * segWidth, useNativeDriver: true, ...SPRING }).start();
  }, [idx, segWidth, tx]);

  return (
    <View accessibilityRole="tablist" onLayout={onLayout} style={[styles.track, style]}>
      {segWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.thumb, { width: segWidth, transform: [{ translateX: tx }] }]}
        />
      )}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={{ top: hitSlopV, bottom: hitSlopV }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              { height: optionHeight },
              pressed && styles.optionPressed,
            ]}
          >
            {/* biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role, not ARIA */}
            <AppText
              color={active ? theme.colors['text-primary'] : theme.colors['text-secondary']}
              role="body-sm"
              weight="500"
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    position: 'relative',
    padding: TRACK_PAD,
    backgroundColor: theme.colors['canvas-sunken'],
    borderRadius: theme.radius['r-pill'],
  },
  thumb: {
    position: 'absolute',
    top: TRACK_PAD,
    bottom: TRACK_PAD,
    left: TRACK_PAD,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
  },
  optionPressed: {
    transform: [{ scale: theme.motion.pressScale.button }],
  },
});
