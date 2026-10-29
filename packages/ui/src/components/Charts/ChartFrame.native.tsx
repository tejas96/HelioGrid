import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ChartFrameBody } from './ChartFrameBody.native';
import { ChartProvenance } from './ChartProvenance.native';
import type { ChartFrameProps } from './Charts.types';
import { chartFrameReading } from './chart-state';

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
export function ChartFrame(props: NativeChartFrameProps) {
  const { overline, title, value, legend, action, height = 200, words, children, style } = props;
  const { state, onRetry, facts, stateNote, hasCaption, showsLegend } = chartFrameReading(props);
  /* The frame stays while a retried read reloads, so the reader lands on it once *Try again* leaves. */
  const frame = useRef<View>(null);

  return (
    <View ref={frame} style={style}>
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

      <ChartFrameBody
        state={state}
        height={height}
        note={stateNote}
        words={words}
        onRetry={onRetry}
        focusAfter={frame}
      >
        {children}
      </ChartFrameBody>

      {showsLegend ? <View style={styles.legend}>{legend}</View> : null}
    </View>
  );
}
