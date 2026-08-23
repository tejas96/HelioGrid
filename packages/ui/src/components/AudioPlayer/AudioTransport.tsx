import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { AudioGlyph } from './AudioGlyph';
import { AUDIO_SEEK_KEYS, formatClock } from './AudioPlayer.types';

export function RoundButton({
  label,
  onPress,
  kind,
  children,
}: {
  label: string;
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

/** ±10s back and +30s forward — a full sales call on a 375px phone is ~3 seconds per pixel. */
export function SkipButton({ back, onSeek }: { back: boolean; onSeek: (delta: number) => void }) {
  return (
    <RoundButton
      kind="ghost"
      label={back ? 'Back 10 seconds' : 'Forward 30 seconds'}
      onPress={() => onSeek(back ? -10 : 30)}
    >
      <span className="hg-audio-skip">
        <AudioGlyph name={back ? 'back' : 'fwd'} size={15} />
        <span className="hg-audio-skip-count">{back ? 10 : 30}</span>
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
}: {
  at: number;
  total: number;
  onSeek: (seconds: number) => void;
}) {
  const pct = total > 0 ? (at / total) * 100 : 0;
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
        aria-label="Seek within the recording"
        aria-valuetext={`${formatClock(at)} of ${formatClock(total)}`}
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
}: {
  rate: number;
  speeds: number[];
  onChange: (rate: number) => void;
}) {
  const next = () => {
    const index = speeds.indexOf(rate);
    const value = speeds[(index + 1) % speeds.length];
    if (value !== undefined) onChange(value);
  };
  return (
    <button
      type="button"
      className="hg-audio-speed"
      data-changed={rate === 1 ? undefined : 'true'}
      aria-label={`Playback speed ${rate}×. Tap to change.`}
      onClick={next}
    >
      {`${rate}×`}
    </button>
  );
}

/** The door to the transcript. It is offered in EVERY state, including error. */
export function TranscriptDoor({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button type="button" className="hg-audio-text-action" onClick={onPress}>
      <AudioGlyph name="doc" size={16} />
      {label}
    </button>
  );
}
