import { theme } from '@heliogrid/theme';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { RetryButton } from '../Button/RetryButton.native';
import type { OverlayEmptyProps, OverlayErrorProps } from './Sheet.types';

/**
 * `empty` means none YET, so it invites: no tint, no glyph, an optional action that makes the
 * first one. The absence of a mark here is the point — a fault glyph would make "none yet" read
 * as "something went wrong".
 */
export function OverlayEmpty({ title, message, action, variant }: OverlayEmptyProps) {
  return (
    <View style={[styles.state, variant === 'panel' ? styles.panelPad : styles.sheetPad]}>
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
        <Svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors['warning-text']}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ShellGlyphMarks name="alert-circle" />
        </Svg>
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

/* 16px and -0.01em of it in points — neither has a type token, and both come from the reference. */
const titleStyle: TextStyle = { fontSize: 16, fontWeight: '700', letterSpacing: -0.16 };

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
    backgroundColor: theme.colors['warning-bg'],
    marginBottom: theme.spacing['sp-1'],
  },
});
