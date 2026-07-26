import { theme } from '@heliogrid/tokens/theme';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { AppText } from '../AppText';

/**
 * Underline tabs — 2px accent indicator slides between tabs, no border rule.
 * Web ref: _ds_bundle components/navigation/Tabs.jsx.
 * RN adaptation: the web version's Radix roving keyboard focus has no RN equivalent —
 * screen readers get tablist/tab roles + selected state instead. Indicator geometry is
 * measured per-tab via onLayout (snap on layout, animate on selection change).
 */
export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

// Web-ref dimensions (component spec, not spacing-scale values).
const TAB_GAP = 28;
const INDICATOR_HEIGHT = 2;

const EASE_STANDARD = Easing.bezier(...theme.motion.easings.standard);

export function Tabs({ items, value, onChange, style }: TabsProps) {
  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const left = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;

  const onTabLayout = (v: string) => (e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    layouts.current[v] = { x, width: w };
    if (v === value) {
      // Initial mount / relayout: position without animation.
      left.setValue(x);
      width.setValue(w);
    }
  };

  useEffect(() => {
    const target = layouts.current[value];
    if (!target) return; // not measured yet — onTabLayout will snap it into place
    const timing = { duration: theme.motion.durations.emphasised, easing: EASE_STANDARD };
    Animated.parallel([
      Animated.timing(left, { toValue: target.x, useNativeDriver: false, ...timing }),
      Animated.timing(width, { toValue: target.width, useNativeDriver: false, ...timing }),
    ]).start();
  }, [value, left, width]);

  return (
    <View accessibilityRole="tablist" style={[styles.root, style]}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={{ top: 6, bottom: 4 }}
            key={item.value}
            onLayout={onTabLayout(item.value)}
            onPress={() => onChange(item.value)}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            <AppText
              color={active ? theme.colors['text-primary'] : theme.colors['text-secondary']}
              weight={active ? '500' : '400'}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
      <Animated.View pointerEvents="none" style={[styles.indicator, { left, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    position: 'relative',
    gap: TAB_GAP,
  },
  tab: {
    paddingBottom: theme.spacing['sp-3'],
  },
  tabPressed: {
    transform: [{ scale: theme.motion.pressScale.button }],
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: theme.colors.accent,
  },
});
