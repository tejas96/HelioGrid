import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { AUDIO_PLAYER_DEFAULTS } from './AudioPlayer.logic';
import type { AudioPlayerProps } from './AudioPlayer.types';
import { AudioPlayerReady } from './AudioPlayerReady';
import { AudioError, AudioUnavailable } from './AudioStates';

interface WebAudioPlayerProps extends AudioPlayerProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Call-recording player whose states are governed by consent and retention law, not by playback.
 * Transport: play centred between the two skips at every width, track + times + speed below.
 * 44×44 targets, keyboard seek (arrows ±5s, page keys ±60s, Home/End), ±10s/30s skip.
 */
export function AudioPlayer({
  read,
  reason,
  src,
  duration = AUDIO_PLAYER_DEFAULTS.duration,
  title,
  meta,
  consentAt,
  retentionUntil,
  purgedAt,
  retentionBound,
  errorMessage,
  retryLabel,
  onOpenTranscript,
  words,
  transcriptLabel = words.openTranscript,
  speeds = AUDIO_PLAYER_DEFAULTS.speeds,
  density = AUDIO_PLAYER_DEFAULTS.density,
  className,
  style,
}: WebAudioPlayerProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  /* The player's frame outlives its states, so focus lands on it once the retry has left. */
  const frame = useRef<HTMLDivElement>(null);
  const shell = classNames('hg-audio', 'hg-focus-target', className);
  const header =
    title !== undefined || meta !== undefined ? (
      <div>
        {title !== undefined ? <div className="hg-audio-title">{title}</div> : null}
        {meta !== undefined ? <div className="hg-audio-meta">{meta}</div> : null}
      </div>
    ) : null;

  if (state === 'loading') {
    return (
      <div ref={frame} tabIndex={-1} className={shell} data-density={density} style={style}>
        {header}
        <div role="status" aria-label={words.loading} className="hg-audio-skeleton" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div ref={frame} tabIndex={-1} className={shell} data-density={density} style={style}>
        {header}
        <AudioError
          errorMessage={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={frame}
          onOpenTranscript={onOpenTranscript}
          transcriptLabel={transcriptLabel}
        />
      </div>
    );
  }

  if (state === 'unavailable') {
    return (
      <div ref={frame} tabIndex={-1} className={shell} data-density={density} style={style}>
        {header}
        <AudioUnavailable
          reason={reason}
          consentAt={consentAt}
          purgedAt={purgedAt}
          retentionBound={retentionBound}
          onOpenTranscript={onOpenTranscript}
          transcriptLabel={transcriptLabel}
          words={words}
        />
      </div>
    );
  }

  return (
    <div ref={frame} tabIndex={-1} className={shell} data-density={density} style={style}>
      <AudioPlayerReady
        src={src}
        duration={duration}
        consentAt={consentAt}
        retentionUntil={retentionUntil}
        retentionBound={retentionBound}
        onOpenTranscript={onOpenTranscript}
        speeds={speeds}
        transcriptLabel={transcriptLabel}
        header={header}
        words={words}
      />
    </div>
  );
}
