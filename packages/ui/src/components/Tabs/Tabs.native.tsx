import { theme } from '@heliogrid/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { renderActionReason } from '../ActionReason/ActionReason.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import { hasReason, normalise } from './Tabs.options';
import type { TabsProps } from './Tabs.types';

interface NativeTabsProps extends TabsProps {
  style?: StyleProp<ViewStyle>;
}

interface Slot {
  x: number;
  width: number;
}

/**
 * Underline tabs — the same 2px accent indicator, slid with Animated over the measured slot
 * instead of the web's offsetLeft/offsetWidth.
 *
 * THE STRIP IS A `tablist` AND EACH TAB CARRIES `selected` — the RN reading of the web half's
 * `role="tablist"` and `aria-selected`, because the sliding rule and the weight are appearance
 * and appearance alone is F7-12.
 *
 * ONE WEB BEHAVIOUR MAPS DIFFERENTLY ON TOUCH: `aria-describedby` has no RN equivalent, so a
 * reasoned off tab's sentence is a sibling the screen reader reaches by swipe rather than a
 * description tied to the control. The disabled split is the same on both halves — a tab with a
 * stated reason is `accessibilityState.disabled` and stays pressable-shaped so the sentence is
 * reachable, while activation is refused here; a tab with nothing to hear takes the inert form.
 */
export function Tabs({ tabs, value, onChange, style }: NativeTabsProps) {
  const items = useMemo(() => normalise(tabs), [tabs]);
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const left = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = slots[value];
    if (target === undefined) {
      return;
    }
    const options = {
      duration: theme.motion.durations.emphasised,
      easing: Easing.bezier(...theme.motion.easings.standard),
      useNativeDriver: false,
    };
    Animated.parallel([
      Animated.timing(left, { toValue: target.x, ...options }),
      Animated.timing(width, { toValue: target.width, ...options }),
    ]).start();
  }, [slots, value, left, width]);

  const measure = (key: string) => (event: LayoutChangeEvent) => {
    const { x, width: measured } = event.nativeEvent.layout;
    setSlots((previous) => {
      const current = previous[key];
      if (current !== undefined && current.x === x && current.width === measured) {
        return previous;
      }
      return { ...previous, [key]: { x, width: measured } };
    });
  };

  const reasoned = items.filter((tab) => tab.disabled === true && hasReason(tab));

  return (
    <View style={style}>
      {/* The strip is the `tablist` the web half spells; the role goes on this plain View, so
          each tab underneath stays separately reachable. */}
      <View accessibilityRole="tablist" style={styles.strip}>
        {items.map((tab) => {
          const active = tab.value === value;
          const off = tab.disabled === true;
          const stated = off && hasReason(tab);
          return (
            <View key={tab.value} onLayout={measure(tab.value)}>
              <Pressable
                /* WHICH TAB IS CURRENT, said rather than underlined — `accessibilityRole="tab"`
                   with `selected` is the RN reading of `role="tab"` + `aria-selected`, and the
                   sliding 2px rule was the only channel before it.
                   NO `accessibilityLabel`: the web `<button>` carries none, so it announces the
                   label AND the count ("Proposals 12"); an explicit label here would replace both
                   with the label alone. */
                accessibilityRole="tab"
                accessibilityState={{ selected: active, disabled: off }}
                disabled={off && !stated}
                onPress={() => {
                  if (!off) {
                    onChange?.(tab.value);
                  }
                }}
                style={styles.tab}
              >
                <Text variant="body" style={labelStyle(active, off)}>
                  {tab.label}
                </Text>
                {tab.count !== undefined ? (
                  <View style={[styles.count, active ? styles.countActive : styles.countRest]}>
                    <Text variant="caption" style={countStyle(active, off)}>
                      {tab.count > 99 ? '99+' : String(tab.count)}
                    </Text>
                  </View>
                ) : null}
                {renderMarks(tab.marks)}
              </Pressable>
            </View>
          );
        })}
        <Animated.View style={[styles.indicator, { left, width }]} />
      </View>
      {reasoned.length > 0 ? (
        <View style={styles.reasons}>
          {reasoned.map((tab) => (
            <View key={tab.value}>{renderActionReason(tab.disabledReason)}</View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* An OFF tab is --text-tertiary, never --text-disabled: hiding it would rename the tab set,
   so the label is information. Off-ness rides the absent indicator and the reason instead. */
function labelStyle(active: boolean, off: boolean): TextStyle {
  if (off) {
    return { color: theme.colors['text-tertiary'] };
  }
  return active
    ? { color: theme.colors['text-primary'], fontWeight: '500' }
    : { color: theme.colors['text-secondary'] };
}

function countStyle(active: boolean, off: boolean): TextStyle {
  const base: TextStyle = { fontWeight: '500', fontVariant: ['tabular-nums'] };
  if (off || !active) {
    return { ...base, color: theme.colors['neutral-text'] };
  }
  return { ...base, color: theme.colors.accent };
}

const styles = StyleSheet.create({
  strip: {
    position: 'relative',
    flexDirection: 'row',
    gap: 28,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-2'],
    paddingBottom: theme.spacing['sp-3'],
  },
  count: {
    height: theme.spacing['sp-5'],
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    paddingHorizontal: 7,
  },
  countActive: {
    backgroundColor: theme.colors['accent-subtle'],
  },
  countRest: {
    backgroundColor: theme.colors['neutral-bg'],
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  reasons: {
    gap: theme.spacing['sp-1'],
    marginTop: theme.spacing['sp-2'],
  },
});
