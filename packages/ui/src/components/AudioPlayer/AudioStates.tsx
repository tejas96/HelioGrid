import { UnavailableNote } from '../UnavailableNote';
import { AudioGlyph } from './AudioGlyph';
import type { AudioPlayerProps, AudioUnavailableReason } from './AudioPlayer.types';
import { AUDIO_REASONS, audioReasonFootnote } from './AudioPlayer.types';
import { TranscriptDoor } from './AudioTransport';

/** The fetch failed — which is NOT the same fact as there being no recording, so it retries. */
export function AudioError({
  errorMessage,
  onRetry,
  onOpenTranscript,
  transcriptLabel,
}: Required<Pick<AudioPlayerProps, 'errorMessage' | 'transcriptLabel'>> &
  Pick<AudioPlayerProps, 'onRetry' | 'onOpenTranscript'>) {
  return (
    <div className="hg-audio-panel" data-tone="error">
      <p className="hg-audio-panel-error-text">{errorMessage}</p>
      <div className="hg-audio-panel-actions">
        {onRetry !== undefined ? (
          <button type="button" className="hg-audio-text-action" onClick={onRetry}>
            Try again
          </button>
        ) : null}
        {onOpenTranscript !== undefined ? (
          <TranscriptDoor label={transcriptLabel} onPress={onOpenTranscript} />
        ) : null}
      </div>
    </div>
  );
}

export interface AudioUnavailableProps
  extends Pick<AudioPlayerProps, 'consentAt' | 'purgedAt' | 'retentionBound' | 'onOpenTranscript'> {
  reason?: AudioUnavailableReason;
  transcriptLabel: string;
}

/**
 * Same state, two sentences that must never look alike. An unavailable recording with NO named
 * reason still says so honestly — it just cannot say which sentence is true, so it does not
 * pretend to, and it never renders a disabled play button.
 */
export function AudioUnavailable({
  reason,
  consentAt,
  purgedAt,
  retentionBound,
  onOpenTranscript,
  transcriptLabel,
}: AudioUnavailableProps) {
  const door =
    onOpenTranscript !== undefined ? (
      <TranscriptDoor label={transcriptLabel} onPress={onOpenTranscript} />
    ) : null;
  if (reason === undefined) {
    return (
      <UnavailableNote
        title="No recording on this call"
        message="The call is on the record; the audio is not. The transcript and the rep's notes are still here."
        action={door}
      />
    );
  }
  const copy = AUDIO_REASONS[reason];
  const note = audioReasonFootnote(reason, { purgedAt, retentionBound, consentAt });
  return (
    <div role="status" className="hg-audio-panel" data-tone={reason}>
      <AudioGlyph name={copy.glyph} size={20} />
      <div className="hg-audio-panel-body">
        <div className="hg-audio-panel-title">{copy.title}</div>
        <div className="hg-audio-panel-text">{copy.body}</div>
        {note !== '' ? <div className="hg-audio-panel-note">{note}</div> : null}
        {door !== null ? <div className="hg-audio-panel-door">{door}</div> : null}
      </div>
    </div>
  );
}
