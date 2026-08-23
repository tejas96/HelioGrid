import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AudioGlyph } from './AudioGlyph';
import type { AudioPlayerProps } from './AudioPlayer.types';
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
  transcriptLabel: string;
  header: ReactNode;
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
    const next = Math.min(total, Math.max(0, seconds));
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

  const footnote = audioFootnote(consentAt, retentionUntil, retentionBound);
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
        <SkipButton back onSeek={(delta) => seek(at + delta)} />
        <RoundButton
          kind="primary"
          label={playing ? 'Pause recording' : 'Play recording'}
          onPress={toggle}
        >
          <AudioGlyph name={playing ? 'pause' : 'play'} size={22} />
        </RoundButton>
        <SkipButton back={false} onSeek={(delta) => seek(at + delta)} />
      </div>
      <div className="hg-audio-line">
        <TimeLabel seconds={at} />
        <Scrubber at={at} total={total} onSeek={seek} />
        <TimeLabel seconds={total} dim />
        <SpeedButton rate={rate} speeds={speeds} onChange={setRate} />
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
