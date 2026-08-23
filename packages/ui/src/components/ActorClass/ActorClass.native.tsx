import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type {
  ActorClassName,
  ActorClassProps,
  ActorClassSpec,
  ActorGlyphName,
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

function glyphBody(glyph: Exclude<ActorGlyphName, 'agent'>, color: string): ReactNode {
  if (glyph === 'user') {
    return (
      <>
        <Circle cx="12" cy="8" r="3.2" stroke={color} />
        <Path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke={color} />
      </>
    );
  }
  if (glyph === 'customer') {
    return (
      <Path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.4-4.7A7.5 7.5 0 1 1 20 12z" stroke={color} />
    );
  }
  return (
    <>
      <Circle cx="12" cy="12" r="3" stroke={color} />
      <Path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5 8 8M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5"
        stroke={color}
      />
    </>
  );
}

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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyphBody(descriptor.glyph === 'agent' ? 'cog' : descriptor.glyph, ink)}
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
  verb = 'Created by',
  rule,
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
        {actorWords({ actorClass, actor, form, verb, rule })}
      </Text>
    </View>
  );
}

/** Accepts a spec object, a bare class string, or a ready node — so every host offers one prop. */
export function renderActorClass(spec?: ActorClassSpec, extra?: ActorClassProps): ReactNode {
  if (spec === undefined) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec === 'string') return <ActorClass actorClass={spec} {...extra} />;
  return <ActorClass {...spec} {...extra} />;
}

ActorClass.options = actorClassOptions;
ActorClass.classes = ACTOR_CLASSES;
ActorClass.Glyph = ActorGlyph;
