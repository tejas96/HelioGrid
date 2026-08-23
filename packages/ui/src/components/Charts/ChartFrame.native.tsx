import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ChartFrameBody } from './ChartFrameBody.native';
import { ChartProvenance } from './ChartProvenance.native';
import type { ChartFrameProps } from './Charts.types';
import { chartProvenanceFacts } from './chart-provenance';
import {
  CHART_EMPTY_TITLE,
  CHART_ERROR_MESSAGE,
  CHART_ERROR_TITLE,
  CHART_INSUFFICIENT_MESSAGE,
  chartNote,
} from './chart-state';

interface NativeChartFrameProps extends ChartFrameProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  caption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-4'],
    marginBottom: theme.spacing['sp-3'],
  },
  head: { flexShrink: 1, gap: theme.spacing['sp-0-5'] },
  value: {
    fontSize: theme.type.roles.h2.fontSize,
    lineHeight: theme.type.roles.h2.lineHeight,
    letterSpacing: theme.type.roles.h2.letterSpacing,
    fontWeight: '700',
  },
  prov: { marginTop: theme.spacing['sp-0-5'] },
  legend: { marginTop: theme.spacing['sp-3'] },
});

/**
 * Shared chart shell: caption, provenance tier, legend, and the loading / empty / error /
 * not-enough-data states. Wrap a custom plot in this rather than inventing states for it.
 */
export function ChartFrame({
  overline,
  title,
  value,
  provenance,
  standing,
  source,
  projection,
  note,
  legend,
  action,
  state = 'ready',
  height = 200,
  insufficient = false,
  emptyTitle = CHART_EMPTY_TITLE,
  emptyMessage,
  insufficientMessage = CHART_INSUFFICIENT_MESSAGE,
  errorTitle = CHART_ERROR_TITLE,
  errorMessage = CHART_ERROR_MESSAGE,
  onRetry,
  children,
  style,
}: NativeChartFrameProps) {
  /* One provenance line under the headline value — word first, dot second (F8-07). */
  const facts = chartProvenanceFacts({ provenance, standing, source, projection, note });
  const stateNote = chartNote({
    state,
    insufficient,
    emptyTitle,
    emptyMessage,
    insufficientMessage,
    errorTitle,
    errorMessage,
  });
  const hasCaption = Boolean(overline) || Boolean(title) || Boolean(value) || Boolean(action);

  return (
    <View style={style}>
      {hasCaption ? (
        <View style={styles.caption}>
          <View style={styles.head}>
            {overline ? (
              <Text variant="overline" color="tertiary">
                {overline}
              </Text>
            ) : null}
            {title ? <Text variant="h4">{title}</Text> : null}
            {/* The headline figure keeps the display treatment the web half sets in CSS. */}
            {value ? <Text style={styles.value}>{value}</Text> : null}
            <View style={styles.prov}>
              <ChartProvenance facts={facts} />
            </View>
          </View>
          {action}
        </View>
      ) : null}

      <ChartFrameBody state={state} height={height} note={stateNote} onRetry={onRetry}>
        {children}
      </ChartFrameBody>

      {legend && stateNote === null && state !== 'loading' ? (
        <View style={styles.legend}>{legend}</View>
      ) : null}
    </View>
  );
}
