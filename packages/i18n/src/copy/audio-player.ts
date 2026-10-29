/**
 * `AudioPlayer`'s own words (`packages/ui`'s `AudioPlayerWords`): its controls' names, the
 * scrubber's spoken position, the two reasons a recording is absent — which must never read
 * alike — and the footnote's facts. Plus the usual sentence of its failed state, which a player
 * draws only when given.
 */
import type { Translator } from '../runtime';
import { SHELL } from './shell';

export const AUDIO_PLAYER = {
  loading: /*i18n*/ { id: 'Loading the recording' },
  openTranscript: /*i18n*/ { id: 'Open transcript' },
  play: /*i18n*/ { id: 'Play recording' },
  pause: /*i18n*/ { id: 'Pause recording' },
  back: /*i18n*/ { id: 'Back 10 seconds' },
  forward: /*i18n*/ { id: 'Forward 30 seconds' },
  seek: /*i18n*/ { id: 'Seek within the recording' },
  position: SHELL.markCount,
  speed: /*i18n*/ { id: 'Playback speed {rate}×. Tap to change.' },
  noRecording: /*i18n*/ { id: 'No recording on this call' },
  noRecordingBody: /*i18n*/ {
    id: "The call is on the record; the audio is not. The transcript and the rep's notes are still here.",
  },
  declined: /*i18n*/ { id: 'Not recorded — the customer declined' },
  declinedBody: /*i18n*/ {
    id: "The call went ahead; only the recording was declined. The transcript and the rep's notes are on this record.",
  },
  purged: /*i18n*/ { id: 'Recording deleted on schedule' },
  purgedBody: /*i18n*/ {
    id: 'The recording reached the retention bound and was deleted. The transcript is retained.',
  },
  recordedWithConsent: /*i18n*/ { id: 'Recorded with consent · {at}' },
  availableUntil: /*i18n*/ { id: 'Available until {date}' },
  deletedOn: /*i18n*/ { id: 'Deleted {date}' },
  consentDeclinedOn: /*i18n*/ { id: 'Consent declined {date}' },
  couldNotLoad: /*i18n*/ {
    id: "Couldn't load this recording. Try again — the transcript is on this record either way.",
  },
} as const;

/** Every word `AudioPlayer` says itself, in the reader's language. */
export function audioPlayerWords(t: Translator['t']) {
  return {
    loading: t(AUDIO_PLAYER.loading),
    openTranscript: t(AUDIO_PLAYER.openTranscript),
    play: t(AUDIO_PLAYER.play),
    pause: t(AUDIO_PLAYER.pause),
    back: t(AUDIO_PLAYER.back),
    forward: t(AUDIO_PLAYER.forward),
    seek: t(AUDIO_PLAYER.seek),
    position: (at: string, total: string) => t(AUDIO_PLAYER.position, { step: at, total }),
    speed: (rate: number) => t(AUDIO_PLAYER.speed, { rate }),
    noRecording: {
      title: t(AUDIO_PLAYER.noRecording),
      body: t(AUDIO_PLAYER.noRecordingBody),
    },
    reasons: {
      'consent-declined': {
        title: t(AUDIO_PLAYER.declined),
        body: t(AUDIO_PLAYER.declinedBody),
      },
      'purged-retention': {
        title: t(AUDIO_PLAYER.purged),
        body: t(AUDIO_PLAYER.purgedBody),
      },
    },
    recordedWithConsent: (at: string) => t(AUDIO_PLAYER.recordedWithConsent, { at }),
    availableUntil: (date: string) => t(AUDIO_PLAYER.availableUntil, { date }),
    deletedOn: (date: string) => t(AUDIO_PLAYER.deletedOn, { date }),
    consentDeclinedOn: (date: string) => t(AUDIO_PLAYER.consentDeclinedOn, { date }),
  };
}
