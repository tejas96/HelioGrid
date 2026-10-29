import Svg from 'react-native-svg';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { AUDIO_GLYPH, isFilledGlyph } from './AudioGlyph.logic';
import type { AudioGlyphName } from './AudioPlayer.types';

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
  if (isFilledGlyph(name)) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <ShellGlyphMarks name={AUDIO_GLYPH[name]} />
      </Svg>
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
      <ShellGlyphMarks name={AUDIO_GLYPH[name]} />
    </Svg>
  );
}
