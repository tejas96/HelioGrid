import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { AUDIO_PLAYER_DEFAULTS } from './AudioPlayer.logic';
import type { AudioPlayerProps, AudioTransportControl } from './AudioPlayer.types';
import { AudioPlayerReady } from './AudioPlayerReady.native';
import { AudioError, AudioLoading, AudioUnavailable } from './AudioStates.native';

interface NativeAudioPlayerProps extends AudioPlayerProps, AudioTransportControl {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  shell: { width: '100%', gap: 10 },
  shellFunctional: { gap: theme.spacing['sp-2'] },
  title: {
    fontFamily: theme.type.families.sans,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.14,
    color: theme.colors['text-primary'],
  },
  meta: {
    marginTop: 2,
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles.caption.fontSize,
    color: theme.colors['text-tertiary'],
  },
});

/**
 * Call-recording player whose states are governed by consent and retention law, not by playback.
 *
 * THE CONTRACT ON THIS PLATFORM, stated plainly. The design system's player decodes its own audio
 * (`<audio ref={el} src={src} preload="metadata" …>`), which is why `AudioPlayerProps` declares no
 * playback callbacks — nothing outside the component needs telling when the component is holding
 * the decoder. React Native has no `<audio>` element and packages/ui declares no RN media
 * dependency, so `src` is NOT decoded here: the screen hands the same `src` to its own player and
 * drives this half through `AudioTransportControl` — `playing`, `position` and `rate` in,
 * `onPlayingChange`, `onSeek` and `onRateChange` out.
 *
 * `src` is still accepted, because it is the DS contract and a caller passes one object to both
 * platforms; this half simply renders no element for it. Any control whose callback is missing is
 * rendered disabled, so nothing here draws an affordance it cannot honour.
 */
export function AudioPlayer({
  read,
  reason,
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
  playing,
  position,
  rate,
  onPlayingChange,
  onSeek,
  onRateChange,
  style,
}: NativeAudioPlayerProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  /* The player's frame outlives its states, so focus lands on it once the retry has left. */
  const frame = useRef<View>(null);
  const shell: StyleProp<ViewStyle> = [
    styles.shell,
    density === 'functional' ? styles.shellFunctional : null,
    style,
  ];
  const header =
    title !== undefined || meta !== undefined ? (
      <View>
        {title !== undefined ? <Text style={styles.title}>{title}</Text> : null}
        {meta !== undefined ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    ) : null;

  if (state === 'loading') {
    return (
      <View ref={frame} style={shell}>
        {header}
        <AudioLoading label={words.loading} />
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View ref={frame} style={shell}>
        {header}
        <AudioError
          errorMessage={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={frame}
          onOpenTranscript={onOpenTranscript}
          transcriptLabel={transcriptLabel}
        />
      </View>
    );
  }

  if (state === 'unavailable') {
    return (
      <View ref={frame} style={shell}>
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
      </View>
    );
  }

  return (
    <View ref={frame} style={shell}>
      <AudioPlayerReady
        duration={duration}
        consentAt={consentAt}
        retentionUntil={retentionUntil}
        retentionBound={retentionBound}
        onOpenTranscript={onOpenTranscript}
        density={density}
        speeds={speeds}
        transcriptLabel={transcriptLabel}
        header={header}
        words={words}
        playing={playing}
        position={position}
        rate={rate}
        onPlayingChange={onPlayingChange}
        onSeek={onSeek}
        onRateChange={onRateChange}
      />
    </View>
  );
}
