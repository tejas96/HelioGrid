/* ValueSource (native) — same words, same two levels, same single action. No pill and no tint here
   either: the treatment must not look like FieldOverride's, because the two say opposite things
   about whether anything happened to the value.

   The override action goes through the Pressable primitive, which owns the 44px target. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { resolveValueSourceLevel, valueSourceStep } from './ValueSource.levels';
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
      <Svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <Path d="M12 3 3 8l9 5 9-5-9-5Z" strokeLinecap="round" strokeLinejoin="round" />
        {name === 'inherited' ? (
          <Path d="m3 14 9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
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
  overrideLabel = 'Override for this tenant',
  size = 12,
  style,
}: NativeValueSourceProps) {
  const entry = resolveValueSourceLevel(level);
  if (!entry) {
    return null;
  }
  const word = layerName || entry.word;
  const inherited = level === 'inherited';
  const step = valueSourceStep(size);
  const tone = inherited ? 'tertiary' : 'secondary';
  const glyphColor = inherited ? theme.colors['text-tertiary'] : theme.colors['text-secondary'];
  return (
    <View style={[styles.row, style]}>
      <View style={styles.layer}>
        <Glyph name={entry.glyph} color={glyphColor} />
        <Text variant="caption" color={tone} style={[SIZE[step], styles.word]}>
          {word}
        </Text>
      </View>
      {source ? (
        <View style={styles.from}>
          {/* One line on the phone too: the layer word is the fact, the source is its detail. */}
          <Text variant="caption" color={tone} style={SIZE[step]}>
            {source}
          </Text>
        </View>
      ) : null}
      {inherited && onOverride ? (
        <Pressable
          onPress={onOverride}
          accessibilityLabel={fieldName ? `${overrideLabel}: ${fieldName}` : overrideLabel}
          style={styles.action}
        >
          <Text variant="body-sm" style={styles.actionWord}>
            {overrideLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Accepts an `attribution` host prop — a spec object, a bare level string, or a ready node. */
export function renderAttribution(
  spec?: ValueSourceSpec | ValueSourceLevel | ReactNode,
  extra: Partial<ValueSourceSpec> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return <ValueSource level={spec as ValueSourceLevel} {...extra} />;
  }
  if (typeof spec !== 'object') {
    return null;
  }
  return <ValueSource {...(spec as ValueSourceSpec)} {...extra} />;
}

ValueSource.render = renderAttribution;
