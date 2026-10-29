import type { TranslatedText } from '@heliogrid/contracts';
import type { SurfaceRead } from '../UnavailableNote';

/**
 * **Why there is no recording.** Same state (`unavailable`), two sentences that must never look
 * alike: `consent-declined` (no recording ever existed) and `purged-retention` (it existed and was
 * deleted on schedule). The reason stays local to this component because the difference between
 * those two facts is a business fact an auditor reads at a glance, not a tone a shared state could
 * carry.
 */
export type AudioUnavailableReason = 'consent-declined' | 'purged-retention';

export interface AudioPlayerProps {
  /**
   * The system's state vocabulary. **The old `status` union is gone** —
   * `"available" | "consent-declined" | "purged-retention"` was this component's private spelling of
   * the fourth state, parallel to `MapSurface`'s `tiles-unavailable`. Now: `ready` plays,
   * `unavailable` + `reason` states why there is no audio, and `loading` / `error` cover the fetch.
   * Neither unavailable reason is an error and neither shows a disabled play button.
   *
   * Required: what this draws always comes from a read, and a failed read carries its retry.
   */
  read: SurfaceRead;
  /** Required when the read is `unavailable`. Without it the player states the absence generically. */
  reason?: AudioUnavailableReason;
  /** Required when the read is `ready`. */
  src?: string;
  /** Known length in seconds, used until the audio reports its own metadata. */
  duration?: number;
  title?: TranslatedText;
  meta?: string;
  /** "12 Mar 2026, 4:12 pm" — shown as consent provenance (available) or the decline date. */
  consentAt?: string;
  /** "10 Jun 2026" — the pack's retention bound while the recording is still playable. */
  retentionUntil?: string;
  /** "14 Jun 2026" — when the recording was actually deleted. */
  purgedAt?: string;
  /** The rule in words, e.g. "Growth pack · 90-day retention". Names WHY, not just when. */
  retentionBound?: string;
  /**
   * `error`'s sentence — the fetch failed, which is not the same as there being no recording.
   * Drawn only when given — `@heliogrid/i18n`'s `AUDIO_PLAYER` holds the usual one.
   */
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /**
   * The transcript survives in every state — always give it somewhere to point, and what it points
   * at is `Transcript`, in an `EditorSurface` (`SCR-M07-13` / `SCR-M07-19`).
   */
  onOpenTranscript?: () => void;
  /** The transcript door's words. Default: `words.openTranscript`. */
  transcriptLabel?: TranslatedText;
  speeds?: number[];
  density?: 'expressive' | 'functional';
  /** The player's own words — its controls' names, its states' sentences, its footnotes. */
  words: AudioPlayerWords;
}

/** One unavailable recording's two lines: what is true, then what is still on the record. */
export interface AudioAbsenceWords {
  title: TranslatedText;
  body: TranslatedText;
}

/** The words a player says itself, in the reader's language (`@heliogrid/i18n`'s `audioPlayerWords`). */
export interface AudioPlayerWords {
  /** What a screen reader hears while the recording loads. */
  loading: TranslatedText;
  /** The transcript door, when the caller names it nothing else. */
  openTranscript: TranslatedText;
  play: TranslatedText;
  pause: TranslatedText;
  /** The ghost skip buttons — 10 seconds back, 30 forward. */
  back: TranslatedText;
  forward: TranslatedText;
  /** The scrubber's name. */
  seek: TranslatedText;
  /** The scrubber's spoken value — *1:05 of 4:12*, each time already written. */
  position(at: string, total: string): TranslatedText;
  /** The speed pill's name, with the rate it plays at now. */
  speed(rate: number): TranslatedText;
  /** An unavailable recording whose reason is not named. */
  noRecording: AudioAbsenceWords;
  /** Why there is no recording — two sentences that must never look alike. */
  reasons: Readonly<Record<AudioUnavailableReason, AudioAbsenceWords>>;
  /** The footnote's facts, each with its date or time already written. */
  recordedWithConsent(at: string): TranslatedText;
  availableUntil(date: string): TranslatedText;
  deletedOn(date: string): TranslatedText;
  consentDeclinedOn(date: string): TranslatedText;
}

/**
 * **THE NATIVE CONTROL SURFACE — props in, events out.** Read this before using the native half.
 *
 * The design system's own player DECODES: `<audio ref={el} src={src} preload="metadata" …>` is in
 * `AudioPlayer.jsx`, and `AudioPlayerProps` above declares no `onPlay`, no `onSeek` and no
 * `onRateChange` for exactly that reason — on the web nothing outside the component has to be
 * told anything, because the decoder is inside it. The web half here is that same component and
 * keeps that same contract.
 *
 * React Native has no `<audio>` element, and packages/ui declares no RN media dependency, so the
 * native half CANNOT decode. It therefore does not claim to: it renders the transport, it reads
 * `playing` / `position` / `rate` from the screen that owns the player, and it reports every
 * gesture back through the three callbacks. Whatever a caller does not wire is rendered DISABLED,
 * because a play button with nothing behind it is a control that lies about what it does.
 *
 * These are native-local props (docs/engineering/17 §2's platform split, the same rule that keeps `style` off
 * the web half), so they widen the DS contract rather than replacing any part of it.
 */
export interface AudioTransportControl {
  /** Is the host's player running? The glyph is this, never a guess. */
  playing?: boolean;
  /** Where the host's player is, in seconds. The scrubber and the left-hand time read it. */
  position?: number;
  /** The host's playback rate. The speed pill shows it; it never sets it. */
  rate?: number;
  /** Play was pressed (`true`) or pause was (`false`). Without it the play button is disabled. */
  onPlayingChange?: (playing: boolean) => void;
  /** A seek in seconds, already clamped to `[0, duration]`. Without it seeking is disabled. */
  onSeek?: (seconds: number) => void;
  /** The next rate off `speeds`. Without it the speed pill is disabled. */
  onRateChange?: (rate: number) => void;
}

/** The glyphs the transport and the two unavailable reasons draw. */
export type AudioGlyphName = 'play' | 'pause' | 'back' | 'fwd' | 'mic-off' | 'clock' | 'doc';

/**
 * The two REASONS an unavailable recording can be unavailable for. Same state, two sentences —
 * they must never look alike, so each has its own words (`AudioPlayerWords.reasons`), glyph and
 * tint.
 */
export const AUDIO_REASON_GLYPH: Record<
  AudioUnavailableReason,
  Extract<AudioGlyphName, 'mic-off' | 'clock'>
> = {
  'consent-declined': 'mic-off',
  'purged-retention': 'clock',
};

/** m:ss, or h:mm:ss past the hour. `--:--` while there is no honest length to state. */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}

/** The keyboard seek table: arrows ±5s, page keys ±60s. Home/End are handled by the caller. */
export const AUDIO_SEEK_KEYS: Record<string, number> = {
  ArrowLeft: -5,
  ArrowRight: 5,
  ArrowDown: -5,
  ArrowUp: 5,
  PageDown: -60,
  PageUp: 60,
};

/** Footnote facts, the absent ones dropped, one line apart by dots. */
function footnoteOf(parts: Array<string | null | undefined>): string {
  return parts
    .filter((part): part is string => part !== null && part !== undefined && part !== '')
    .join(' · ');
}

/** The line under a playable recording: on whose authority it exists, and how long it will. */
export function audioFootnote(
  words: AudioPlayerWords,
  consentAt: string | undefined,
  retentionUntil: string | undefined,
  retentionBound: string | undefined,
): string {
  return footnoteOf([
    consentAt !== undefined ? words.recordedWithConsent(consentAt) : null,
    retentionUntil !== undefined ? words.availableUntil(retentionUntil) : null,
    retentionBound,
  ]);
}

/** The unavailable footnote — the purge date and the rule, or the date consent was declined. */
export function audioReasonFootnote(
  words: AudioPlayerWords,
  reason: AudioUnavailableReason,
  values: { purgedAt?: string; retentionBound?: string; consentAt?: string },
): string {
  return reason === 'purged-retention'
    ? footnoteOf([
        values.purgedAt !== undefined ? words.deletedOn(values.purgedAt) : null,
        values.retentionBound,
      ])
    : footnoteOf([
        values.consentAt !== undefined ? words.consentDeclinedOn(values.consentAt) : null,
      ]);
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

export interface AudioUnavailableProps
  extends Pick<AudioPlayerProps, 'consentAt' | 'purgedAt' | 'retentionBound' | 'onOpenTranscript'> {
  reason?: AudioUnavailableReason;
  transcriptLabel: TranslatedText;
  words: AudioPlayerWords;
}
