import { View } from 'react-native';
import Svg from 'react-native-svg';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { activityGlyphOf, agentObjectSize } from './ActivityGlyph.logic';

/**
 * A kind's glyph. `agent` is the one brand object rather than an outlined icon; RN cannot paint
 * --gradient-brand without a gradient dependency, so it takes the gradient's leading stop.
 */
export function ActivityGlyph({
  name,
  size = 16,
  color,
}: {
  name: string;
  size?: number;
  color: ThemeColor;
}) {
  if (name === 'agent') {
    const object = agentObjectSize(size);
    return (
      <View
        style={{
          width: object,
          height: object,
          borderRadius: object / 2,
          backgroundColor: colors['brand-teal'],
        }}
      />
    );
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name={activityGlyphOf(name)} />
    </Svg>
  );
}
