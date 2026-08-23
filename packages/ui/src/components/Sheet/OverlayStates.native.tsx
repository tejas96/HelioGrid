import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';

/** `sheet` bodies are 280px wide and 28/24 padded; `panel` bodies 300px and 48 padded. */
export type OverlayStateVariant = 'sheet' | 'panel';

interface OverlayEmptyProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  variant: OverlayStateVariant;
}

interface OverlayErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant: OverlayStateVariant;
  /** The retry's words. The reference hardcodes them; no prop on the contract carries them. */
  retryLabel?: string;
}

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
  retryLabel = 'Try again',
}: OverlayErrorProps) {
  return (
    <View style={[styles.state, variant === 'panel' ? styles.panelPad : styles.sheetPad]}>
      <View style={styles.mark}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 9v4M12 17h.01"
            stroke={theme.colors['warning-text']}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={12} r={9} stroke={theme.colors['warning-text']} strokeWidth={1.5} />
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
      {onRetry === undefined ? null : (
        /* NAME_FROM_CONTENT (check h), and no `accessibilityLabel`: the `<Text>` child IS this
           target's name, exactly as the web half's `<button>{retryLabel}</button>` is named by its
           own words. An explicit label here was a second copy of the same string — one that
           OVERRIDES the child rather than adding anything, so the two halves would have drifted
           the moment the words were changed in one place. */
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text style={retryText}>{retryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* 16px and -0.01em of it in points — neither has a type token, and both come from the reference. */
const titleStyle: TextStyle = { fontSize: 16, fontWeight: '700', letterSpacing: -0.16 };
const retryText: TextStyle = { fontWeight: '500' };

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
  retry: {
    marginTop: theme.spacing['sp-2'],
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
});
