import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { usePalette } from '../../primitives/Color/use-palette.native';

const RING_STROKE = theme.spacing['sp-1'];

/**
 * A computed arc, not an icon: the share is the person's load against the busiest, drawn as two
 * circles round their face as `ProgressRing`'s arc is. The web half draws it in TeamDock.css.
 */
/** The person's share of the busiest load, as an arc round their face. */
export function LoadRing({ share, late }: { share: number; late: boolean }) {
  const palette = usePalette();
  const side = theme.spacing['sp-12'];
  const radius = (side - RING_STROKE) / 2;
  const length = 2 * Math.PI * radius;
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
        strokeDasharray={`${length * share} ${length}`}
        transform={`rotate(-90 ${side / 2} ${side / 2})`}
        fill="none"
      />
    </Svg>
  );
}
