import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { usePalette } from '../../primitives/Color/use-palette.native';
import { ringArcOf } from '../ProgressRing/ProgressRing.logic';

const RING_STROKE = theme.spacing['sp-1'];

/**
 * The person's share of the busiest load, as an arc round their face: a computed arc, not an
 * icon, drawn as `ProgressRing`'s is. The web half draws it in TeamDock.css.
 */
export function LoadRing({ share, late }: { share: number; late: boolean }) {
  const palette = usePalette();
  const side = theme.spacing['sp-12'];
  const { radius, length, arc } = ringArcOf(side, RING_STROKE, share);
  const ink = late ? palette.warning : palette.accent;
  return (
    <Svg width={side} height={side} style={StyleSheet.absoluteFill}>
      <Circle
        cx={side / 2}
        cy={side / 2}
        r={radius}
        stroke={palette.accent}
        strokeOpacity={0.17}
        strokeWidth={RING_STROKE}
        fill="none"
      />
      <Circle
        cx={side / 2}
        cy={side / 2}
        r={radius}
        stroke={ink}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${length}`}
        transform={`rotate(-90 ${side / 2} ${side / 2})`}
        fill="none"
      />
    </Svg>
  );
}
