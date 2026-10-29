import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { ACTOR_GLYPH } from './ActorClass.logic';
import type {
  ActorClassName,
  ActorClassProps,
  ActorClassSpec,
  ActorTone,
} from './ActorClass.types';
import { ACTOR_CLASSES, actorClassOptions, actorWords } from './ActorClass.types';

interface NativeActorClassProps extends ActorClassProps {
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<ActorTone, string> = {
  neutral: theme.colors['text-secondary'],
  accent: theme.colors.accent,
  info: theme.colors.info,
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  mark: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  words: { flexShrink: 1, fontFamily: theme.type.families.sans, fontWeight: '400' },
  /* RN cannot paint --gradient-brand without a gradient dependency; the agent object takes the
     gradient's leading stop (--iris-violet) so it still reads as the brand object, not an icon. */
  agent: { backgroundColor: theme.colors['iris-violet'] },
});

/** The class's glyph. The agent's is a brand object, not an outlined icon (ICONOGRAPHY). */
export function ActorGlyph({
  actorClass = 'system',
  size = 13,
  color,
}: {
  actorClass?: ActorClassName;
  size?: number;
  color?: string;
}) {
  const descriptor = ACTOR_CLASSES[actorClass];
  const ink = color ?? TONES[descriptor.tone];
  if (actorClass === 'agent') {
    const object: ViewStyle = {
      width: size - 2,
      height: size - 2,
      borderRadius: (size - 2) / 2,
    };
    return <View style={[styles.agent, object]} />;
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ink}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name={ACTOR_GLYPH[descriptor.glyph]} />
    </Svg>
  );
}

/**
 * Who or what did this, in words, with a glyph as the second channel. `form="origin"` plus `verb`
 * is how a human reopen stays distinguishable from an automatic resurface (SCR-M07-04).
 */
export function ActorClass({
  actorClass = 'system',
  actor,
  form = 'stream',
  verb,
  rule,
  words,
  size = 12,
  color = theme.colors['text-secondary'],
  style,
}: NativeActorClassProps) {
  const descriptor = ACTOR_CLASSES[actorClass];
  const type: TextStyle = { fontSize: size, lineHeight: size * 1.4, color };
  return (
    <View style={[styles.row, style]}>
      <View style={styles.mark}>
        <ActorGlyph actorClass={actorClass} size={size + 1} color={TONES[descriptor.tone]} />
      </View>
      <Text style={[styles.words, type]}>
        {actorWords({ actorClass, actor, form, verb, rule, words })}
      </Text>
    </View>
  );
}

/** Accepts a spec object or a ready node — so every host offers one prop. */
export function renderActorClass(
  spec?: ActorClassSpec,
  extra?: Partial<ActorClassProps>,
): ReactNode {
  if (spec === undefined) return null;
  if (isValidElement(spec)) return spec;
  return <ActorClass {...spec} {...extra} />;
}

ActorClass.options = actorClassOptions;
ActorClass.classes = ACTOR_CLASSES;
ActorClass.Glyph = ActorGlyph;
