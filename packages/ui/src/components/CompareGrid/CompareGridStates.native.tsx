import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { RetryButton } from '../Button/RetryButton.native';
import { StateRegion } from '../StateBody/StateRegion.native';

const styles = StyleSheet.create({
  skeleton: { padding: theme.spacing['sp-4'], gap: theme.spacing['sp-3'] },
  bar: {
    height: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-md'],
    backgroundColor: colors['canvas-sunken'],
  },
  lead: { width: '60%', height: theme.spacing['sp-4'] },
});

/**
 * The loading form. Never a placeholder value presented as a real one, the role included: web says
 * `role="status"`, and six featureless bars have no position for `progressbar` to report. RN's
 * counterpart is an accessibility element — the bars are decoration, so `accessible` folds nothing
 * a reader could otherwise reach — announced politely.
 */
export function CompareSkeleton({ label }: { label: TranslatedText }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={styles.skeleton}
    >
      {['title', 'a', 'b', 'c', 'd', 'e'].map((row) => (
        <View key={row} style={[styles.bar, row === 'title' ? styles.lead : null]} />
      ))}
    </View>
  );
}

/**
 * The centred body of a blocked surface. `tone="warning"` is the **error** form and carries the
 * retry; the neutral form serves both `empty` ("none yet") and `unavailable` ("this was never
 * going to be here"), and `unavailable` never gets a retry.
 */
export function CompareMessage({
  tone,
  title,
  message,
  onRetry,
  retryLabel,
  focusAfter,
}: {
  tone?: 'warning';
  title: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** Where focus lands once *Try again* has gone with this message. */
  focusAfter: FocusAfter;
}) {
  return (
    <StateRegion
      tone={tone}
      glyph="columns"
      title={title}
      message={message}
      action={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />}
    />
  );
}
