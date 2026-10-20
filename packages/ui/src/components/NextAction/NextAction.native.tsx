import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Text } from '../../primitives/Text/Text.native';
import type { TextColor } from '../../primitives/Text/Text.types';
import { renderActorClass } from '../ActorClass/ActorClass.native';
import { renderOverride } from '../FieldOverride/FieldOverride.native';
import type { NextActionProps, NextActionTone } from './NextAction.types';

interface NativeNextActionProps extends NextActionProps {
  style?: StyleProp<ViewStyle>;
}

/* EVERY WARNING MARK TAKES warning-text: `warning` itself clears no contrast floor anywhere. */
const DOT: Record<NextActionTone, string> = {
  due: theme.colors['success-text'],
  overdue: theme.colors['danger-text'],
  soon: theme.colors['warning-text'],
  scheduled: theme.colors.accent,
  snoozed: theme.colors['text-tertiary'],
  done: theme.colors['text-tertiary'],
};

/**
 * "What happens next" — a muted semantic dot plus plain text. `tone="overdue"` is the only case
 * that turns red, which is what keeps red meaningful; snoozed records go tertiary rather than
 * disappearing. Same words, same order and same two attribution slots as the web half.
 */
export function NextAction({
  label,
  meta,
  tone = 'due',
  muted = false,
  origin,
  correction,
  size = 13,
  style,
}: NativeNextActionProps) {
  const color: TextColor =
    tone === 'overdue' ? 'danger' : muted || tone === 'snoozed' ? 'tertiary' : 'primary';
  const stacked = Boolean(origin) || Boolean(correction);
  const words: TextStyle = { fontSize: size };
  return (
    <View style={[stacked ? styles.stacked : styles.inline, style]}>
      <View style={styles.line}>
        <View style={[styles.dot, { backgroundColor: DOT[tone] }]} importantForAccessibility="no" />
        <Text variant="body-sm" color={color} style={words}>
          {`${label}${meta ? ` · ${meta}` : ''}`}
        </Text>
      </View>
      {/* The origin sits under the task, indented to the WORDS rather than to the dot. */}
      {origin ? (
        <View style={styles.indent}>{renderActorClass(origin, { form: 'origin', size: 12 })}</View>
      ) : null}
      {correction ? <View style={styles.indent}>{renderOverride(correction)}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  stacked: { flexDirection: 'column', alignItems: 'flex-start', gap: theme.spacing['sp-1'] },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minWidth: 0,
  },
  dot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  indent: { paddingLeft: 14 },
});
