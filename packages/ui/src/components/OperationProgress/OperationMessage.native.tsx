import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import type { OperationState } from './OperationProgress.types';
import { messageGlyph } from './operation-progress-model';

const TONE: Record<OperationState, string> = {
  running: theme.colors['text-secondary'],
  done: theme.colors['success-text'],
  failed: theme.colors['warning-text'],
  cancelled: theme.colors['text-secondary'],
};

function MessageGlyph({ state }: { state: OperationState }) {
  const stroke = TONE[state];
  return (
    <Svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name={messageGlyph(state)} />
    </Svg>
  );
}

/**
 * The finishing sentence: the report line, the failure, or what a cancel left behind. A failure is
 * assertive (RN's `role="alert"`); everything else is polite.
 */
export function OperationMessage({
  state,
  message,
}: {
  state: OperationState;
  message: ReactNode;
}) {
  const words = typeof message === 'string' || typeof message === 'number';
  return (
    <View accessibilityLiveRegion={state === 'failed' ? 'assertive' : 'polite'} style={styles.line}>
      <View style={styles.mark}>
        <MessageGlyph state={state} />
      </View>
      <View style={styles.words}>
        {words ? (
          <Text variant="body-sm" style={{ color: TONE[state] }}>
            {message}
          </Text>
        ) : (
          message
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  mark: { flexShrink: 0, marginTop: theme.spacing['sp-0-5'] },
  words: { minWidth: 0, flexShrink: 1 },
});
