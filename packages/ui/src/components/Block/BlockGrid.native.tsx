import { Children, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { BlockGridProps } from './Block.types';

interface NativeBlockGridProps extends BlockGridProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', minWidth: 0 },
});

/**
 * The seam (`M13-10`). RN has no CSS grid, so `repeat(auto-fit, minmax(min, 1fr))` is measured:
 * the row's own width decides how many columns of at least `min` fit, and every cell takes the
 * exact same width — the same result the web half gets from the grid algorithm.
 */
export function BlockGrid({ children, min = 320, gap = 20, columns, style }: NativeBlockGridProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const fit = Math.max(1, Math.floor((width + gap) / (min + gap)));
  const count = columns ?? fit;
  const cell: ViewStyle =
    width > 0 ? { width: (width - gap * (count - 1)) / count } : { width: '100%' };
  return (
    <View onLayout={onLayout} style={[styles.grid, { gap }, style]}>
      {Children.map(children, (child) => (
        <View style={cell}>{child}</View>
      ))}
    </View>
  );
}
