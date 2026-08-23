import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { OptionCard } from './OptionCard.native';
import type { OptionCardGroupProps } from './OptionCardGroup.types';

interface NativeOptionCardGroupProps extends OptionCardGroupProps {
  /** Lands on the wrapper around the radiogroup. */
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  group: { gap: theme.spacing['sp-2'] },
  /* 6px of padding taken straight back as -6px of margin, so an errored group occupies the
     same box as a valid one and nothing on the step shifts when the gate speaks. */
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 6,
    margin: -6,
    borderRadius: theme.radius['r-lg'],
  },
  listError: { borderWidth: 1.5, borderColor: theme.colors.danger },
  error: { lineHeight: 17.4 },
});

/**
 * Card-shaped radiogroup on touch. Selection is a 2px accent ring plus a filled dot — never
 * colour alone.
 *
 * The web half is one tab stop with an arrow-key walk; touch has no arrow keys, so every card
 * is its own target and the walk is the screen reader's own swipe order. `columns` becomes a
 * flex-basis on a wrapping row, since RN has no CSS grid.
 */
export function OptionCardGroup({
  options,
  value,
  onChange,
  label,
  columns = 1,
  density = 'expressive',
  disabled = false,
  currentLabel = 'Current plan',
  error,
  style,
}: NativeOptionCardGroupProps) {
  const basis = `${100 / Math.max(1, columns)}%` as const;
  return (
    <View style={[styles.group, style]}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary">
          {label}
        </Text>
      ) : null}
      {/* A LIST OF CARDS IS NOT A CHOICE UNTIL IT SAYS SO. The web half is `role="radiogroup"`
          named by the visible line above it; `accessibilityLabel` is the RN reading of that
          `aria-labelledby`, and it names the container without making it a leaf — the role sits
          on a plain View, so each card stays separately reachable. */}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={[styles.list, error !== undefined ? styles.listError : null]}
      >
        {options.map((o) => (
          <View key={o.value} style={{ flexGrow: 1, flexShrink: 1, flexBasis: basis, minWidth: 0 }}>
            <OptionCard
              option={o}
              selected={o.value === value}
              off={disabled || o.disabled === true}
              density={density}
              onSelect={() => onChange?.(o.value)}
              currentLabel={currentLabel}
            />
          </View>
        ))}
      </View>
      {error !== undefined ? (
        <Text variant="caption" color="danger" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
