import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { RetryButton } from '../Button/RetryButton.native';

const styles = StyleSheet.create({
  skeleton: { padding: theme.spacing['sp-4'], gap: theme.spacing['sp-3'] },
  bar: {
    height: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  lead: { width: '60%', height: theme.spacing['sp-4'] },
  message: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: 48,
    paddingHorizontal: theme.spacing['sp-6'],
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['sp-1'],
    backgroundColor: theme.colors['neutral-bg'],
  },
  markWarning: { backgroundColor: theme.colors['warning-bg'] },
  body: { maxWidth: 340 },
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
  const stroke = tone === 'warning' ? theme.colors['warning-text'] : theme.colors['text-tertiary'];
  return (
    <View style={styles.message}>
      <View style={[styles.mark, tone === 'warning' ? styles.markWarning : null]}>
        <Svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
        >
          <ShellGlyphMarks name={tone === 'warning' ? 'alert-circle' : 'columns'} />
        </Svg>
      </View>
      <Text variant="h4" align="center">
        {title}
      </Text>
      {message === undefined ? null : (
        <Text variant="body-sm" color="secondary" align="center" style={styles.body}>
          {message}
        </Text>
      )}
      <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
    </View>
  );
}
