import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { chartColor } from '../Charts/ChartTokens.native';
import { formatAllocation, partValue, splitKeyFitsOneRow } from './AllocationMeter.model';
import type { AllocationPart } from './AllocationMeter.types';

interface AllocationSplitProps {
  label?: string;
  parts: AllocationPart[];
  unit: string;
  density: 'expressive' | 'functional';
  style?: StyleProp<ViewStyle>;
}

/**
 * A SAVED SPLIT IS READ, NOT CHECKED: no label row, no remainder words, no rule. Each key entry is
 * one accessibility element — its share and its caption read together — and the strip, which only
 * repeats the key in colour, is hidden from the screen reader.
 */
export function AllocationSplit({ parts, unit, density, style }: AllocationSplitProps) {
  const oneRow = splitKeyFitsOneRow(parts.length);
  return (
    <View style={[styles.root, style]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.strip, density === 'functional' ? styles.stripFn : styles.stripEx]}
      >
        {parts.map((part, index) => (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: a saved split's parts keep their order and may repeat a label and a share
            key={index}
            style={[
              styles.segment,
              { flexGrow: partValue(part), backgroundColor: chartColor(index) },
            ]}
          />
        ))}
      </View>
      <View style={[styles.key, oneRow ? styles.keyOneRow : styles.keyWrapped]}>
        {parts.map((part, index) => (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: a saved split's parts keep their order and may repeat a label and a share
            key={index}
            accessible
            style={oneRow ? styles.entryOneRow : styles.entryWrapped}
          >
            <View style={styles.shareRow}>
              <View style={[styles.swatch, { backgroundColor: chartColor(index) }]} />
              <Text variant="mono" bold>
                {`${formatAllocation(partValue(part))}${unit}`}
              </Text>
            </View>
            {part.caption === null || part.caption === undefined ? null : (
              <Text variant="caption" color="secondary">
                {part.caption}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/* The 10px gaps, the 3px strip gap and the 88px wrapping column are the DS source's own. Yoga has
   no min-content column, so a one-row entry starts at its own width (flexBasis auto) and shares
   what is left: a basis of 0 gave four equal 70px columns and broke "Commissioned" in two. */
const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  strip: {
    flexDirection: 'row',
    gap: 3,
  },
  stripEx: {
    height: 10,
  },
  stripFn: {
    height: 8,
  },
  segment: {
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 3,
    height: '100%',
    borderRadius: theme.radius['r-pill'],
  },
  key: {
    flexDirection: 'row',
    rowGap: theme.spacing['sp-2'],
    columnGap: 10,
  },
  keyOneRow: {
    flexWrap: 'nowrap',
  },
  keyWrapped: {
    flexWrap: 'wrap',
  },
  entryOneRow: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    gap: theme.spacing['sp-0-5'],
  },
  entryWrapped: {
    width: 88,
    gap: theme.spacing['sp-0-5'],
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    borderRadius: 2,
    flexShrink: 0,
  },
});
