import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { allocationFigure, legendKey, partValue } from './AllocationMeter.model';
import type { AllocationPart } from './AllocationMeter.types';

/** Names each part beside the bar (`showLegend`): its label and its share. */
export function AllocationLegend({ parts, unit }: { parts: AllocationPart[]; unit: string }) {
  return (
    <View style={styles.legend}>
      {parts.map((part) => (
        <View key={legendKey(part)} style={styles.legendItem}>
          <View style={styles.swatch} />
          <Text variant="caption" color="secondary">
            {part.label}
          </Text>
          <Text variant="mono" color="tertiary">
            {allocationFigure(partValue(part), unit)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-1'],
    columnGap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
    flexShrink: 0,
  },
});
