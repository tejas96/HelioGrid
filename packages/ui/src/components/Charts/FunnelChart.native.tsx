import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame.native';
import type { FunnelChartProps } from './Charts.types';
import { chartColor } from './ChartTokens.native';

interface NativeFunnelChartProps extends FunnelChartProps {
  style?: StyleProp<ViewStyle>;
}

const INSUFFICIENT = 'A funnel needs at least two stages with recorded values.';
/** Below this, the carried-forward figure is called out. */
const LOW_CONVERSION = 40;

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
export function FunnelChart({ stages, format, minPoints = 2, ...frame }: NativeFunnelChartProps) {
  const mkt = useFormat();
  const fmt = format ?? mkt.number;
  const insufficient = stages.length < minPoints;
  const top = Math.max(1, ...stages.map((s) => s.value || 0));

  return (
    <ChartFrame
      {...frame}
      height={Math.max(160, stages.length * 56)}
      insufficient={insufficient}
      insufficientMessage={frame.insufficientMessage ?? INSUFFICIENT}
    >
      <View style={styles.list}>
        {stages.map((stage, i) => {
          const prev = i > 0 ? (stages[i - 1]?.value ?? 0) : 0;
          const conversion = prev ? Math.round(((stage.value || 0) / prev) * 100) : null;
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
                        width: `${Math.max(2, ((stage.value || 0) / top) * 100)}%`,
                        opacity: 1 - i * 0.13,
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
                    color={conversion < LOW_CONVERSION ? 'warning' : 'tertiary'}
                  >
                    {conversion}% carried forward
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
