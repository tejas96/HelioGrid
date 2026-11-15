import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { BlockInk } from './block-ink.native';
import { Drawn } from './Growing.native';
import { PAYBACK_BOX, type PaybackGeometry } from './ProposalBlocks.logic';

/**
 * The savings curve against the net cost: a wash under the line, the net cost as a dashed rule, and
 * a ring where the two cross. A computed plot, drawn in its own units and scaled to its column; its
 * words are set outside the drawing, at the page's own type size.
 *
 * WEB → RN MAPPING: the web's line draws itself once by its stroke; here the drawing is uncovered
 * from its start to its end (`Drawn`), since `react-native-svg` has no native-driver stroke.
 */
export function PaybackCurve({
  geometry,
  name,
  netCost,
  firstYear,
  lastYear,
  ink,
  wordSize,
}: {
  geometry: PaybackGeometry;
  name: string;
  netCost: string;
  firstYear: string;
  lastYear: string;
  ink: BlockInk;
  /** The words' size: the caption's on a screen, the paper's own on a page. */
  wordSize?: { fontSize: number; lineHeight: number };
}) {
  const wash = useId();
  const { width, height } = PAYBACK_BOX;
  const word = [{ color: ink.tertiary }, wordSize];
  /* The net cost is information the reader reads, so it takes the secondary ink; the years are quiet. */
  const netWord = [{ color: ink.secondary }, wordSize];
  return (
    <View>
      <View accessible accessibilityRole="image" accessibilityLabel={name}>
        <Drawn>
          <Svg width="100%" style={styles.drawing} viewBox={`0 0 ${width} ${height}`}>
            <Defs>
              <LinearGradient id={wash} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={ink.chart2} stopOpacity={0.28} />
                <Stop offset="1" stopColor={ink.chart2} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Polygon points={geometry.washPoints} fill={`url(#${wash})`} />
            <Polyline
              points={geometry.curvePoints}
              fill="none"
              stroke={ink.chart2}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Line
              x1={0}
              x2={width}
              y1={geometry.netY}
              y2={geometry.netY}
              stroke={ink.lineStrong}
              strokeDasharray="4 5"
            />
            {geometry.crossX === null ? null : (
              <Circle
                cx={geometry.crossX}
                cy={geometry.netY}
                r={6}
                fill={ink.ground}
                stroke={ink.chart2}
                strokeWidth={2.5}
              />
            )}
          </Svg>
        </Drawn>
        <Text
          variant="caption"
          style={[styles.net, { bottom: `${(1 - geometry.netY / height) * 100}%` }, netWord]}
        >
          {netCost}
        </Text>
      </View>
      <View style={styles.axis} importantForAccessibility="no-hide-descendants">
        <Text variant="caption" style={word}>
          {firstYear}
        </Text>
        <Text variant="caption" style={word}>
          {lastYear}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawing: { aspectRatio: PAYBACK_BOX.width / PAYBACK_BOX.height },
  net: { position: 'absolute', right: 0, maxWidth: '70%', marginBottom: 4, textAlign: 'right' },
  axis: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
});
