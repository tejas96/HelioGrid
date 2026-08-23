import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { renderActionReason } from '../ActionReason/ActionReason.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import { hasReason, normalise } from './SegmentedControl.options';
import type { SegmentedControlProps, SegmentedOption } from './SegmentedControl.types';

interface NativeSegmentedControlProps extends SegmentedControlProps {
  style?: StyleProp<ViewStyle>;
}

const PAD = theme.spacing['sp-1'];

/**
 * Pill segmented control on a sunken track; the active white pill springs between segments.
 *
 * A NAMED OR ERRORED CONTROL IS A FIELD HERE TOO: the group is a `radiogroup` and each segment a
 * `radio` carrying `accessibilityState.checked`, so the chosen one is announced and not left to
 * the white pill alone.
 *
 * THREE WEB BEHAVIOURS MAP DIFFERENTLY ON TOUCH. Arrow-key roving has no equivalent — selection
 * is a tap, and the field form's one-tab-stop rule is a keyboard concept. `aria-describedby`
 * has none either, so a reasoned segment's sentence is a sibling the screen reader reaches by
 * swipe. And the error ring is a real 1.5px border rather than an inset box-shadow, which RN
 * does not have; the track's padding absorbs it so the pill geometry is unchanged.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  error,
  style,
}: NativeSegmentedControlProps) {
  const items = normalise(options);
  const index = Math.max(
    0,
    items.findIndex((option) => option.value === value),
  );
  const [trackWidth, setTrackWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const segmentWidth = items.length > 0 ? Math.max(0, trackWidth - PAD * 2) / items.length : 0;
  const reasoned = items.filter((option) => option.disabled === true && hasReason(option));
  const isField = label !== undefined || error !== undefined;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: PAD + index * segmentWidth,
      duration: theme.motion.durations.emphasised,
      easing: Easing.bezier(...theme.motion.easings.spring),
      useNativeDriver: true,
    }).start();
  }, [index, segmentWidth, slide]);

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        accessibilityRole={isField ? 'radiogroup' : undefined}
        onLayout={onLayout}
        style={[styles.track, error !== undefined ? styles.trackError : undefined]}
      >
        <Animated.View
          style={[styles.indicator, { width: segmentWidth, transform: [{ translateX: slide }] }]}
        />
        {items.map((option) => (
          <Segment
            key={option.value}
            option={option}
            active={option.value === value}
            isField={isField}
            onSelect={() => onChange?.(option.value)}
          />
        ))}
      </View>
      {reasoned.map((option) => (
        <View key={option.value}>{renderActionReason(option.disabledReason)}</View>
      ))}
      {error !== undefined ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

interface SegmentProps {
  option: SegmentedOption;
  active: boolean;
  isField: boolean;
  onSelect: () => void;
}

/**
 * One segment. THE FIELD FORM IS A REAL RADIO ON TOUCH TOO — the web half's `role="radio"` plus
 * `aria-checked` maps to `accessibilityRole="radio"` with `accessibilityState.checked`, so which
 * of ONGRID / OFFGRID / HYBRID is chosen is announced rather than carried by the white pill alone.
 * Both go through the `Pressable` primitive, which is where the 44dp floor and the pressed
 * treatment come from as well.
 */
function Segment({ option, active, isField, onSelect }: SegmentProps) {
  const off = option.disabled === true;
  return (
    <Pressable
      accessibilityRole={isField ? 'radio' : 'button'}
      accessibilityState={isField ? { checked: active, disabled: off } : { disabled: off }}
      accessibilityLabel={option.label}
      disabled={off}
      onPress={() => {
        if (!off) {
          onSelect();
        }
      }}
      style={styles.segment}
    >
      {off ? <OffGlyph /> : null}
      <Text variant="body-sm" color={active ? 'primary' : 'secondary'} style={styles.word}>
        {option.label}
      </Text>
      {option.count !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.count}>
          {option.count > 99 ? '99+' : String(option.count)}
        </Text>
      ) : null}
      {renderMarks(option.marks)}
    </Pressable>
  );
}

/**
 * Off-ness is a GLYPH, not a colour step — no colour clears 4.5:1 on `--canvas-sunken` while
 * still reading as "off", and the label stays `--text-secondary`.
 */
function OffGlyph() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={theme.colors['text-secondary']}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M8.5 12h7"
        stroke={theme.colors['text-secondary']}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
    gap: 6,
  },
  label: {
    fontWeight: '500',
  },
  track: {
    position: 'relative',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: theme.radius['r-pill'],
    padding: PAD,
    backgroundColor: theme.colors['canvas-sunken'],
  },
  trackError: {
    borderWidth: 1.5,
    borderColor: theme.colors.danger,
    padding: PAD - 1.5,
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: 0,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  /* The 44dp target around the 32dp pill: the extra 12dp is taken back as negative margin, so the
     control still renders 40dp tall and the sliding indicator is untouched. */
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minWidth: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    marginVertical: -6,
    borderRadius: theme.radius['r-pill'],
    paddingHorizontal: 18,
  },
  word: {
    fontWeight: '500',
  },
  count: {
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
