import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Circle, G, Line, Polygon, Polyline, Svg } from 'react-native-svg';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ChartFrame } from './ChartFrame.native';
import type { LineChartProps } from './Charts.types';
import { CHART_GRIDLINE, chartColor } from './ChartTokens.native';
import { chartTicks } from './chart-palette';
import { lineGeometry, lineSetDrawing, longestSeries, toLineSeries } from './chart-series';

interface NativeLineChartProps extends LineChartProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing['sp-1'] + 2,
  },
});

/** Trend line with a soft area wash on single series; last point carries the dot. */
export function LineChart({
  series,
  height = 200,
  /* `format` is part of the contract but the reference plot draws no figures, so nothing
     reads it. Kept so a caller's override is accepted rather than leaking onto the frame. */
  format: _format,
  minPoints = 2,
  area = true,
  gridlines = 4,
  ...frame
}: NativeLineChartProps) {
  /* The end dot is cut out of whatever holds the chart (`F7-15`). */
  const { ground } = useGround();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const sets = toLineSeries(series);
  /* A line with one point cannot show a trend, so the frame says so instead of drawing one. */
  const insufficient = longestSeries(sets) < minPoints;
  const geo = lineGeometry(sets, width, height);
  const axis = sets[0]?.points ?? [];

  return (
    <View onLayout={onLayout}>
      <ChartFrame {...frame} height={height} insufficient={insufficient}>
        <View style={{ height }}>
          {/* RN has no vector-effect, so the viewBox is drawn 1:1 against the measured width
              and the 2dp stroke stays 2dp without a non-scaling hint. */}
          <Svg
            width={geo.width}
            height={geo.height}
            viewBox={`0 0 ${geo.width} ${geo.height}`}
            accessibilityRole="image"
            accessibilityLabel={frame.title ?? frame.words.lineChart}
          >
            {chartTicks(geo.height, gridlines).map((offset) => (
              <Line
                key={offset}
                x1={0}
                x2={geo.width}
                y1={offset}
                y2={offset}
                stroke={CHART_GRIDLINE}
                strokeWidth={1}
              />
            ))}
            {sets.map((set, si) => {
              const drawn = lineSetDrawing(set, si, geo, area && sets.length === 1);
              const stroke = set.color ?? chartColor(si);
              return (
                <G key={drawn.key}>
                  {drawn.area === null ? null : (
                    <Polygon points={drawn.area} fill={stroke} opacity={0.08} />
                  )}
                  <Polyline
                    points={drawn.points}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {drawn.end === null ? null : (
                    <Circle
                      cx={drawn.end.x}
                      cy={drawn.end.y}
                      r={4}
                      fill={ground}
                      stroke={stroke}
                      strokeWidth={2}
                    />
                  )}
                </G>
              );
            })}
          </Svg>
          <View style={styles.axis}>
            {axis.map((point) => (
              <Text key={String(point.x)} variant="caption" color="tertiary">
                {point.x}
              </Text>
            ))}
          </View>
        </View>
      </ChartFrame>
    </View>
  );
}
