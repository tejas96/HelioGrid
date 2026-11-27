import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import type { SliderProps } from './Slider.types';
import { SliderTrack } from './SliderTrack.native';
import {
  fillPercent,
  formatValue,
  markPercent,
  nudged,
  stepperOff,
  tickNudged,
  ticksOnTrack,
} from './slider-math';
import { useHeldValue } from './use-held-value';

interface NativeSliderProps extends SliderProps {
  style?: StyleProp<ViewStyle>;
}

interface StepButtonProps {
  disabled: boolean;
  glyph: ShellGlyphName;
  label: TranslatedText;
  onPress: () => void;
}

/** A 44dp minus/plus either side of the track — the Pressable primitive owns that floor. */
function StepButton({ disabled, glyph, label, onPress }: StepButtonProps) {
  /* The opposite of what holds it (`F7-15`); sunk below the fill at its limit — see the web half. */
  const { controlFill, controlFillDisabled } = useGround();
  const fill = disabled ? controlFillDisabled : controlFill;
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, { backgroundColor: fill }]}
    >
      <ShellGlyph
        name={glyph}
        size="sm"
        ink={disabled ? colors['text-disabled'] : colors['text-primary']}
      />
    </Pressable>
  );
}

/**
 * Slider with stepper buttons. The step-wide law (MS3-27): a drag reports live via `onInput` and
 * commits exactly once via `onCommit`, so one drag is one undo entry. Stepper buttons flank the
 * track because a gloved thumb cannot land a 1 degree change on a roof.
 */
export function Slider({
  value = 0,
  onInput,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  label,
  labelSpokenOnly = false,
  unit,
  hint,
  words,
  mark,
  ticks,
  format,
  steppers = true,
  disabled = false,
  focusRequest,
  provenance,
  density = 'expressive',
  style,
}: NativeSliderProps) {
  // A focus asked lands the screen reader on the track, never the keyboard's: a slider has none.
  const track = useRef<View>(null);
  useEffect(() => {
    if (focusRequest === undefined || focusRequest === 0) return;
    focusScreenReaderOn(() => track.current);
  }, [focusRequest]);
  const held = useHeldValue(value);
  const percent = fillPercent(held.shown, min, max);
  const shown = formatValue(held.shown, unit, format);
  /* A props object or a bare tier — `Provenance`'s own resolver decides, at the
     12px type floor. `"unmarked"` comes back null and the slot collapses. */
  const provenanceNode = renderProvenance(provenance, { size: 12 });

  const live = (next: number) => {
    held.hold(next);
    onInput?.(next);
  };
  const commit = (next: number) => {
    held.let();
    onCommit?.(next);
  };
  const stepped = (direction: -1 | 1) =>
    ticks === undefined || ticks.length === 0
      ? nudged(value, direction, min, max, step)
      : tickNudged(value, direction, ticks, step);
  const nudge = (direction: number) => {
    const next = stepped(direction < 0 ? -1 : 1);
    if (next === null) return;
    live(next);
    commit(next);
  };
  const off = (direction: -1 | 1) =>
    stepperOff(direction, value, min, max, disabled) || stepped(direction) === null;
  const onTrack = ticksOnTrack(ticks, min, max);
  const named = onTrack.filter(({ tick }) => tick.label !== undefined);

  return (
    <View style={style}>
      {!labelSpokenOnly && (label !== undefined || unit !== undefined || hint !== undefined) ? (
        <View style={[styles.head, density === 'functional' ? styles.headFunctional : undefined]}>
          <Text variant="body-sm" color="secondary" style={styles.label}>
            {label ?? ''}
          </Text>
          <Text variant="body" color={disabled ? 'disabled' : 'primary'} style={styles.valueWords}>
            {shown}
          </Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {steppers ? (
          <StepButton
            disabled={off(-1)}
            glyph="minus"
            label={words.decrease(label)}
            onPress={() => nudge(-1)}
          />
        ) : null}
        <SliderTrack
          trackRef={track}
          disabled={disabled}
          label={label}
          max={max}
          min={min}
          onCommit={commit}
          onLive={live}
          onLet={() => {
            held.let();
            onInput?.(value);
          }}
          onNudge={nudge}
          percent={percent}
          mark={markPercent(mark, min, max)}
          ticks={onTrack.map(({ percent: at }) => at)}
          shown={shown}
          step={step}
          value={value}
        />
        {steppers ? (
          <StepButton
            disabled={off(1)}
            glyph="plus"
            label={words.increase(label)}
            onPress={() => nudge(1)}
          />
        ) : null}
      </View>
      {named.length === 0 ? null : (
        <View
          style={[styles.ticks, steppers ? styles.ticksBesideSteppers : undefined]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {named.map(({ tick, percent: at }) => (
            <View key={tick.value} style={[styles.tickWord, { left: `${at}%` }]}>
              <Text variant="caption" color="secondary" style={styles.tickText}>
                {tick.label}
              </Text>
            </View>
          ))}
        </View>
      )}
      {provenanceNode === null ? null : <View style={styles.underTrack}>{provenanceNode}</View>}
      {hint !== undefined ? (
        <Text variant="caption" color="tertiary" style={styles.underTrack}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    marginBottom: theme.spacing['sp-2'],
  },
  headFunctional: {
    marginBottom: 6,
  },
  label: {
    fontWeight: '500',
  },
  valueWords: {
    fontWeight: '700',
    letterSpacing: theme.type.roles.button.letterSpacing,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  step: {
    width: 44,
    height: 44,
    borderRadius: theme.radius['r-pill'],
  },
  /* Each tick's word under its tick: the row starts where the track does. */
  ticks: {
    height: 18,
    marginTop: theme.spacing['sp-1'],
  },
  ticksBesideSteppers: {
    marginHorizontal: 44 + 10,
  },
  /* A word centred on its tick: a wide box centred on the point, the word in its middle. */
  tickWord: {
    position: 'absolute',
    top: 0,
    width: 48,
    marginLeft: -24,
    alignItems: 'center',
  },
  tickText: {
    fontVariant: ['tabular-nums'],
  },
  underTrack: {
    marginTop: theme.spacing['sp-2'],
    marginHorizontal: theme.spacing['sp-0-5'],
  },
});
