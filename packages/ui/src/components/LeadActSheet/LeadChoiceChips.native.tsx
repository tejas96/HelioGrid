import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';

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
 * is on, never the ink alone (`F7-12`).
 */
export function LeadChoiceChips<V extends string>({
  label,
  choices,
  chosen,
  word,
  onChoose,
  disabled,
}: LeadChoiceChipsProps<V>) {
  const { controlFill } = useGround();
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
              onPress={() => onChoose(choice)}
              style={[styles.chip, { backgroundColor: controlFill }, on ? styles.on : undefined]}
            >
              <Text variant="body-sm" color={on ? 'inverse' : 'primary'}>
                {word(choice)}
              </Text>
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
  chip: {
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
  },
  on: { backgroundColor: colors.ink },
});
