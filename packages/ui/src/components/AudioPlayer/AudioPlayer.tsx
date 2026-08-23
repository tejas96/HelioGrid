import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
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
  state = 'ready',
  reason,
  src,
  duration = 0,
  title,
  meta,
  consentAt,
  retentionUntil,
  purgedAt,
  retentionBound,
  errorMessage = "Couldn't load this recording. Tap Try again — the transcript is on this record either way.",
  onRetry,
  onOpenTranscript,
  transcriptLabel = 'Open transcript',
  speeds = [1, 1.25, 1.5, 2],
  density = 'expressive',
  className,
  style,
}: WebAudioPlayerProps) {
  const shell = classNames('hg-audio', className);
  const header =
    title !== undefined || meta !== undefined ? (
      <div>
        {title !== undefined ? <div className="hg-audio-title">{title}</div> : null}
        {meta !== undefined ? <div className="hg-audio-meta">{meta}</div> : null}
      </div>
    ) : null;

  if (state === 'loading') {
    return (
      <div className={shell} data-density={density} style={style}>
        {header}
        <div role="status" aria-label="Loading the recording" className="hg-audio-skeleton" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={shell} data-density={density} style={style}>
        {header}
        <AudioError
          errorMessage={errorMessage}
          onRetry={onRetry}
          onOpenTranscript={onOpenTranscript}
          transcriptLabel={transcriptLabel}
        />
      </div>
    );
  }

  if (state === 'unavailable') {
    return (
      <div className={shell} data-density={density} style={style}>
        {header}
        <AudioUnavailable
          reason={reason}
          consentAt={consentAt}
          purgedAt={purgedAt}
          retentionBound={retentionBound}
          onOpenTranscript={onOpenTranscript}
          transcriptLabel={transcriptLabel}
        />
      </div>
    );
  }

  return (
    <div className={shell} data-density={density} style={style}>
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
      />
    </div>
  );
}
