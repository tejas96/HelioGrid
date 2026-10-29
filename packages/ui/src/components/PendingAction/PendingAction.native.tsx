import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { focusAfterFirst, NO_FOCUS_AFTER, useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { Button } from '../Button/Button.native';
import { RetryButton } from '../Button/RetryButton.native';
import { IndeterminateRail } from './IndeterminateRail.native';
import { pendingLine, readPendingInput } from './PendingAction.logic';
import type { PendingActionProps, PendingActionSpec } from './PendingAction.types';

type NativePendingActionProps = PendingActionProps & {
  style?: StyleProp<ViewStyle>;
};

/**
 * An arrow curving back to where it came from: the act was returned. Not error's exclamation
 * (nothing is broken) and not UnavailableNote's slashed circle (this was going to be here).
 */
function ReturnGlyph({ size }: { size: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.colors['warning-text']}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name="undo-step" />
    </Svg>
  );
}

/** A ReactNode that is a bare string or number takes the line's own type treatment. */
function renderWords(words: ReactNode, style: TextStyle) {
  if (typeof words === 'string' || typeof words === 'number') {
    return <Text style={style}>{words}</Text>;
  }
  return words;
}

/**
 * THE ROW'S THIRD ANSWER — "this is being done". It adds one line and changes NOTHING else about
 * the row: no opacity, no row tint, no disabling, no `aria-invalid`. A second act can start while
 * the first is in flight; hosts mark the row busy and leave it operable.
 */
export function PendingAction(props: NativePendingActionProps) {
  const {
    slowNote,
    onRetry,
    retryLabel,
    onDismiss,
    dismissLabel,
    focusAfter,
    align = 'left',
    style,
  } = props;
  const frame = useRef<View>(null);
  const leaving = useFocusAfter(focusAfter ?? NO_FOCUS_AFTER);
  const shown = pendingLine(props);
  if (shown === null) {
    return null;
  }
  const { returned, words, fontSize } = shown;
  const line: TextStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * 1.45),
    color: returned ? theme.colors['warning-text'] : theme.colors['text-secondary'],
  };
  return (
    <View
      ref={frame}
      accessibilityLiveRegion="polite"
      style={[styles.row, align === 'right' ? styles.right : styles.left, style]}
    >
      {returned ? (
        <View style={styles.glyph}>
          <ReturnGlyph size={shown.glyphSize} />
        </View>
      ) : (
        <IndeterminateRail style={{ marginTop: shown.railOffset }} />
      )}
      <View style={styles.words}>
        {renderWords(words, line)}
        {/* M02-24's budget, said in words rather than by the rail getting slower. */}
        {shown.showsSlowNote
          ? renderWords(slowNote, { ...line, color: theme.colors['text-tertiary'] })
          : null}
      </View>
      {shown.offersActs ? (
        <View style={styles.actions}>
          <RetryButton
            onRetry={onRetry}
            label={retryLabel}
            focusAfter={focusAfterFirst(frame, focusAfter ?? NO_FOCUS_AFTER)}
          />
          {onDismiss !== undefined ? (
            <Button variant="ghost" size="md" onClick={leaving(onDismiss)}>
              {dismissLabel}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** What every host's `pending` prop runs through: a string, a spec, or a ready node. */
export function renderPending(
  spec: PendingActionSpec | ReactNode,
  extra: Pick<PendingActionProps, 'size' | 'align'> = {},
): ReactNode {
  const input = readPendingInput(spec);
  if (input === null) {
    return null;
  }
  return 'node' in input ? input.node : <PendingAction {...input.spec} {...extra} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
  },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  glyph: { flexShrink: 0, marginTop: theme.spacing['sp-0-5'] },
  words: { minWidth: 0, flexShrink: 1, flexGrow: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
