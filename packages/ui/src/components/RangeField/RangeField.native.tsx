import { theme } from '@heliogrid/theme';
import { useCallback } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { RangeEndBox } from './RangeEndBox.native';
import {
  pinnedPair,
  rangeIsAny,
  rangeReadout,
  reportRange,
  resolveRange,
} from './RangeField.logic';
import type { RangeFieldProps, RangeValue } from './RangeField.types';
import { RangeTrack } from './RangeTrack.native';

interface NativeRangeFieldProps extends RangeFieldProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    marginBottom: theme.spacing['sp-2'],
  },
  readout: { fontSize: 14, fontWeight: '700', letterSpacing: -0.14 },
  boxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  dash: { height: 44, alignItems: 'center', justifyContent: 'center' },
  hint: { marginTop: theme.spacing['sp-2'], marginHorizontal: 2 },
});

/**
 * Two ways in, one value out, on touch: the rail is the coarse gesture and the two boxes are the
 * exact one. `onInput` fires live during a drag, `onCommit` once on release or when a box commits.
 *
 * The ends cannot cross — a thumb dragged past its partner PINS rather than swapping, because a
 * swap loses which handle the finger is holding.
 */
export function RangeField({
  value = null,
  onInput,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit,
  hint,
  error,
  format,
  boxes = true,
  boxLabels,
  disabled = false,
  anyLabel,
  style,
}: NativeRangeFieldProps) {
  const [lo, hi] = resolveRange(value, min, max);
  const isAny = rangeIsAny([lo, hi], min, max);
  const shown = rangeReadout({ lo, hi, min, max, anyLabel, unit, format });

  const set = (next: RangeValue, live: boolean) => reportRange(next, live, { onInput, onCommit });

  const onDrag = useCallback(
    (end: 'lo' | 'hi', next: number, live: boolean) =>
      reportRange(pinnedPair(end, next, [lo, hi]), live, { onInput, onCommit }),
    [lo, hi, onInput, onCommit],
  );

  return (
    <View style={style}>
      {label !== undefined || !boxes ? (
        <View style={styles.head}>
          {label !== undefined ? (
            <Text variant="body-sm" color="secondary">
              {label}
            </Text>
          ) : null}
          <Text variant="body-sm" color={isAny ? 'tertiary' : 'primary'} style={styles.readout}>
            {shown}
          </Text>
        </View>
      ) : null}
      <RangeTrack
        lo={lo}
        hi={hi}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        label={label}
        endLabels={boxLabels}
        unit={unit}
        format={format}
        onDrag={onDrag}
      />
      {boxes ? (
        <View style={styles.boxes}>
          <RangeEndBox
            label={boxLabels[0]}
            value={lo}
            min={min}
            max={hi}
            step={step}
            unit={unit}
            disabled={disabled}
            onCommit={(v) => set([v, hi], false)}
          />
          <View style={styles.dash}>
            <Text variant="body-sm" color="tertiary">
              {'–'}
            </Text>
          </View>
          <RangeEndBox
            label={boxLabels[1]}
            value={hi}
            min={lo}
            max={max}
            step={step}
            unit={unit}
            disabled={disabled}
            onCommit={(v) => set([lo, v], false)}
          />
        </View>
      ) : null}
      {error !== undefined ? (
        <View
          style={styles.hint}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          accessible
        >
          <Text variant="caption" color="danger">
            {error}
          </Text>
        </View>
      ) : hint !== undefined ? (
        <Text variant="caption" color="tertiary" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** True when a pair still covers its whole span, so a filter count never counts it. */
RangeField.isAny = rangeIsAny;
