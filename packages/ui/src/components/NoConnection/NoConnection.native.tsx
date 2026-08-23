import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { AccessibilityInfo, findNodeHandle, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import type { NoConnectionProps } from './NoConnection.types';
import { SunCloudMark } from './SunCloudMark.native';
import { failureSentence, useRetryLifecycle } from './use-retry';

interface NativeNoConnectionProps extends NoConnectionProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The one shared full-screen state for "the device has no connection".
 *
 * · IT NEVER MENTIONS SYNC (owner ruling Q61).
 * · RETRY CANNOT LIE — the lifecycle is the shared use-retry.ts, so both platforms report the same
 *   outcomes at the same moments.
 * · IT DOES NOT BLOCK WHAT STILL WORKS — `children` is the slot for whatever the app CAN show.
 *
 * `autoFocusRetry` has no DOM focus to take on RN, so it moves ACCESSIBILITY focus to the retry
 * instead: the same promise for the reader this screen is written for.
 */
export function NoConnection({
  title = "You're not connected",
  message = 'HelioGrid needs a connection to load this. Check your mobile data or Wi-Fi, then try again.',
  onRetry,
  retryLabel = 'Try again',
  failedMessage = 'Still no connection.',
  timeoutMessage = "That's taking too long to answer.",
  retryTimeout = 10000,
  status,
  children,
  animate = true,
  autoFocusRetry = true,
  inset = false,
  style,
}: NativeNoConnectionProps) {
  const retryRef = useRef<View>(null);
  const { trying, failure, handleRetry } = useRetryLifecycle(onRetry, retryTimeout, status);

  useEffect(() => {
    if (!autoFocusRetry) {
      return;
    }
    const tag = findNodeHandle(retryRef.current);
    if (tag !== null) {
      AccessibilityInfo.setAccessibilityFocus(tag);
    }
  }, [autoFocusRetry]);

  const sentence = failureSentence(failure, failedMessage, timeoutMessage);

  return (
    /* THE TITLE IS ALREADY SPOKEN, SO IT IS NOT SAID TWICE. The web half names the screen with
       `aria-labelledby` pointing AT the `<h1>` — the name and the heading are one string by
       construction — and that heading Text is rendered here two lines down. On a bare View the
       copy of it announced nothing; announced it would say the title twice, and `accessible`
       would fold the retry button and whatever `children` the app can still show into one
       element. What tells a reader this screen arrived is `autoFocusRetry` moving accessibility
       focus to the retry, and the outcome line's polite live region — both already here. */
    <View style={[styles.screen, inset ? styles.inset : styles.flow, style]}>
      <SunCloudMark animate={animate} />
      <Text variant="h2" align="center" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color="secondary" align="center" style={styles.message}>
        {message}
      </Text>

      <View ref={retryRef} style={styles.retry}>
        <Button size="lg" loading={trying} onClick={handleRetry}>
          {retryLabel}
        </Button>
      </View>

      {/* The one place the screen is allowed to be specific: what actually happened last time.
          The line keeps its height either way, so the screen never jumps when a retry returns. */}
      <View accessibilityLiveRegion="polite" style={styles.outcome}>
        {sentence === null ? null : (
          <Text variant="body-sm" align="center" style={outcomeText}>
            {sentence}
          </Text>
        )}
      </View>

      {children !== undefined ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const outcomeText: TextStyle = {
  fontWeight: '500',
  color: theme.colors['danger-text'],
};

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-8'],
    paddingHorizontal: theme.spacing['sp-6'],
    backgroundColor: theme.colors.canvas,
  },
  flow: { position: 'relative', flex: 1 },
  inset: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  title: { marginTop: theme.spacing['sp-4'] },
  message: { maxWidth: 380 },
  retry: { marginTop: theme.spacing['sp-5'] },
  outcome: { marginTop: theme.spacing['sp-3'], minHeight: 18, justifyContent: 'center' },
  children: {
    marginTop: theme.spacing['sp-3'],
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
});
