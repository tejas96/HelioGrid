import { theme } from '@heliogrid/theme';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { RetryButton } from '../Button/RetryButton.native';
import { EmptyScene } from '../EmptyScene/EmptyScene.native';
import type { OverlayEmptyProps, OverlayErrorProps } from './Sheet.types';

/**
 * `empty` means none YET, so it invites: no tint, no glyph, an optional action that makes the
 * first one. The absence of a mark here is the point — a fault glyph would make "none yet" read
 * as "something went wrong".
 */
export function OverlayEmpty({ title, message, action, scene, variant }: OverlayEmptyProps) {
  return (
    <View style={[styles.state, variant === 'panel' ? styles.panelPad : styles.sheetPad]}>
      {scene === undefined ? null : <EmptyScene name={scene} />}
      {title === undefined ? null : <Text style={titleStyle}>{title}</Text>}
      {message === undefined ? null : (
        <Text
          variant="body-sm"
          color="secondary"
          align="center"
          style={variant === 'panel' ? styles.panelMessage : styles.sheetMessage}
        >
          {message}
        </Text>
      )}
      {action}
    </View>
  );
}

/**
 * `error` says something went wrong: warning tint, the warning glyph as the second channel, and a
 * retry — because trying again may work. `unavailable` is the state that gets neither, and it
 * renders through `UnavailableNote` instead.
 */
export function OverlayError({
  title,
  message,
  onRetry,
  variant,
  retryLabel,
  focusAfter,
}: OverlayErrorProps) {
  return (
    <View style={[styles.state, variant === 'panel' ? styles.panelPad : styles.sheetPad]}>
      <View style={styles.mark}>
        <ShellGlyph name="alert-circle" size="lg" ink={TONE.warning.ink} />
      </View>
      {title === undefined ? null : <Text style={titleStyle}>{title}</Text>}
      {message === undefined ? null : (
        <Text
          variant="body-sm"
          color="secondary"
          align="center"
          style={variant === 'panel' ? styles.panelMessage : styles.sheetMessage}
        >
          {message}
        </Text>
      )}
      <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
    </View>
  );
}

const titleStyle: TextStyle = {
  fontSize: theme.type.roles['card-head'].fontSize,
  fontWeight: '700',
  letterSpacing: -0.16,
};

const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  /* 28/24 and 48 are the reference's own state paddings; the 4px scale has neither 28 nor 48+8. */
  sheetPad: {
    paddingTop: 28,
    paddingBottom: theme.spacing['sp-6'],
    paddingHorizontal: theme.spacing['sp-2'],
  },
  panelPad: {
    paddingVertical: theme.spacing['sp-12'],
    paddingHorizontal: theme.spacing['sp-2'],
  },
  sheetMessage: { maxWidth: 280 },
  panelMessage: { maxWidth: 300 },
  mark: {
    width: 48,
    height: 48,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TONE.warning.tint,
    marginBottom: theme.spacing['sp-1'],
  },
});
