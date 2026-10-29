import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { AudioGlyphName } from './AudioPlayer.types';

/** The shape each audio glyph draws. Play and pause are drawn filled, the rest stroked. */
export const AUDIO_GLYPH: Record<AudioGlyphName, ShellGlyphName> = {
  play: 'play',
  pause: 'pause',
  back: 'rewind',
  fwd: 'fast-forward',
  'mic-off': 'mic-off',
  clock: 'clock',
  doc: 'file-text',
};

/** Play and pause are drawn filled; every other audio glyph is stroked. */
export function isFilledGlyph(name: AudioGlyphName): boolean {
  return name === 'play' || name === 'pause';
}
