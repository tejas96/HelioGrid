/* ValueSource (native) — same words, same two levels, same single action. No pill and no tint here
   either: the treatment must not look like FieldOverride's, because the two say opposite things
   about whether anything happened to the value.

   The override action goes through the Pressable primitive, which owns the 44px target. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import {
  attributionFor,
  overrideActOf,
  resolveValueSourceLevel,
  VALUE_SOURCE_GLYPH,
  valueSourceStep,
} from './ValueSource.levels';
import type { ValueSourceLevel, ValueSourceSpec } from './ValueSource.types';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minWidth: 0,
  },
  layer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
  },
  from: {
    flexShrink: 1,
    minWidth: 0,
  },
  action: {
    marginStart: 'auto',
    marginEnd: -theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-2'],
  },
  word: { fontWeight: '500' },
  actionWord: { fontWeight: '500', color: theme.colors.accent },
});

const SIZE: Record<12 | 13, TextStyle> = {
  12: { fontSize: theme.type.roles.caption.fontSize },
  13: { fontSize: theme.type.roles['body-sm'].fontSize },
};

interface NativeValueSourceProps extends ValueSourceSpec {
  style?: StyleProp<ViewStyle>;
}

function Glyph({ name, color }: { name: 'own' | 'inherited'; color: string }) {
  return (
    <Icon size="xs" color={color}>
      <Svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={VALUE_SOURCE_GLYPH[name]} />
      </Svg>
    </Icon>
  );
}

export function ValueSource({
  level = 'own',
  layerName,
  source,
  fieldName,
  onOverride,
  overrideLabel,
  size = 12,
  style,
}: NativeValueSourceProps) {
  const entry = resolveValueSourceLevel(level);
  if (!entry) {
    return null;
  }
  const act = overrideActOf({ level, onOverride, overrideLabel, fieldName });
  const step = valueSourceStep(size);
  const glyphColor = theme.colors['text-secondary'];
  return (
    <View style={[styles.row, style]}>
      <View style={styles.layer}>
        <Glyph name={entry.glyph} color={glyphColor} />
        <Text variant="caption" color="secondary" style={[SIZE[step], styles.word]}>
          {layerName}
        </Text>
      </View>
      {source ? (
        <View style={styles.from}>
          {/* One line on the phone too: the layer word is the fact, the source is its detail. */}
          <Text variant="caption" color="secondary" style={SIZE[step]}>
            {source}
          </Text>
        </View>
      ) : null}
      {act === null ? null : (
        <Pressable
          onPress={act.onOverride}
          accessibilityLabel={act.spokenName ?? act.label}
          style={styles.action}
        >
          <Text variant="body-sm" style={styles.actionWord}>
            {act.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Accepts an `attribution` host prop — a spec object, a bare level string, or a ready node. A bare
 * level names no layer, and a layer's word is the caller's, so it draws nothing: the words come in
 * a spec.
 */
export function renderAttribution(
  spec?: ValueSourceSpec | ValueSourceLevel | ReactNode,
  extra: Partial<ValueSourceSpec> = {},
): ReactNode {
  return attributionFor(spec, (plain) => <ValueSource {...plain} {...extra} />);
}

ValueSource.render = renderAttribution;
