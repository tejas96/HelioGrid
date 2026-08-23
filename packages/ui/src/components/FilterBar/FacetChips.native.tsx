import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { FacetChipsProps } from './FilterBar.types';
import { optionLabel, optionValue } from './FilterBar.types';
import { FilterPill, filterStyles, PillCount, PillLabel } from './FilterPill.native';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  wrap: { flexWrap: 'wrap' },
  /* A ticked chip gives the tick its room back on the leading edge (10 vs 14). */
  ticked: { paddingLeft: 10, paddingRight: theme.spacing['sp-3'] },
});

/** The tick is the second, non-colour channel — a set has to be readable without hue. */
function Tick({ color }: { color: string }) {
  return (
    <Icon size="sm" color={color}>
      <Svg viewBox="0 0 24 24" fill="none">
        <Path
          d="m5 13 4 4L19 7"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Icon>
  );
}

interface NativeFacetChipsProps extends FacetChipsProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * **Multi-select chips — how a dimension holds several values.** Selected chips take the accent
 * fill *and a tick*, so a set is readable without hue.
 *
 * The web half is a `<fieldset aria-label>`, which IS `role="group"`; RN spells the same role
 * `role="group"`, so that is what the container takes — never `accessible`, which would fold every
 * chip and its tick into one target.
 *
 * **A CHIP IS A TOGGLE BUTTON THAT IS ON, and both halves say it with one word.** The design
 * system's reading is `role="group"` + pressed, not a checkbox: the web `<button aria-pressed>`
 * and this chip are the same control. `accessibilityState.selected` is the primitive's spelling of
 * exactly that — it becomes `aria-pressed` on web and `accessibilityState.selected` on native — so
 * the chip goes through `Pressable` and neither half has to name a role. Announcing it here as a
 * `checkbox` carrying `checked` said a different thing from the web half about the same chip.
 *
 * The web half's arrow-move-without-selecting keyboard has no touch equivalent; a tap toggles
 * exactly one chip, which is the same act it performs there.
 */
export function FacetChips({
  options,
  values = [],
  onChange,
  counts,
  label,
  scroll = false,
  style,
}: NativeFacetChipsProps) {
  const selected = new Set(values);
  const toggle = (optValue: string) => {
    if (onChange === undefined) return;
    onChange(selected.has(optValue) ? values.filter((x) => x !== optValue) : [...values, optValue]);
  };

  const chips = options.map((option) => {
    const optValue = optionValue(option);
    const on = selected.has(optValue);
    const count = counts?.[optValue];
    return (
      <Pressable
        key={optValue}
        accessibilityState={{ selected: on }}
        accessibilityLabel={optionLabel(option)}
        onPress={() => toggle(optValue)}
        style={filterStyles.target}
      >
        <FilterPill kind="chip" active={on} style={on ? styles.ticked : undefined}>
          {on ? <Tick color={theme.colors['text-inverse']} /> : null}
          <PillLabel kind="chip" active={on}>
            {optionLabel(option)}
          </PillLabel>
          {count === undefined ? null : <PillCount kind="chip" active={on} count={count} />}
        </FilterPill>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        role="group"
        accessibilityLabel={label}
        contentContainerStyle={styles.row}
        style={style}
      >
        {chips}
      </ScrollView>
    );
  }

  return (
    <View role="group" accessibilityLabel={label} style={[styles.row, styles.wrap, style]}>
      {chips}
    </View>
  );
}
