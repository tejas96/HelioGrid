import { theme } from '@heliogrid/theme';
import { G, Svg } from 'react-native-svg';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { RING_ORIGIN, type RingGeometry, ringDrawing } from './progress-ring';

interface ProgressRingProps {
  geometry: RingGeometry;
  /** 0–1 of the ring the arc covers; 0 draws the track alone. */
  share: number;
  /** The arc's ink, a resolved theme value — react-native-svg has no custom properties. */
  ink: string;
}

/**
 * A track and an arc. Decorative: the view holding it carries the name and the value. The arc
 * never animates — a stroke offset is not a transform (`ui-adherence.md`, Motion).
 */
export function ProgressRing({ geometry, share, ink }: ProgressRingProps) {
  const ring = ringDrawing(geometry, share);
  return (
    <Svg
      width={geometry.box}
      height={geometry.box}
      viewBox={ring.viewBox}
      fill="none"
      strokeWidth={ring.strokeWidth}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <G stroke={theme.colors['canvas-sunken']}>
        <ShellGlyphMarks name="ring" />
      </G>
      {share > 0 ? (
        <G
          stroke={ink}
          strokeLinecap="round"
          strokeDasharray={[ring.circumference]}
          strokeDashoffset={ring.offset}
          rotation={-90}
          origin={RING_ORIGIN}
        >
          <ShellGlyphMarks name="ring" />
        </G>
      ) : null}
    </Svg>
  );
}
