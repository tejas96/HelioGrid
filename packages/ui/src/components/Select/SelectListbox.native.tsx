import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { renderActionReason } from '../ActionReason/ActionReason.native';
import type { SelectOption } from './Select.types';

interface NativeSelectListboxProps {
  activeIndex: number;
  maxHeight: number;
  onCommit: (index: number) => void;
  options: readonly SelectOption[];
  value?: string;
}

/**
 * The e4 popover listbox. Options are 44dp (the Pressable primitive's floor), a disabled one keeps
 * a readable label, and its reason is the SECOND LINE of the row — never a tooltip, never the
 * label. Web's hover-activates-the-row behaviour has no touch counterpart: on RN the active row is
 * the selected one until a tap commits.
 */
export function SelectListbox({
  activeIndex,
  maxHeight,
  onCommit,
  options,
  value,
}: NativeSelectListboxProps) {
  return (
    /* The web half's popup is a `<ul role="listbox">`. RN HAS NO `listbox`: its `Role` union
       (ViewAccessibility.d.ts) carries `list` and `option` and nothing between them, so `list` is
       the nearest true word and the one the stacked DataTable uses for the same shape. It is a
       CONTAINER role, so it goes on the scroller — never on a row's press target, whose semantics
       belong to the `Pressable` primitive. */
    <ScrollView role="list" style={{ maxHeight }} contentContainerStyle={styles.content}>
      {options.map((option, index) => (
        <OptionRow
          key={option.value}
          active={index === activeIndex}
          onPress={() => onCommit(index)}
          option={option}
          selected={option.value === value}
        />
      ))}
    </ScrollView>
  );
}

interface OptionRowProps {
  active: boolean;
  onPress: () => void;
  option: SelectOption;
  selected: boolean;
}

/**
 * One 44dp row: the label, the tick, and — when it cannot be picked — the reason beneath, through
 * `ActionReason`, which owns the barred-circle second channel.
 *
 * Off with NO reason is the only row that stops being pressable — one with a stated reason stays
 * reachable, or the sentence explaining it is announced to nobody. Committing still refuses it,
 * and `accessibilityState.disabled` is what makes that row SAY it is off while staying reachable
 * (the web half's `aria-disabled`); the plain prop would take it out of the walk entirely.
 *
 * **WHICH ONE IS PICKED IS SPOKEN, not left to the tick and the bold weight** (`F7-12`). The web
 * half's `aria-selected` and this `accessibilityState.selected` are one declaration in the
 * primitive's vocabulary, mapped per platform. The `option` role itself is the row's structural
 * word inside `role="listbox"`, so it sits on the row rather than on the press target — the same
 * split `DataTableCard.native` uses for `listitem` inside a list.
 */
function OptionRow({ active, onPress, option, selected }: OptionRowProps) {
  const disabled = option.disabled === true;
  const reason: ReactNode = disabled ? renderActionReason(option.disabledReason) : null;
  const hasReason = reason !== null;
  return (
    <View role="option">
      <Pressable
        accessibilityLabel={option.label}
        accessibilityState={{ disabled, selected }}
        disabled={disabled && !hasReason}
        onPress={disabled ? undefined : onPress}
        style={[
          styles.option,
          hasReason ? styles.optionWithReason : undefined,
          active && !disabled ? styles.optionActive : undefined,
        ]}
      >
        <View style={styles.line}>
          <Text
            variant="body"
            color={disabled ? 'tertiary' : 'primary'}
            style={selected ? styles.selectedLabel : undefined}
          >
            {option.label}
          </Text>
          {selected ? (
            <Svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M20 6 9 17l-5-5" />
            </Svg>
          ) : null}
        </View>
        {/* The second line — never the label, and never a tooltip. */}
        {reason}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 6,
    gap: theme.spacing['sp-0-5'],
  },
  option: {
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: theme.spacing['sp-0-5'],
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-sm'],
  },
  optionWithReason: {
    paddingVertical: theme.spacing['sp-2'],
  },
  optionActive: {
    backgroundColor: theme.colors['neutral-bg'],
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  selectedLabel: {
    fontWeight: '700',
  },
});
