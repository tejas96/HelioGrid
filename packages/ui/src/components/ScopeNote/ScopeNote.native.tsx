import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { ScopeNoteProps, ScopeNoteSpec } from './ScopeNote.types';
import { composeScopeLine, scopeNoteSize } from './scope-note-line';

interface NativeScopeNoteProps extends ScopeNoteProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A person: whose act this is. Not a lock — the screen is not locked, and the reader is not shut
 * out of anything they can see.
 */
function Glyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.6} stroke={theme.colors['text-tertiary']} strokeWidth={1.5} />
      <Path
        d="M5 20a7 7 0 0 1 14 0"
        stroke={theme.colors['text-tertiary']}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * THE PERMISSION ANSWER TO "WHY IS THIS OFF" — the act is not off, THE ACT IS GONE, and this names
 * whose it is. It renders in the action row, the exact place the absent acts would have been.
 *
 * `role="note"` has no RN equivalent; `accessibilityRole="text"` is the closest honest mapping and
 * the words themselves carry the whole meaning, as on web.
 */
export function ScopeNote({
  holder,
  acts,
  title,
  message,
  action,
  variant = 'line',
  align = 'left',
  size = 13,
  style,
}: NativeScopeNoteProps) {
  const line = composeScopeLine({ holder, acts, title });
  if (line === null && message === undefined) {
    return null;
  }
  const panel = variant === 'panel';
  const centred = align === 'center';
  const fontSize = scopeNoteSize(size);
  return (
    <View
      accessibilityRole="text"
      style={[
        styles.note,
        panel ? styles.panel : styles.line,
        centred ? styles.centred : styles.start,
        style,
      ]}
    >
      <View style={styles.mark}>
        <Glyph size={panel ? 18 : 16} />
      </View>
      <View style={[styles.lines, centred ? styles.centredItems : styles.startItems]}>
        {line !== null ? (
          <Text align={centred ? 'center' : 'start'} style={[headline, { fontSize }]}>
            {line}
          </Text>
        ) : null}
        {message !== undefined ? (
          <Text color="secondary" align={centred ? 'center' : 'start'} style={[body, { fontSize }]}>
            {message}
          </Text>
        ) : null}
        {action}
      </View>
    </View>
  );
}

/** A plain spec object, as opposed to any of the object shapes ReactNode itself allows. */
function isScopeNoteSpec(value: ScopeNoteSpec | ReactNode): value is ScopeNoteSpec {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isValidElement(value) &&
    !(Symbol.iterator in value) &&
    !('then' in value)
  );
}

/** Accepts a `scope` host prop — a spec object or a ready node. */
export function renderScopeNote(
  spec?: ScopeNoteSpec | ReactNode,
  extra: Partial<ScopeNoteSpec> = {},
): ReactNode {
  if (spec === undefined || spec === null || spec === false || spec === '') {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (!isScopeNoteSpec(spec)) {
    return null;
  }
  return <ScopeNote {...spec} {...extra} />;
}

/* -0.01em of the caller's size is close enough to -0.13 at both 12 and 13; line heights are the
   1.45 / 1.5 multiples the DS states, expressed in points against the caller's size. */
const headline: TextStyle = { fontWeight: '700', letterSpacing: -0.13, lineHeight: 19 };
const body: TextStyle = { fontWeight: '400', lineHeight: 20 };

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  line: { paddingVertical: theme.spacing['sp-0-5'] },
  /* 14 sits between --sp-3 and --sp-4 and has no token of its own. */
  panel: {
    padding: 14,
    borderRadius: theme.radius['r-sm'],
    backgroundColor: theme.colors['neutral-bg'],
  },
  start: { justifyContent: 'flex-start' },
  centred: { justifyContent: 'center' },
  mark: { flexShrink: 0, marginTop: 1 },
  lines: { flexDirection: 'column', gap: 6, minWidth: 0, flexShrink: 1 },
  startItems: { alignItems: 'flex-start' },
  centredItems: { alignItems: 'center' },
});
