import type { FocusAfter } from '../../primitives/FocusAfter';
import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote';
import { AudioGlyph } from './AudioGlyph';
import { reasonPanelOf } from './AudioPlayer.logic';
import type { AudioPlayerProps, AudioUnavailableProps } from './AudioPlayer.types';
import { TranscriptDoor } from './AudioTransport';

/** The fetch failed — which is NOT the same fact as there being no recording, so it retries. */
export function AudioError({
  errorMessage,
  onRetry,
  retryLabel,
  focusAfter,
  onOpenTranscript,
  transcriptLabel,
}: Required<Pick<AudioPlayerProps, 'transcriptLabel'>> &
  Pick<AudioPlayerProps, 'errorMessage' | 'retryLabel' | 'onOpenTranscript'> & {
    onRetry?: () => void;
    /** The player's frame, where focus lands once the retry has left. */
    focusAfter: FocusAfter;
  }) {
  return (
    <div className="hg-audio-panel" data-tone="error">
      {errorMessage !== undefined ? (
        <p className="hg-audio-panel-error-text">{errorMessage}</p>
      ) : null}
      <div className="hg-audio-panel-actions">
        <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
        {onOpenTranscript !== undefined ? (
          <TranscriptDoor label={transcriptLabel} onPress={onOpenTranscript} />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Same state, two sentences that must never look alike. An unavailable recording with NO named
 * reason still says so honestly — it just cannot say which sentence is true, so it does not
 * pretend to, and it never renders a disabled play button.
 */
export function AudioUnavailable({
  reason,
  onOpenTranscript,
  transcriptLabel,
  words,
  ...facts
}: AudioUnavailableProps) {
  const door =
    onOpenTranscript !== undefined ? (
      <TranscriptDoor label={transcriptLabel} onPress={onOpenTranscript} />
    ) : null;
  if (reason === undefined) {
    return (
      <UnavailableNote
        title={words.noRecording.title}
        message={words.noRecording.body}
        action={door}
      />
    );
  }
  const panel = reasonPanelOf(reason, words, facts);
  return (
    <div role="status" className="hg-audio-panel" data-tone={reason}>
      <AudioGlyph name={panel.glyph} size={20} />
      <div className="hg-audio-panel-body">
        <div className="hg-audio-panel-title">{panel.title}</div>
        <div className="hg-audio-panel-text">{panel.body}</div>
        {panel.footnote !== '' ? <div className="hg-audio-panel-note">{panel.footnote}</div> : null}
        {door !== null ? <div className="hg-audio-panel-door">{door}</div> : null}
      </div>
    </div>
  );
}
