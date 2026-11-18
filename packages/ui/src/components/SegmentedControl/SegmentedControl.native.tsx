import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { clampCount } from '../../utils/count';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { renderActionReason } from '../ActionReason/ActionReason.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import {
  isChosen,
  isFieldControl,
  reasonedOptions,
  selectedIndex,
} from './SegmentedControl.options';
import type { SegmentedControlProps, SegmentedOption } from './SegmentedControl.types';

interface NativeSegmentedControlProps extends SegmentedControlProps {
  style?: StyleProp<ViewStyle>;
}

/* The track's inset (OneOhm's 2 px) and its hairline: the edge is a real border on the phone, so the
   thumb sits one edge in from the padding box to stand where the web's does. */
const PAD = theme.spacing['sp-0-5'];
const EDGE = 1;
const INSET = PAD - EDGE;

/**
 * OneOhm's segmented control: a sunken track with a hairline, and a white raised thumb that springs
 * between segments; the chosen words are ink, the others muted.
 *
 * A NAMED OR ERRORED CONTROL IS A FIELD HERE TOO: the group is a `radiogroup` and each segment a
 * `radio` carrying `accessibilityState.checked`, so the chosen one is announced and not left to
 * the thumb alone.
 *
 * THREE WEB BEHAVIOURS MAP DIFFERENTLY ON TOUCH. Arrow-key roving has no equivalent — selection
 * is a tap, and the field form's one-tab-stop rule is a keyboard concept. `aria-describedby`
 * has none either, so a reasoned segment's sentence is a sibling the screen reader reaches by
 * swipe. And the hairline and the error ring are a real border rather than an inset box-shadow,
 * which RN does not have; the track's padding absorbs it so the thumb's geometry is unchanged.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  error,
  iconOnly = false,
  fill = false,
  style,
}: NativeSegmentedControlProps) {
  const index = selectedIndex(options, value);
  const [trackWidth, setTrackWidth] = useState(0);
  /* The track is recessed and the thumb in view white and raised, on every ground. */
  const slide = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const segmentWidth = options.length > 0 ? Math.max(0, trackWidth - PAD * 2) / options.length : 0;
  const reasoned = reasonedOptions(options);
  const isField = isFieldControl({ label, ariaLabel, error });

  useEffect(() => {
    const to = INSET + index * segmentWidth;
    if (reduced) {
      slide.setValue(to);
      return;
    }
    const move = Animated.spring(slide, {
      toValue: to,
      ...theme.motion.springs.snappy,
      useNativeDriver: true,
    });
    move.start();
    return () => move.stop();
  }, [index, segmentWidth, slide, reduced]);

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.wrapper, fill ? styles.wrapperFill : null, style]}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        accessibilityRole={isField ? 'radiogroup' : undefined}
        accessibilityLabel={label === undefined ? ariaLabel : undefined}
        onLayout={onLayout}
        style={[
          styles.track,
          fill ? styles.trackFill : null,
          { backgroundColor: colors['canvas-sunken'] },
          error !== undefined ? styles.trackError : undefined,
        ]}
      >
        {isChosen(options, value) ? (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: segmentWidth,
                transform: [{ translateX: slide }],
              },
            ]}
          />
        ) : null}
        {options.map((option) => (
          <Segment
            key={option.value}
            option={option}
            active={option.value === value}
            isField={isField}
            iconOnly={iconOnly}
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
  iconOnly: boolean;
  onSelect: () => void;
}

/**
 * One segment. THE FIELD FORM IS A REAL RADIO ON TOUCH TOO — the web half's `role="radio"` plus
 * `aria-checked` maps to `accessibilityRole="radio"` with `accessibilityState.checked`, so which
 * of ONGRID / OFFGRID / HYBRID is chosen is announced rather than carried by the wash alone.
 * Both go through the `Pressable` primitive, which is where the 44dp floor and the pressed
 * treatment come from as well.
 */
function Segment({ option, active, isField, iconOnly, onSelect }: SegmentProps) {
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
      {option.glyph === undefined ? null : (
        <ShellGlyph name={option.glyph} size="md" tone={active ? 'primary' : 'secondary'} />
      )}
      {iconOnly ? null : (
        <Text
          variant="body-sm"
          color="secondary"
          lang={option.lang}
          style={active ? [styles.word, inView] : styles.word}
        >
          {option.label}
        </Text>
      )}
      {option.count !== undefined ? (
        <Text
          variant="body-sm"
          color="secondary"
          style={active ? [styles.count, inView] : styles.count}
        >
          {clampCount(option.count, option.countMax)}
        </Text>
      ) : null}
      {renderMarks(option.marks)}
    </Pressable>
  );
}

/**
 * Off-ness is a GLYPH, not a colour step — no colour clears 4.5:1 on the page's well track while
 * still reading as "off", and the label stays `--text-secondary`.
 */
function OffGlyph() {
  return <ShellGlyph name="minus-circle" size="dense" ink={colors['text-secondary']} />;
}

/* The segment in view's words and count: ink on the white thumb. */
const inView = { color: colors['text-primary'] };

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
  },
  /* `fill`: the track runs its holder's width, its segments sharing it equally. */
  wrapperFill: { alignItems: 'stretch' },
  trackFill: { alignSelf: 'stretch' },
  label: {
    fontWeight: '500',
  },
  track: {
    position: 'relative',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: theme.radius['r-control'],
    borderWidth: EDGE,
    borderColor: colors['line-soft'],
    padding: INSET,
  },
  trackError: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    padding: PAD - 1.5,
  },
  indicator: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    left: 0,
    borderRadius: theme.radius['rf-sm'],
    borderWidth: EDGE,
    borderColor: colors['line-soft'],
    /* The raised step on the well: white in light, a step lighter than the well in dark. */
    backgroundColor: colors['surface-raised'],
    ...theme.elevation.e1,
  },
  /* The 44dp target around the 40dp thumb: the track's inset is taken back as negative margin, so
     the control renders 44dp tall and the sliding indicator is untouched. */
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minWidth: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    marginVertical: -PAD,
    borderRadius: theme.radius['rf-sm'],
    /* The phone's segments share the width equally, so a word gets only what the segment leaves:
       at the web's 18 a four-part switch broke *Sections* in two at 402 (`SCR-M01-19`). A phone
       label wraps where the web's stays on one line, and caller text is never cut. */
    paddingHorizontal: theme.spacing['sp-2'],
  },
  word: {
    fontWeight: '500',
  },
  count: {
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
