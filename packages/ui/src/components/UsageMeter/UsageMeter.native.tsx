import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { Provenance } from '../Provenance/Provenance.native';
import type { UsageMeterProps } from './UsageMeter.types';
import { UsageMeterHead } from './UsageMeterHead.native';
import { UsageMeterMetered } from './UsageMeterMetered.native';
import {
  UsageMeterError,
  UsageMeterLoading,
  UsageMeterUnavailable,
} from './UsageMeterStates.native';
import type { UsageLineTone } from './usage-meter-model';
import {
  unmeteredStatusLine,
  usageMeterShape,
  usageNotesOf,
  usageTrackHeight,
} from './usage-meter-model';

interface NativeUsageMeterProps extends UsageMeterProps {
  style?: StyleProp<ViewStyle>;
}

const LINE_TONE: Record<UsageLineTone, ThemeColor> = {
  danger: colors['danger-text'],
  warning: colors['warning-text'],
  info: colors['info-text'],
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
  words,
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
  statusLine: saysStatus = true,
  defaultNotes = true,
  noLimitNote: ownNoLimitNote,
  loadingNote: ownLoadingNote,
  errorMessage = words.error,
  onRetry,
  retryLabel,
  unavailableTitle = words.unavailable,
  unavailableMessage,
  density = 'expressive',
  form = 'row',
  glyph,
  style,
}: NativeUsageMeterProps) {
  /* Every state draws its own frame, and each takes this one ref: after Try again leaves, the
     reader lands on the meter's frame in whatever state it reloads into. */
  const frame = useRef<View>(null);
  const format = useFormat().number;
  const trackHeight = usageTrackHeight(density);
  const shape = usageMeterShape(state, value, limit);
  const { noLimitNote, loadingNote } = usageNotesOf(words, {
    defaultNotes,
    noLimitNote: ownNoLimitNote,
    loadingNote: ownLoadingNote,
  });

  if (shape.draws === 'error') {
    return (
      <UsageMeterError
        frame={frame}
        label={label}
        period={period}
        errorMessage={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
      />
    );
  }

  if (shape.draws === 'unavailable') {
    return (
      <UsageMeterUnavailable
        frame={frame}
        label={label}
        period={period}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
      />
    );
  }

  if (shape.draws === 'loading') {
    return (
      <UsageMeterLoading
        frame={frame}
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

  if (shape.draws === 'unmetered') {
    const line = saysStatus ? unmeteredStatusLine(shape.billing, graceDaysLeft, words) : null;
    return (
      <View ref={frame} style={[styles.shell, form === 'tile' ? styles.tile : undefined, style]}>
        <UsageMeterHead
          label={label}
          form={form}
          glyph={glyph}
          figure={format(shape.value)}
          after={unit ?? null}
        />
        {prov}
        {noLimitNote !== undefined ? (
          <Text variant="caption" color="tertiary">
            {noLimitNote}
          </Text>
        ) : null}
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
      frame={frame}
      words={words}
      label={label}
      value={shape.value}
      limit={shape.limit}
      unit={unit}
      period={period}
      bundleName={bundleName}
      billing={shape.billing}
      thresholdPercent={thresholdPercent}
      graceDaysLeft={graceDaysLeft}
      statusLine={saysStatus}
      note={note}
      trackHeight={trackHeight}
      format={format}
      provenance={prov}
      style={style}
      form={form}
      glyph={glyph}
    />
  );
}

const statusLine: TextStyle = { fontWeight: '500' };

const styles = StyleSheet.create({
  shell: { flexDirection: 'column', gap: theme.spacing['sp-2'] },
  tile: { gap: theme.spacing['sp-3'] },
});
