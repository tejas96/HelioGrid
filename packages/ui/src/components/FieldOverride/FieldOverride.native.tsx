import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { FieldOverrideSpec } from './FieldOverride.types';

/** The marker is a WORD, never a colour or a dot alone. Both words are the DS's own. */
const MARK_WORD: Record<'overridden' | 'stale', string> = {
  overridden: 'Edited',
  stale: 'Design moved on',
};

const MARK_TONE: Record<'overridden' | 'stale', { color: string; background: string }> = {
  overridden: { color: theme.colors['neutral-text'], background: theme.colors['neutral-bg'] },
  /* `stale` tints warning — "the design has moved on since you edited this". */
  stale: { color: theme.colors['warning-text'], background: theme.colors['warning-bg'] },
};

/* Values off the 4px scale (6, 10) are the design system's own; no theme token carries them. */
const GAP = 10;
const DOT = 6;
const INSET = 10;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: GAP },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    height: theme.spacing['sp-5'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  dot: { width: DOT, height: DOT, borderRadius: theme.radius['r-pill'], flexShrink: 0 },
  values: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: DOT, marginLeft: 'auto' },
  button: { paddingHorizontal: INSET, marginHorizontal: -INSET },
});

const medium: TextStyle = { fontWeight: '500' };
const figure: TextStyle = { fontWeight: '700', color: theme.colors['text-primary'] };
const linkWords: TextStyle = { fontWeight: '500', color: theme.colors.accent };
const strongWords: TextStyle = { fontWeight: '700', color: theme.colors['text-primary'] };

interface NativeFieldOverrideProps extends FieldOverrideSpec {
  style?: StyleProp<ViewStyle>;
}

/** 12 is the type floor; 13 is the only step above it this line takes. */
const wordSize = (size: number) => (size >= 13 ? 'body-sm' : 'caption');

/**
 * **The one override treatment.** Marker → superseded value → reset, in one line under the value
 * it qualifies. The reset **names what it restores** in both its visible words and its accessible
 * name, which contains them (WCAG 2.5.3); under `stale` "Keep mine" announces the user's own
 * figure — what it keeps — and the design's figure belongs to the button beside it.
 */
export function FieldOverride({
  state = 'overridden',
  autoValue,
  autoSource,
  newValue,
  fieldName,
  onReset,
  onTake,
  autoLabel = 'was',
  size = 12,
  style,
}: NativeFieldOverrideProps) {
  if (state === 'none') return null;
  const stale = state === 'stale';
  const key: 'overridden' | 'stale' = stale ? 'stale' : 'overridden';
  const tone = MARK_TONE[key];
  const variant = wordSize(size);

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.mark, { backgroundColor: tone.background }]}>
        <View style={[styles.dot, { backgroundColor: tone.color }]} />
        <Text variant={variant} style={[medium, { color: tone.color }]}>
          {MARK_WORD[key]}
        </Text>
      </View>

      <View style={styles.values}>
        <Superseded
          stale={stale}
          variant={variant}
          autoValue={autoValue}
          autoSource={autoSource}
          newValue={newValue}
          autoLabel={autoLabel}
        />
      </View>

      <View style={styles.actions}>
        {stale && onTake !== undefined ? (
          <Pressable
            style={styles.button}
            onPress={onTake}
            accessibilityLabel={takeLabel(fieldName, newValue)}
          >
            <Text variant="body-sm" style={strongWords}>
              Take the new value
            </Text>
          </Pressable>
        ) : null}
        {onReset === undefined ? null : (
          <Pressable
            style={styles.button}
            onPress={onReset}
            accessibilityLabel={resetLabel(stale, fieldName, autoValue)}
          >
            <Text variant="body-sm" style={linkWords}>
              {stale ? 'Keep mine' : resetWords(autoValue)}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * **2 · the superseded value.** Under `stale` BOTH values are named — "yours 4.2 kWp · design now
 * 5.1 kWp" — because one of them is what the user is deciding against.
 */
function Superseded({
  stale,
  variant,
  autoValue,
  autoSource,
  newValue,
  autoLabel,
}: Pick<FieldOverrideSpec, 'autoValue' | 'autoSource' | 'newValue'> & {
  stale: boolean;
  variant: 'body-sm' | 'caption';
  autoLabel: string;
}) {
  const source =
    autoSource === undefined ? null : (
      <Text variant={variant} color="tertiary">
        {stale ? ` · from ${autoSource}` : ` · ${autoSource}`}
      </Text>
    );

  if (stale) {
    return (
      <Text variant={variant} color="secondary">
        {'yours '}
        <Text variant={variant} style={figure}>
          {autoValue}
        </Text>
        {newValue === undefined || newValue === null ? null : (
          <Text variant={variant} color="secondary">
            {' · design now '}
            <Text variant={variant} style={figure}>
              {newValue}
            </Text>
          </Text>
        )}
        {source}
      </Text>
    );
  }

  if (autoValue === undefined || autoValue === null) return null;
  return (
    <Text variant={variant} color="secondary">
      {`${autoLabel} `}
      <Text variant={variant} style={figure}>
        {autoValue}
      </Text>
      {source}
    </Text>
  );
}

function takeLabel(fieldName: string | undefined, newValue: ReactNode): string | undefined {
  return fieldName === undefined
    ? undefined
    : `Take the new value for ${fieldName}: ${String(newValue ?? '')}`;
}

function resetWords(autoValue: ReactNode): string {
  return autoValue === undefined || autoValue === null
    ? 'Reset to auto'
    : `Reset to ${String(autoValue)}`;
}

function resetLabel(
  stale: boolean,
  fieldName: string | undefined,
  autoValue: ReactNode,
): string | undefined {
  if (fieldName === undefined) return undefined;
  if (stale) return `Keep mine — ${fieldName} stays ${String(autoValue ?? '')}`;
  return autoValue === undefined || autoValue === null
    ? `Reset to auto — ${fieldName}`
    : `Reset to ${String(autoValue)} — ${fieldName}`;
}

/** Renders a spec object, a ready node, or nothing — what every host prop runs through. */
export function renderOverride(
  spec?: FieldOverrideSpec | ReactNode,
  extra?: Partial<NativeFieldOverrideProps>,
): ReactNode {
  if (spec === undefined || spec === null || spec === false) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec !== 'object') return null;
  return <FieldOverride {...(spec as FieldOverrideSpec)} {...extra} />;
}

FieldOverride.render = renderOverride;
