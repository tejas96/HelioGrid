import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Button } from '../Button/Button';
import { AudioGlyph } from './AudioGlyph';
import { positionTextOf, progressOf, skipOf, speedPillOf } from './AudioPlayer.logic';
import type { AudioPlayerWords } from './AudioPlayer.types';
import { AUDIO_SEEK_KEYS, formatClock } from './AudioPlayer.types';

export function RoundButton({
  label,
  onPress,
  kind,
  children,
}: {
  label: TranslatedText;
  onPress: () => void;
  kind: 'primary' | 'ghost';
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="hg-audio-round"
      data-kind={kind}
      aria-label={label}
      onClick={onPress}
    >
      {children}
    </button>
  );
}

/** A ghost skip: back or forward by `skipOf`'s step. */
export function SkipButton({
  back,
  onSeek,
  words,
}: {
  back: boolean;
  onSeek: (delta: number) => void;
  words: AudioPlayerWords;
}) {
  const skip = skipOf(back, words);
  return (
    <RoundButton kind="ghost" label={skip.label} onPress={() => onSeek(skip.delta)}>
      <span className="hg-audio-skip">
        <AudioGlyph name={skip.glyph} size={15} />
        <span className="hg-audio-skip-count">{skip.count}</span>
      </span>
    </RoundButton>
  );
}

export function TimeLabel({ seconds, dim }: { seconds: number; dim?: boolean }) {
  return (
    <span className="hg-audio-time" data-dim={dim === true ? 'true' : undefined}>
      {formatClock(seconds)}
    </span>
  );
}

/** The scrubber. Arrows ±5s, page keys ±60s, Home/End jump to the ends; every target is 44px. */
export function Scrubber({
  at,
  total,
  onSeek,
  words,
}: {
  at: number;
  total: number;
  onSeek: (seconds: number) => void;
  words: AudioPlayerWords;
}) {
  const pct = progressOf(at, total) * 100;
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const jump = AUDIO_SEEK_KEYS[event.key];
    if (jump !== undefined) {
      event.preventDefault();
      onSeek(at + jump);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onSeek(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      onSeek(total);
    }
  };
  const vars = { '--hg-audio-pct': `${pct}%` } as CSSProperties;
  return (
    <div className="hg-audio-scrub" style={vars}>
      <span aria-hidden="true" className="hg-audio-rail" />
      <span
        aria-hidden="true"
        className="hg-audio-fill"
        data-empty={total > 0 ? undefined : 'true'}
      />
      <input
        className="hg-audio-range"
        type="range"
        min={0}
        max={total > 0 ? total : 1}
        step={1}
        value={at}
        disabled={total <= 0}
        aria-label={words.seek}
        aria-valuetext={positionTextOf(at, total, words)}
        onChange={(event) => onSeek(Number(event.target.value))}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

/** Speed cycles 1× → 1.25× → 1.5× → 2×. */
export function SpeedButton({
  rate,
  speeds,
  onChange,
  words,
}: {
  rate: number;
  speeds: number[];
  onChange: (rate: number) => void;
  words: AudioPlayerWords;
}) {
  const pill = speedPillOf(rate, speeds, words);
  const next = () => {
    if (pill.next !== undefined) onChange(pill.next);
  };
  return (
    <button
      type="button"
      className="hg-audio-speed"
      data-changed={pill.changed ? 'true' : undefined}
      aria-label={pill.label}
      onClick={next}
    >
      {pill.mark}
    </button>
  );
}

/** The door to the transcript. It is offered in EVERY state, including error. */
export function TranscriptDoor({ label, onPress }: { label: TranslatedText; onPress: () => void }) {
  return (
    <Button
      variant="secondary"
      size="md"
      icon={<AudioGlyph name="doc" size={16} />}
      onClick={onPress}
    >
      {label}
    </Button>
  );
}
