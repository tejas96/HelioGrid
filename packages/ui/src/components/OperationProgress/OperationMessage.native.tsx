import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { OperationState } from './OperationProgress.types';
import { messageGlyph } from './operation-progress-model';

const STATE_INK: Record<OperationState, ThemeColor> = {
  running: colors['text-secondary'],
  done: TONE.success.ink,
  failed: TONE.warning.ink,
  cancelled: colors['text-secondary'],
};

function MessageGlyph({ state }: { state: OperationState }) {
  const stroke = STATE_INK[state];
  return <ShellGlyph name={messageGlyph(state)} size="dense" ink={stroke} />;
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
          <Text variant="body-sm" style={{ color: STATE_INK[state] }}>
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
