import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { Provenance } from '../Provenance/Provenance.native';
import type { UsageMeterProps } from './UsageMeter.types';
import { UsageMeterMetered } from './UsageMeterMetered.native';
import {
  UsageMeterError,
  UsageMeterLoading,
  UsageMeterUnavailable,
} from './UsageMeterStates.native';
import type { UsageLineTone } from './usage-meter-model';
import {
  isMetered,
  isResolved,
  normaliseUsageState,
  unmeteredStatusLine,
} from './usage-meter-model';

interface NativeUsageMeterProps extends UsageMeterProps {
  style?: StyleProp<ViewStyle>;
}

const LINE_TONE: Record<UsageLineTone, string> = {
  danger: theme.colors['danger-text'],
  warning: theme.colors['warning-text'],
  info: theme.colors['info-text'],
};

const labelStyle: TextStyle = {
  fontSize: 14,
  fontWeight: '500',
  letterSpacing: -0.14,
  color: theme.colors['text-primary'],
};

/**
 * A billing meter for `SCR-M12-04` Usage — the same numbers the product enforces and bills from,
 * with no smoothing (`BM-27`).
 *
 * THREE RULES RUN BEFORE ANY BILLING LOGIC: no figure without a resolved value, no denominator
 * without a rate, and an error shows no numbers — with `error` and `unavailable` tested BEFORE the
 * resolved-value guard, because in both there is definitionally no value to wait for.
 */
export function UsageMeter({
  label,
  value,
  limit = null,
  unit,
  period,
  provenance,
  standing,
  bundleName,
  state = 'ok',
  thresholdPercent = 80,
  graceDaysLeft,
  note,
  noLimitNote = 'No bundle on this plan to measure against — this is a count, not a rate.',
  loadingNote = "Not resolved yet — this period's rollup is still being read.",
  errorMessage = "Couldn't read this period's usage. Nothing is shown until it resolves, because this screen only ever shows the billed figures.",
  onRetry,
  unavailableTitle = 'Not metered on this plan',
  unavailableMessage,
  density = 'expressive',
  style,
}: NativeUsageMeterProps) {
  const format = useFormat().number;
  const trackHeight = density === 'functional' ? 8 : 10;
  const billing = normaliseUsageState(state);

  if (billing === 'error') {
    return (
      <UsageMeterError
        label={label}
        period={period}
        errorMessage={errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (billing === 'unavailable') {
    return (
      <UsageMeterUnavailable
        label={label}
        period={period}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
      />
    );
  }

  if (billing === 'loading' || !isResolved(value)) {
    return (
      <UsageMeterLoading
        label={label}
        period={period}
        loadingNote={loadingNote}
        trackHeight={trackHeight}
      />
    );
  }

  /* Period, tier and bundle are the three things BM-27 requires beside the number. */
  const prov = (
    <Provenance tier={provenance} standing={standing} source={period} note={bundleName} size={12} />
  );

  if (!isMetered(limit)) {
    const line = unmeteredStatusLine(billing, graceDaysLeft);
    return (
      <View style={[styles.shell, style]}>
        <View style={styles.head}>
          <Text style={labelStyle}>{label}</Text>
          <Text variant="mono" style={figure}>
            {format(value)}
            {unit !== undefined ? <Text variant="mono" color="tertiary">{` ${unit}`}</Text> : null}
          </Text>
        </View>
        {prov}
        <Text variant="caption" color="tertiary">
          {noLimitNote}
        </Text>
        {line !== null ? (
          <Text variant="caption" style={[statusLine, { color: LINE_TONE[line.tone] }]}>
            {line.words}
          </Text>
        ) : null}
        {note !== undefined ? (
          <Text variant="caption" color="tertiary">
            {note}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <UsageMeterMetered
      label={label}
      value={value}
      limit={limit}
      unit={unit}
      period={period}
      bundleName={bundleName}
      billing={billing}
      thresholdPercent={thresholdPercent}
      graceDaysLeft={graceDaysLeft}
      note={note}
      trackHeight={trackHeight}
      format={format}
      provenance={prov}
      style={style}
    />
  );
}

const figure: TextStyle = { fontWeight: '700' };
const statusLine: TextStyle = { fontWeight: '500' };

const styles = StyleSheet.create({
  shell: { flexDirection: 'column', gap: theme.spacing['sp-2'] },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
});
