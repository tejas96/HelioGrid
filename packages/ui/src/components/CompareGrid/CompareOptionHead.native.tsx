import { theme } from '@heliogrid/theme';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { GroundProvider, useGround } from '../../primitives/Ground/Ground.native';
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
  const { ground } = useGround();
  return (
    <View style={[box, cellGround(selected, false, ground)]}>
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
            /* The selected column's tint holds its pill as a tile does — see `Ground.css`. */
            <GroundProvider ground="tile">
              <SelectedPill label={selectedLabel} />
            </GroundProvider>
          ) : null}
        </View>
        {option.marks === undefined ? null : renderMarks(option.marks)}
      </View>
    </View>
  );
}

/** A control part: the opposite of what holds it (`F7-15`), flat. */
function SelectedPill({ label }: { label: string }) {
  const { controlFill } = useGround();
  return (
    <View style={[compareStyles.pill, { backgroundColor: controlFill }]}>
      <Text variant="caption" color="accent">
        {label}
      </Text>
    </View>
  );
}
