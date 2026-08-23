import { theme } from '@heliogrid/theme';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import type { CompareOption } from './CompareGrid.types';
import { cellGround, compareStyles } from './CompareGridStyles.native';

interface OptionHeadProps<Opt extends CompareOption> {
  option: Opt;
  selected: boolean;
  selectedLabel: string;
  currentLabel: string;
  box: StyleProp<ViewStyle>;
}

/**
 * **The column heading for one option** — its name, its subtitle, the words that describe its
 * standing, and its marks.
 *
 * `current` is not `selected`: you choose the one you are moving TO, so the option in force wears
 * its own word in its own pill and the two facts can be true at once.
 */
export function CompareOptionHead<Opt extends CompareOption>({
  option,
  selected,
  selectedLabel,
  currentLabel,
  box,
}: OptionHeadProps<Opt>) {
  return (
    <View style={[box, cellGround(selected, false)]}>
      <View style={compareStyles.optionStack}>
        <Text variant="body" style={{ fontWeight: '700', letterSpacing: -0.15 }}>
          {option.name}
        </Text>
        {option.subtitle === undefined ? null : (
          <Text variant="caption" color="tertiary">
            {option.subtitle}
          </Text>
        )}
        <View style={compareStyles.pills}>
          {option.current === true ? (
            <View style={[compareStyles.pill, { backgroundColor: theme.colors['neutral-bg'] }]}>
              <Text variant="caption" style={{ color: theme.colors['neutral-text'] }}>
                {currentLabel}
              </Text>
            </View>
          ) : null}
          {selected ? (
            <View style={[compareStyles.pill, compareStyles.plain]}>
              <Text variant="caption" color="accent">
                {selectedLabel}
              </Text>
            </View>
          ) : null}
        </View>
        {option.marks === undefined ? null : renderMarks(option.marks)}
      </View>
    </View>
  );
}
