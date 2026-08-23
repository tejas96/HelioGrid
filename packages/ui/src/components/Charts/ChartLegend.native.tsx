import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { ChartLegendProps } from './Charts.types';
import { chartColor } from './ChartTokens.native';

interface NativeChartLegendProps extends ChartLegendProps {
  style?: StyleProp<ViewStyle>;
}

const DOT = 8;

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: theme.spacing['sp-2'],
    columnGap: 18,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  dot: { width: DOT, height: DOT, borderRadius: theme.radius['rf-xs'] / 2 },
  value: { fontWeight: '700' },
});

/** The series key: a palette swatch, the label, and — when there is one — the value. */
export function ChartLegend({ items, style }: NativeChartLegendProps) {
  return (
    <View style={[styles.list, style]}>
      {items.map((item, index) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color ?? chartColor(index) }]} />
          <Text variant="caption" color="secondary">
            {item.label}
          </Text>
          {item.value === undefined || item.value === null ? null : (
            <Text variant="caption" style={styles.value}>
              {item.value}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
