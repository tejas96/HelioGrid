import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame.native';
import { funnelScale, funnelStage } from './Charts.logic';
import type { FunnelChartProps } from './Charts.types';
import { chartColor } from './ChartTokens.native';

interface NativeFunnelChartProps extends FunnelChartProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-1'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  label: { width: '28%' },
  track: {
    flex: 1,
    height: 30,
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['surface-alt'],
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: theme.radius['rf-md'] },
  value: { minWidth: 56, textAlign: 'right', fontWeight: '700' },
  conversion: { alignItems: 'flex-end', paddingRight: 62, paddingVertical: 3 },
});

/** Pipeline funnel; shows the carried-forward percentage between stages. */
export function FunnelChart({
  stages,
  format,
  minPoints = 2,
  lowConversionBelow,
  ...frame
}: NativeFunnelChartProps) {
  const mkt = useFormat();
  const fmt = format ?? mkt.number;
  const { insufficient, top, height } = funnelScale(stages, minPoints);

  return (
    <ChartFrame
      {...frame}
      height={height}
      insufficient={insufficient}
      insufficientMessage={frame.insufficientMessage ?? frame.words.funnelInsufficient}
    >
      <View style={styles.list}>
        {stages.map((stage, i) => {
          const { widthPercent, opacity, conversion } = funnelStage(stages, i, top);
          return (
            <View key={stage.label}>
              <View style={styles.row}>
                <Text variant="body-sm" color="secondary" style={styles.label}>
                  {stage.label}
                </Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${widthPercent}%`,
                        opacity,
                        backgroundColor: stage.color ?? chartColor(i),
                      },
                    ]}
                  />
                </View>
                <Text variant="mono" style={styles.value}>
                  {fmt(stage.value)}
                </Text>
              </View>
              {conversion === null ? null : (
                <View style={styles.conversion}>
                  <Text
                    variant="caption"
                    color={conversion < lowConversionBelow ? 'warning' : 'tertiary'}
                  >
                    {frame.words.carriedForward(conversion)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ChartFrame>
  );
}
