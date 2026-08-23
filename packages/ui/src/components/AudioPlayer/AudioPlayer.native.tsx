import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
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
  state = 'ready',
  reason,
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
  playing,
  position,
  rate,
  onPlayingChange,
  onSeek,
  onRateChange,
  style,
}: NativeAudioPlayerProps) {
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
      <View style={shell}>
        {header}
        <AudioLoading />
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={shell}>
        {header}
        <AudioError
          errorMessage={errorMessage}
          onRetry={onRetry}
          onOpenTranscript={onOpenTranscript}
          transcriptLabel={transcriptLabel}
        />
      </View>
    );
  }

  if (state === 'unavailable') {
    return (
      <View style={shell}>
        {header}
        <AudioUnavailable
          reason={reason}
          consentAt={consentAt}
          purgedAt={purgedAt}
          retentionBound={retentionBound}
          onOpenTranscript={onOpenTranscript}
          transcriptLabel={transcriptLabel}
        />
      </View>
    );
  }

  return (
    <View style={shell}>
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
