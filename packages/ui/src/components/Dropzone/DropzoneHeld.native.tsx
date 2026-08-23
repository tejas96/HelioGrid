import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { type HeldRetry, heldFailureWords, heldSentence, useHeldFlush } from './dropzone-held';

const styles = StyleSheet.create({
  /* The 10dp offset and gap are the DS source's own values; the 4dp spacing scale has no step at
     10, the same reason ActionReason keeps its 6dp gap raw. */
  block: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  words: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200,
    minWidth: 0,
    gap: theme.spacing['sp-0-5'],
  },
  count: { fontWeight: '700' },
  failure: { fontWeight: '500' },
  /* 44dp, the pill, and the label that survives the wait. */
  retry: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: theme.spacing['sp-2'],
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
});

interface NativeDropzoneHeldProps {
  /** An upload already in flight takes the retry out of reach — there is nothing to flush yet. */
  busy: boolean;
  countWords: string | null;
  failedMessage: string;
  heldMessage?: ReactNode;
  onRetry?: HeldRetry;
  retryLabel: string;
  retryTimeout: number;
  timeoutMessage: string;
}

/**
 * THE WAITING COUNT AND THE RETRY, ON THE CAPTURE SCREEN ITSELF (`M11-37` P0 / `SCR-M11-03`,
 * `F4-21`) — the surface this law was written for is this one, a surveyor on a roof with no signal.
 *
 * The count is its OWN element above the sentence, so `heldMessage` replaces the wording and never
 * the number. Web's `role="status"` is `accessibilityLiveRegion` here; the 44dp floor on the retry
 * belongs to the Pressable primitive.
 */
export function DropzoneHeld({
  busy,
  countWords,
  failedMessage,
  heldMessage,
  onRetry,
  retryLabel,
  retryTimeout,
  timeoutMessage,
}: NativeDropzoneHeldProps) {
  const { failure, flushing, run } = useHeldFlush(onRetry, retryTimeout);
  const failureWords = heldFailureWords(failure, { failedMessage, timeoutMessage });
  const waiting = flushing || busy;

  return (
    <View accessibilityLiveRegion="polite" style={styles.block}>
      <View style={styles.words}>
        {countWords === null ? null : (
          <Text variant="body-sm" color="warning" style={styles.count}>
            {countWords}
          </Text>
        )}
        <Text variant="body-sm" color="warning">
          {heldSentence(heldMessage)}
        </Text>
        {/* What actually happened last time — NoConnection's rule, and the reason `onRetry` may
            report a failure at all. */}
        {failureWords === null ? null : (
          <Text variant="body-sm" color="danger" style={styles.failure}>
            {failureWords}
          </Text>
        )}
      </View>
      {onRetry === undefined ? null : (
        /* NO `accessibilityLabel` HERE, deliberately. The label is the Text below, so RN composes
           the name from it exactly as the web `<button>` composes its own from `retryLabel` — one
           wording, one place. Stating it again would freeze the name and, on a target that later
           grows a second line, silently drop it. */
        <Pressable disabled={waiting} onPress={run} style={styles.retry}>
          {/* The label stays. A spinner beside it, never instead of it. */}
          {flushing ? <ActivityIndicator color={theme.colors.accent} size="small" /> : null}
          <Text variant="body-sm" color={waiting ? 'disabled' : 'primary'}>
            {retryLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
