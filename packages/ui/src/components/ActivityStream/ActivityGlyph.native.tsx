import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** The stroked kind glyphs. One `d` per entry, so the two platforms draw the same outline. */
const PATHS: Record<string, string[]> = {
  note: ['M5 4h11l3 3v13H5z', 'M9 11h6M9 15h4'],
  phone: [
    'M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z',
  ],
  flag: ['M6 21V4h12l-2.5 4L18 12H6'],
  doc: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'],
  link: [
    'M10 13a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1',
    'M14 11a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1',
  ],
  check: ['m5 13 4 4L19 7'],
  rupee: ['M8 5h8M8 9h8M14 5c0 4-2.5 4-6 4l7 10'],
  bell: ['M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z', 'M10 19a2 2 0 0 0 4 0'],
  undo: ['M4 10h9a5 5 0 1 1 0 10H8', 'm8 6-4 4 4 4'],
};

function body(name: string, color: string): ReactNode {
  if (name === 'user') {
    return (
      <>
        <Circle cx="12" cy="8" r="3.2" stroke={color} />
        <Path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke={color} />
      </>
    );
  }
  if (name === 'cog') {
    return (
      <>
        <Circle cx="12" cy="12" r="3" stroke={color} />
        <Path
          d="M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5 8 8M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5"
          stroke={color}
        />
      </>
    );
  }
  if (name === 'clipboard') {
    return (
      <>
        <Rect x="6" y="4" width="12" height="17" rx="2" stroke={color} />
        <Path d="M9 3h6v3H9zM9 12h6M9 16h4" stroke={color} />
      </>
    );
  }
  if (name === 'grid') {
    return (
      <>
        <Rect x="4" y="4" width="7" height="7" rx="1.5" stroke={color} />
        <Rect x="13" y="4" width="7" height="7" rx="1.5" stroke={color} />
        <Rect x="4" y="13" width="7" height="7" rx="1.5" stroke={color} />
        <Rect x="13" y="13" width="7" height="7" rx="1.5" stroke={color} />
      </>
    );
  }
  const paths = PATHS[name];
  if (paths === undefined) return <Circle cx="12" cy="12" r="3.5" stroke={color} />;
  return (
    <>
      {paths.map((d) => (
        <Path key={d} d={d} stroke={color} />
      ))}
    </>
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
      {body(name, color)}
    </Svg>
  );
}
