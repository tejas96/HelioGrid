import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextVariant } from '../../primitives/Text/Text.types';
import type { NamedGapScale, NamedGapSpec } from './NamedGap.types';

interface NativeNamedGapProps extends NamedGapSpec {
  style?: StyleProp<ViewStyle>;
}

/* The 6/7/9dp ring and gap values have no step on the 4dp spacing scale — they are the design
   system's own sub-step sizing for a mark that must not outweigh the sentence beside it. */
const RING: Record<NamedGapScale, number> = { headline: 9, field: theme.spacing['sp-2'], cell: 7 };
const GAP: Record<NamedGapScale, number> = { headline: 7, field: 6, cell: 6 };
const WORDS: Record<NamedGapScale, TextVariant> = {
  headline: 'body',
  field: 'body-sm',
  cell: 'body-sm',
};
const JUSTIFY: Record<NonNullable<NamedGapSpec['align']>, ViewStyle['justifyContent']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

/**
 * **An absent value, rendered honestly, at the scale of the value it replaces.** `M02-03`: the
 * missing fields are shown as NAMED GAPS — "no city yet" — and NOTHING IS INVENTED TO FILL A GAP.
 *
 * THE WORDS ARE READ, so they take `text-secondary` and never `text-disabled`. The hollow ring is
 * the second, non-colour channel — the web half draws it as an inset shadow, which on native is
 * the same circle drawn as a 1.5dp border.
 */
export function NamedGap({
  gap,
  scale = 'field',
  align = 'left',
  onFill,
  fillLabel = 'Add',
  fieldName,
  style,
}: NativeNamedGapProps) {
  if (!gap) return null;
  const ring = RING[scale];
  return (
    <View
      style={[styles.row, { gap: GAP[scale], justifyContent: JUSTIFY[align] }, style]}
      accessible={false}
    >
      <View
        style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2 }]}
        importantForAccessibility="no"
      />
      <Text variant={WORDS[scale]} color="secondary" style={styles.words}>
        {gap}
      </Text>
      {onFill ? (
        <Pressable
          onPress={onFill}
          accessibilityLabel={fieldName ? `${fillLabel}: ${fieldName}` : undefined}
          style={styles.fill}
        >
          <Text variant="body-sm" color="accent" style={styles.fillWords}>
            {fillLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function isGapSpec(value: object): value is NamedGapSpec {
  return 'gap' in value;
}

/** What every `gap` host prop runs through: a sentence, a spec, or a ready node. */
export function renderGap(
  spec?: ReactNode | NamedGapSpec,
  extra: Partial<NamedGapSpec> = {},
): ReactNode {
  if (!spec) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec === 'string') return <NamedGap gap={spec} {...extra} />;
  if (typeof spec !== 'object' || !isGapSpec(spec)) return null;
  if (!spec.gap) return null;
  return <NamedGap {...spec} {...extra} />;
}

NamedGap.render = renderGap;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  ring: {
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: theme.colors['mark-subtle'],
  },
  words: {
    flexShrink: 1,
  },
  /* The negative margin pulls the 44dp target back flush with the sentence. */
  fill: {
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  fillWords: {
    fontWeight: '500',
  } as TextStyle,
});
