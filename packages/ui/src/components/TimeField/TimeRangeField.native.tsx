import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { TimeField } from './TimeField.native';
import type { TimeRangeFieldProps } from './TimeField.types';
import { TimeFieldMessage } from './TimeFieldMessage.native';
import { useTimeRange } from './use-time-range';

interface NativeTimeRangeFieldProps extends TimeRangeFieldProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A start–end window — the calling window an EPC's voice agent may dial inside.
 *
 * Both ends refuse anything outside the market pack's statutory hours, and the pair itself refuses
 * an end at or before its start rather than reordering silently. Web draws one sentence under the
 * pair and points both boxes' `aria-describedby` at it; RN has no describedby, so the ring is drawn
 * on both halves and the sentence is read in order.
 */
export function TimeRangeField({
  from = '',
  to = '',
  onCommit,
  label,
  min,
  max,
  windowName,
  helper,
  error,
  disabled = false,
  density = 'expressive',
  style,
}: NativeTimeRangeFieldProps) {
  const format = useFormat();
  const range = useTimeRange({ format, from, max, min, onCommit, to, windowName });
  const hasError = error !== undefined && error !== null && error !== false;
  const ringed = hasError || range.orderError !== null;
  const half = { density, disabled, max, min, windowName, invalid: ringed, style: styles.half };

  return (
    /* No `accessibilityLabel` here, and deliberately so. The web half is a `<fieldset>` whose name
       comes from its visible `<legend>` — it carries no `aria-label` at all — and the legend below
       is that same string, already an announced Text. A label on this View was a second copy of it
       that nothing read; `accessible` would have been worse still, folding both 44dp time boxes
       and the refusal sentence into one element. */
    <View style={[styles.root, style]}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.legend}>
          {label}
        </Text>
      ) : null}
      <View style={styles.row}>
        <TimeField
          {...half}
          label="From"
          value={from}
          onCommit={(next) => range.set('from', next)}
        />
        <TimeField {...half} label="To" value={to} onCommit={(next) => range.set('to', next)} />
      </View>
      <TimeFieldMessage
        error={error}
        helper={helper ?? range.boundSentence ?? undefined}
        refused={range.orderError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
    gap: 10,
  },
  legend: {
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
});
