import { theme } from '@heliogrid/theme';
import Svg, { Circle, Path } from 'react-native-svg';

/* The two glyphs the shell draws itself — the bell (F6-17) and the phone's search tap (F6-20).
   react-native-svg has no currentColor, so the stroke is a prop; the shell only ever draws them
   at rest inside a ShellAction, which is why --text-secondary is the default. */

interface ShellIconProps {
  color?: string;
}

export function BellIcon({ color = theme.colors['text-secondary'] }: ShellIconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.7 21a2 2 0 0 1-3.4 0"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ color = theme.colors['text-secondary'] }: ShellIconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={1.5} />
      <Path
        d="m20 20-3.5-3.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
