import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { Chip } from '../Chip/Chip.native';

interface LeadChoiceChipsProps<V extends string> {
  readonly label: TranslatedText;
  readonly choices: readonly V[];
  readonly chosen: V | null;
  readonly word: (choice: V) => TranslatedText;
  readonly onChoose: (choice: V) => void;
  readonly disabled: boolean;
}

/**
 * One answer of a few, as chips: a radio group a screen reader hears with its name and which chip
 * is on (`F7-12`). The chosen chip is the shared `Chip`'s accent wash, as on the web — never a pill
 * of its own.
 */
export function LeadChoiceChips<V extends string>({
  label,
  choices,
  chosen,
  word,
  onChoose,
  disabled,
}: LeadChoiceChipsProps<V>) {
  return (
    <View style={styles.group}>
      <Text variant="field-label">{label}</Text>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {choices.map((choice) => {
          const on = chosen === choice;
          return (
            <Pressable
              key={choice}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              disabled={disabled}
              haptic="selection"
              onPress={() => onChoose(choice)}
              style={styles.target}
            >
              <Chip active={on}>{word(choice)}</Chip>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.spacing['sp-2'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  /* The pill's shape on the target too: Android draws no square ripple under a round pill. */
  target: { justifyContent: 'center', borderRadius: theme.radius['r-pill'] },
});
