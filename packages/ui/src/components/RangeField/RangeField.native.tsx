import { theme } from '@heliogrid/theme';
import { useCallback } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { RangeEndBox } from './RangeEndBox.native';
import { orderPair, rangeIsAny, rangeReadout, resolveRange } from './RangeField.logic';
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
  format,
  boxes = true,
  boxLabels = ['From', 'To'],
  disabled = false,
  anyLabel = 'Any',
  style,
}: NativeRangeFieldProps) {
  const [lo, hi] = resolveRange(value, min, max);
  const isAny = rangeIsAny([lo, hi], min, max);
  const shown = rangeReadout({ lo, hi, min, max, anyLabel, unit, format });

  const set = (next: RangeValue, live: boolean) => {
    const pair = orderPair(next);
    if (live) onInput?.(pair);
    else onCommit?.(pair);
  };

  const onDrag = useCallback(
    (end: 'lo' | 'hi', next: number, live: boolean) => {
      /* Pinned, never swapped. */
      const pair: RangeValue = end === 'lo' ? [Math.min(next, hi), hi] : [lo, Math.max(next, lo)];
      const ordered = orderPair(pair);
      if (live) onInput?.(ordered);
      else onCommit?.(ordered);
    },
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
              –
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
      {hint !== undefined ? (
        <Text variant="caption" color="tertiary" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** True when a pair still covers its whole span, so a filter count never counts it. */
RangeField.isAny = rangeIsAny;
