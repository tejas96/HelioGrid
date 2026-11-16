import { View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { nearestGlyphSize } from '../AppShell/ShellGlyph.logic';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
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
  return <ShellGlyph name={activityGlyphOf(name)} size={nearestGlyphSize(size)} ink={color} />;
}
