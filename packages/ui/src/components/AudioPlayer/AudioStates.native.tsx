import { theme } from '@heliogrid/theme';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { UnavailableNote } from '../UnavailableNote';
import { AudioGlyph } from './AudioGlyph.native';
import type { AudioPlayerProps, AudioUnavailableReason } from './AudioPlayer.types';
import { AUDIO_REASONS, audioReasonFootnote } from './AudioPlayer.types';
import { TranscriptDoor } from './AudioTransport.native';

const type = theme.type.roles;

const REASON_TINT: Record<AudioUnavailableReason, { bg: string; fg: string }> = {
  'consent-declined': { bg: theme.colors['neutral-bg'], fg: theme.colors['text-secondary'] },
  'purged-retention': { bg: theme.colors['info-bg'], fg: theme.colors.info },
};

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-sm'],
  },
  panelError: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: theme.colors['warning-bg'],
  },
  errorText: {
    fontFamily: theme.type.families.sans,
    fontSize: type['body-sm'].fontSize,
    lineHeight: type['body-sm'].lineHeight,
    color: theme.colors['warning-text'],
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  body: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: theme.type.families.sans,
    fontSize: type['body-sm'].fontSize,
    fontWeight: '700',
    letterSpacing: -0.13,
    color: theme.colors['text-primary'],
  },
  text: {
    marginTop: 3,
    fontFamily: theme.type.families.sans,
    fontSize: type['body-sm'].fontSize,
    lineHeight: type['body-sm'].lineHeight,
    color: theme.colors['text-secondary'],
  },
  note: {
    marginTop: 6,
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    color: theme.colors['text-tertiary'],
  },
  door: { flexDirection: 'row', marginTop: theme.spacing['sp-3'] },
  retry: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  retryText: {
    fontFamily: theme.type.families.sans,
    fontSize: type['body-sm'].fontSize,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
  skeleton: {
    height: 96,
    borderRadius: theme.radius['r-sm'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
});

/**
 * The fetch is still running. Never a placeholder value presented as a real one — and that
 * includes the ROLE: web's half is `role="status"`, and the RN counterpart is `accessible` plus a
 * polite live region, never `progressbar`, which would promise a position this block has none of.
 */
export function AudioLoading() {
  return (
    <View
      accessible
      accessibilityLabel="Loading the recording"
      accessibilityLiveRegion="polite"
      style={styles.skeleton}
    />
  );
}

/** The fetch failed — which is NOT the same fact as there being no recording, so it retries. */
export function AudioError({
  errorMessage,
  onRetry,
  onOpenTranscript,
  transcriptLabel,
}: Required<Pick<AudioPlayerProps, 'errorMessage' | 'transcriptLabel'>> &
  Pick<AudioPlayerProps, 'onRetry' | 'onOpenTranscript'>) {
  return (
    <View style={[styles.panel, styles.panelError]}>
      <Text style={styles.errorText}>{errorMessage}</Text>
      <View style={styles.actions}>
        {onRetry !== undefined ? (
          <Pressable onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
        {onOpenTranscript !== undefined ? (
          <TranscriptDoor label={transcriptLabel} onPress={onOpenTranscript} />
        ) : null}
      </View>
    </View>
  );
}

export interface AudioUnavailableProps
  extends Pick<AudioPlayerProps, 'consentAt' | 'purgedAt' | 'retentionBound' | 'onOpenTranscript'> {
  reason?: AudioUnavailableReason;
  transcriptLabel: string;
}

/**
 * Same state, two sentences that must never look alike. With NO named reason the player still
 * says so honestly — it just cannot say which sentence is true, so it does not pretend to.
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
  const tint = REASON_TINT[reason];
  const note = audioReasonFootnote(reason, { purgedAt, retentionBound, consentAt });
  return (
    <View accessibilityLiveRegion="polite" style={[styles.panel, { backgroundColor: tint.bg }]}>
      <AudioGlyph name={copy.glyph} size={20} color={tint.fg} />
      <View style={styles.body}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.text}>{copy.body}</Text>
        {note !== '' ? <Text style={styles.note}>{note}</Text> : null}
        {door !== null ? <View style={styles.door}>{door}</View> : null}
      </View>
    </View>
  );
}
