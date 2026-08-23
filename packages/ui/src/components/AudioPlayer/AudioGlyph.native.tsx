import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { AudioGlyphName } from './AudioPlayer.types';

function stroked(name: Exclude<AudioGlyphName, 'play' | 'pause'>, color: string): ReactNode {
  if (name === 'back') return <Path d="M11 6 5 12l6 6M19 6l-6 6 6 6" stroke={color} />;
  if (name === 'fwd') return <Path d="M13 6l6 6-6 6M5 6l6 6-6 6" stroke={color} />;
  if (name === 'clock') {
    return (
      <>
        <Circle cx="12" cy="12" r="9" stroke={color} />
        <Path d="M12 7.5V12l3 2" stroke={color} />
      </>
    );
  }
  if (name === 'doc') {
    return (
      <>
        <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke={color} />
        <Path d="M14 3v5h5M9 13h6M9 17h4" stroke={color} />
      </>
    );
  }
  return (
    <>
      <Path d="M9 9V6a3 3 0 0 1 5.5-1.7" stroke={color} />
      <Path d="M15 11v-1" stroke={color} />
      <Path d="M19 11a7 7 0 0 1-10.4 6.1M5 11a7 7 0 0 0 2 4.9" stroke={color} />
      <Path d="M12 18v3" stroke={color} />
      <Path d="m3 3 18 18" stroke={color} />
    </>
  );
}

/** The transport and reason glyphs. Play and pause are filled; the rest are stroked. */
export function AudioGlyph({
  name,
  size = 20,
  color,
}: {
  name: AudioGlyphName;
  size?: number;
  color: string;
}) {
  if (name === 'play' || name === 'pause') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {name === 'play' ? (
          <Path d="M8 5.2v13.6L19 12z" fill={color} />
        ) : (
          <>
            <Rect x="7" y="5" width="3.6" height="14" rx="1.2" fill={color} />
            <Rect x="13.4" y="5" width="3.6" height="14" rx="1.2" fill={color} />
          </>
        )}
      </Svg>
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
      {stroked(name, color)}
    </Svg>
  );
}
