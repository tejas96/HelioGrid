import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import type { SliderProps } from './Slider.types';
import { SliderTrack } from './SliderTrack.native';
import { clampToRange, fillPercent, formatValue } from './slider-math';

interface NativeSliderProps extends SliderProps {
  style?: StyleProp<ViewStyle>;
}

interface StepButtonProps {
  disabled: boolean;
  glyph: string;
  label: string;
  onPress: () => void;
}

/** A 44dp minus/plus either side of the track — the Pressable primitive owns that floor. */
function StepButton({ disabled, glyph, label, onPress }: StepButtonProps) {
  return (
    <Pressable accessibilityLabel={label} disabled={disabled} onPress={onPress} style={styles.step}>
      <Svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke={disabled ? theme.colors['text-disabled'] : theme.colors['text-primary']}
        strokeWidth={2}
        strokeLinecap="round"
      >
        <Path d={glyph} />
      </Svg>
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
  unit,
  hint,
  format,
  steppers = true,
  disabled = false,
  provenance,
  density = 'expressive',
  style,
}: NativeSliderProps) {
  const percent = fillPercent(value, min, max);
  const shown = formatValue(value, unit, format);
  const named = label ?? 'value';
  /* A props object, a tier spec or a ready node — `Provenance`'s own resolver decides, at the
     12px type floor. `"unmarked"` comes back null and the slot collapses. */
  const provenanceNode = renderProvenance(provenance, { size: 12 });

  const live = (next: number) => onInput?.(next);
  const commit = (next: number) => onCommit?.(next);
  const nudge = (direction: number) => {
    const next = clampToRange(value + direction * step, min, max, step);
    live(next);
    commit(next);
  };

  return (
    <View style={style}>
      {label !== undefined || unit !== undefined || hint !== undefined ? (
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
            disabled={disabled || value <= min}
            glyph="M5 12h14"
            label={`Decrease ${named}`}
            onPress={() => nudge(-1)}
          />
        ) : null}
        <SliderTrack
          disabled={disabled}
          label={label}
          max={max}
          min={min}
          onCommit={commit}
          onLive={live}
          onNudge={nudge}
          percent={percent}
          shown={shown}
          step={step}
          value={value}
        />
        {steppers ? (
          <StepButton
            disabled={disabled || value >= max}
            glyph="M12 5v14M5 12h14"
            label={`Increase ${named}`}
            onPress={() => nudge(1)}
          />
        ) : null}
      </View>
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
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  underTrack: {
    marginTop: theme.spacing['sp-2'],
    marginHorizontal: theme.spacing['sp-0-5'],
  },
});
