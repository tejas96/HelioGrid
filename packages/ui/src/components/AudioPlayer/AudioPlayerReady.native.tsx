import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AudioGlyph } from './AudioGlyph.native';
import type { AudioPlayerProps, AudioTransportControl } from './AudioPlayer.types';
import { audioFootnote } from './AudioPlayer.types';
import {
  RoundButton,
  Scrubber,
  SkipButton,
  SpeedButton,
  TimeLabel,
  TranscriptDoor,
} from './AudioTransport.native';

const styles = StyleSheet.create({
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-5'],
    paddingTop: 2,
  },
  transportFunctional: { gap: theme.spacing['sp-3'] },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  footnote: {
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles.caption.fontSize,
    color: theme.colors['text-tertiary'],
    flexShrink: 1,
  },
});

export interface AudioPlayerReadyProps
  extends Pick<
      AudioPlayerProps,
      'consentAt' | 'retentionUntil' | 'retentionBound' | 'onOpenTranscript' | 'density'
    >,
    AudioTransportControl {
  duration: number;
  speeds: number[];
  transcriptLabel: string;
  header: ReactNode;
}

/**
 * The playable state on React Native: the transport, the position, the rate and the two honest
 * footnotes — CONTROLLED, never simulated.
 *
 * The web half wraps a real `<audio>` element and can therefore hold `playing` and the position
 * itself. React Native has no such element and packages/ui declares no RN media dependency, so
 * this half holds NO playback state at all: `playing`, `position` and `rate` are read from the
 * screen that owns the player, and every press leaves through `onPlayingChange` / `onSeek` /
 * `onRateChange`. Local `useState` here would move a glyph and a thumb while the audio did
 * nothing, which is the one thing a control must never do.
 *
 * A control with no callback behind it is rendered DISABLED rather than live, so an unwired
 * player looks exactly as capable as it is.
 */
export function AudioPlayerReady({
  duration,
  consentAt,
  retentionUntil,
  retentionBound,
  onOpenTranscript,
  density,
  speeds,
  transcriptLabel,
  header,
  playing = false,
  position = 0,
  rate = 1,
  onPlayingChange,
  onSeek,
  onRateChange,
}: AudioPlayerReadyProps) {
  const at = Math.min(duration, Math.max(0, position));
  const seek = (seconds: number) => onSeek?.(Math.min(duration, Math.max(0, seconds)));
  const canSeek = onSeek !== undefined;
  const footnote = audioFootnote(consentAt, retentionUntil, retentionBound);

  /* Said once per mount, not per render: a ready player with no control surface wired is a
     screen that forgot to hand this half its decoder, and the transport is inert by design. */
  const wired = onPlayingChange !== undefined || canSeek;
  useEffect(() => {
    if (wired) return;
    console.warn(
      'AudioPlayer (React Native): state="ready" draws the transport only — this platform has no decoder. Pass `playing`, `position` and `rate` from your player and handle `onPlayingChange`, `onSeek` and `onRateChange`, or the controls stay disabled.',
    );
  }, [wired]);

  return (
    <>
      {header}
      {/* Transport centres on the play button at every width — nothing reflows. */}
      <View
        style={[styles.transport, density === 'functional' ? styles.transportFunctional : null]}
      >
        <SkipButton back disabled={!canSeek} onSeek={(delta) => seek(at + delta)} />
        <RoundButton
          kind="primary"
          disabled={onPlayingChange === undefined}
          label={playing ? 'Pause recording' : 'Play recording'}
          onPress={() => onPlayingChange?.(!playing)}
        >
          <AudioGlyph
            name={playing ? 'pause' : 'play'}
            size={22}
            color={theme.colors['text-inverse']}
          />
        </RoundButton>
        <SkipButton back={false} disabled={!canSeek} onSeek={(delta) => seek(at + delta)} />
      </View>
      <View style={styles.line}>
        <TimeLabel seconds={at} />
        <Scrubber at={at} total={duration} disabled={!canSeek} onSeek={seek} />
        <TimeLabel seconds={duration} dim />
        <SpeedButton
          rate={rate}
          speeds={speeds}
          disabled={onRateChange === undefined}
          onChange={(next) => onRateChange?.(next)}
        />
      </View>
      {footnote !== '' || onOpenTranscript !== undefined ? (
        <View style={styles.foot}>
          {footnote !== '' ? <Text style={styles.footnote}>{footnote}</Text> : null}
          {onOpenTranscript !== undefined ? (
            <TranscriptDoor label={transcriptLabel} onPress={onOpenTranscript} />
          ) : null}
        </View>
      ) : null}
    </>
  );
}
