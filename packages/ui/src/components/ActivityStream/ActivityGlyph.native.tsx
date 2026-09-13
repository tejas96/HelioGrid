import { theme } from '@heliogrid/theme';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ACTIVITY_GLYPH, FALLBACK_GLYPH, type GlyphShape } from './ActivityGlyph.logic';

/** One shape, drawn with this platform's own SVG elements. The SHAPE is shared; these are not. */
function draw(shape: GlyphShape, key: number, color: string) {
  if (shape.kind === 'path') return <Path key={key} d={shape.d} stroke={color} />;
  if (shape.kind === 'circle')
    return <Circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} stroke={color} />;
  return (
    <Rect
      key={key}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      rx={shape.rx}
      stroke={color}
    />
  );
}

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
  color: string;
}) {
  if (name === 'agent') {
    return (
      <View
        style={{
          width: size - 2,
          height: size - 2,
          borderRadius: (size - 2) / 2,
          backgroundColor: theme.colors['iris-violet'],
        }}
      />
    );
  }
  const shapes = ACTIVITY_GLYPH[name] ?? ACTIVITY_GLYPH[FALLBACK_GLYPH];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes?.map((shape, i) => draw(shape, i, color))}
    </Svg>
  );
}
