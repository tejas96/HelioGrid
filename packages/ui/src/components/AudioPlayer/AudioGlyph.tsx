import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { AUDIO_GLYPH } from './AudioGlyph.logic';
import type { AudioGlyphName } from './AudioPlayer.types';

/** The transport and reason glyphs. Play and pause are filled; the rest are stroked. */
export function AudioGlyph({ name, size = 20 }: { name: AudioGlyphName; size?: number }) {
  if (name === 'play' || name === 'pause') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        role="presentation"
      >
        <ShellGlyphMarks name={AUDIO_GLYPH[name]} />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation"
    >
      <ShellGlyphMarks name={AUDIO_GLYPH[name]} />
    </svg>
  );
}
