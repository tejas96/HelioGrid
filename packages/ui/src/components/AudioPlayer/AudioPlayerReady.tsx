import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AudioGlyph } from './AudioGlyph';
import { clampPosition, playToggleOf } from './AudioPlayer.logic';
import type { AudioPlayerProps, AudioPlayerWords } from './AudioPlayer.types';
import { audioFootnote } from './AudioPlayer.types';
import {
  RoundButton,
  Scrubber,
  SkipButton,
  SpeedButton,
  TimeLabel,
  TranscriptDoor,
} from './AudioTransport';

export interface AudioPlayerReadyProps
  extends Pick<
    AudioPlayerProps,
    'src' | 'consentAt' | 'retentionUntil' | 'retentionBound' | 'onOpenTranscript'
  > {
  duration: number;
  speeds: number[];
  transcriptLabel: TranslatedText;
  header: ReactNode;
  words: AudioPlayerWords;
}

/** The playable state: the transport, the position, the rate, and the two honest footnotes. */
export function AudioPlayerReady({
  src,
  duration,
  consentAt,
  retentionUntil,
  retentionBound,
  onOpenTranscript,
  speeds,
  transcriptLabel,
  header,
  words,
}: AudioPlayerReadyProps) {
  const element = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [reported, setReported] = useState(duration);
  const [rate, setRate] = useState(1);
  const total = reported > 0 ? reported : duration;

  useEffect(() => {
    if (element.current !== null) element.current.playbackRate = rate;
  }, [rate]);

  const seek = (seconds: number) => {
    const next = clampPosition(seconds, total);
    setAt(next);
    if (element.current !== null) element.current.currentTime = next;
  };

  const toggle = () => {
    const audio = element.current;
    if (audio === null) {
      setPlaying((was) => !was);
      return;
    }
    if (audio.paused) {
      void audio.play().catch(() => setPlaying(false));
      return;
    }
    audio.pause();
  };

  const footnote = audioFootnote(words, consentAt, retentionUntil, retentionBound);
  const play = playToggleOf(playing, words);
  return (
    <>
      {header}
      {/* The transcript IS this recording's caption, and it is a separate surface the player
          always points at (onOpenTranscript) — never an inline <track>. */}
      {src !== undefined ? (
        // biome-ignore lint/a11y/useMediaCaption: the transcript is the caption surface.
        <audio
          ref={element}
          src={src}
          preload="metadata"
          className="hg-audio-element"
          onLoadedMetadata={(event) => setReported(event.currentTarget.duration)}
          onTimeUpdate={(event) => setAt(event.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      ) : null}
      {/* Transport centres on the play button at every width — nothing reflows. */}
      <div className="hg-audio-transport">
        <SkipButton back onSeek={(delta) => seek(at + delta)} words={words} />
        <RoundButton kind="primary" label={play.label} onPress={toggle}>
          <AudioGlyph name={play.glyph} size={22} />
        </RoundButton>
        <SkipButton back={false} onSeek={(delta) => seek(at + delta)} words={words} />
      </div>
      <div className="hg-audio-line">
        <TimeLabel seconds={at} />
        <Scrubber at={at} total={total} onSeek={seek} words={words} />
        <TimeLabel seconds={total} dim />
        <SpeedButton rate={rate} speeds={speeds} onChange={setRate} words={words} />
      </div>
      {footnote !== '' || onOpenTranscript !== undefined ? (
        <div className="hg-audio-foot">
          {footnote !== '' ? <span className="hg-audio-footnote">{footnote}</span> : null}
          {onOpenTranscript !== undefined ? (
            <TranscriptDoor label={transcriptLabel} onPress={onOpenTranscript} />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
