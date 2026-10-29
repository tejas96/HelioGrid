import type { TranslatedText } from '@heliogrid/contracts';
import type {
  AudioGlyphName,
  AudioPlayerProps,
  AudioPlayerWords,
  AudioUnavailableReason,
} from './AudioPlayer.types';
import { AUDIO_REASON_GLYPH, audioReasonFootnote, formatClock } from './AudioPlayer.types';

/** What a player takes when the caller names nothing. Speed cycles 1× → 1.25× → 1.5× → 2×. */
export const AUDIO_PLAYER_DEFAULTS: {
  duration: number;
  speeds: number[];
  density: NonNullable<AudioPlayerProps['density']>;
} = {
  duration: 0,
  speeds: [1, 1.25, 1.5, 2],
  density: 'expressive',
};

/** A seek, held inside the recording: never before its start, never past its length. */
export function clampPosition(seconds: number, total: number): number {
  return Math.min(total, Math.max(0, seconds));
}

/** The play control's name and glyph: it says what a press does next. */
export function playToggleOf(
  playing: boolean,
  words: AudioPlayerWords,
): { label: TranslatedText; glyph: AudioGlyphName } {
  return playing ? { label: words.pause, glyph: 'pause' } : { label: words.play, glyph: 'play' };
}

/** ±10s back and +30s forward — a full sales call on a 375px phone is ~3 seconds per pixel. */
export function skipOf(
  back: boolean,
  words: AudioPlayerWords,
): { delta: number; count: number; label: TranslatedText; glyph: AudioGlyphName } {
  return back
    ? { delta: -10, count: 10, label: words.back, glyph: 'back' }
    : { delta: 30, count: 30, label: words.forward, glyph: 'fwd' };
}

/** The speed pill: its mark, its name, whether it is off 1×, and the rate a press moves to. */
export function speedPillOf(
  rate: number,
  speeds: number[],
  words: AudioPlayerWords,
): { mark: string; label: TranslatedText; changed: boolean; next: number | undefined } {
  return {
    mark: `${rate}×`,
    label: words.speed(rate),
    changed: rate !== 1,
    next: speeds[(speeds.indexOf(rate) + 1) % speeds.length],
  };
}

/** How far through the recording the position is, as a fraction — none while there is no length. */
export function progressOf(at: number, total: number): number {
  return total > 0 ? at / total : 0;
}

/** The scrubber's spoken value: where the position is, of how long. */
export function positionTextOf(at: number, total: number, words: AudioPlayerWords): TranslatedText {
  return words.position(formatClock(at), formatClock(total));
}

/** An unavailable recording's panel for a named reason: its two sentences, its glyph, its footnote. */
export function reasonPanelOf(
  reason: AudioUnavailableReason,
  words: AudioPlayerWords,
  facts: { purgedAt?: string; retentionBound?: string; consentAt?: string },
): { title: TranslatedText; body: TranslatedText; glyph: AudioGlyphName; footnote: string } {
  const copy = words.reasons[reason];
  return {
    title: copy.title,
    body: copy.body,
    glyph: AUDIO_REASON_GLYPH[reason],
    footnote: audioReasonFootnote(words, reason, facts),
  };
}
