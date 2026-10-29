import { theme } from '@heliogrid/theme';
import { useImperativeHandle, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, ScrollView, StyleSheet, View } from 'react-native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { chosenChipIndex } from './FilterBar.logic';
import type { FilterChipsProps } from './FilterBar.types';
import { optionIcon, optionLabel, optionValue } from './FilterBar.types';
import {
  FilterPill,
  filterStyles,
  OptionGlyph,
  PillCount,
  PillLabel,
  pillInkColor,
} from './FilterPill.native';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});

interface NativeFilterChipsProps extends FilterChipsProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Kind and stage chips: 44dp pills — the pill is the target — in the control fill, flat, with an
 * optional 18dp glyph before the label; the chosen one is the near-black primary marker with
 * white words.
 *
 * **One-of-N by construction** — `accessibilityRole="tablist"` with each chip a `tab` carrying
 * `selected`, the RN reading of the web half's `role="tablist"` + `aria-selected`. A dimension
 * that holds **several** values takes `FacetChips`.
 *
 * Touch mapping: the web half's arrow keys select as they move, which is what a pointer-free
 * keyboard needs; on touch the tap *is* the move, so there is nothing to add. `scroll` puts the
 * row in a horizontal ScrollView — the phone form the design system asks for. The focus handle
 * moves the screen reader's focus to the chosen chip, the reading of the web half's keyboard focus.
 */
export function FilterChips({
  options,
  value,
  onChange,
  counts,
  scroll = false,
  label,
  ref,
  style,
}: NativeFilterChipsProps) {
  const refs = useRef<(View | null)[]>([]);
  const selectedIndex = chosenChipIndex(options, value);
  /* Read when the focus lands, not when it was asked for: a caller asks in the same turn it chooses
     the chip. */
  const chosen = useRef(selectedIndex);
  chosen.current = selectedIndex;
  useImperativeHandle(
    ref,
    () => ({ focus: () => focusScreenReaderOn(() => refs.current[chosen.current] ?? null) }),
    [],
  );

  const chips = options.map((option, index) => {
    const optValue = optionValue(option);
    const active = optValue === value;
    const count = counts?.[optValue];
    const icon = optionIcon(option);
    return (
      <RNPressable
        key={optValue}
        ref={(chip) => {
          refs.current[index] = chip;
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onChange?.(optValue)}
        style={filterStyles.target}
      >
        <FilterPill kind="chip" active={active} lead={Boolean(icon)}>
          <OptionGlyph icon={icon} color={pillInkColor('chip', active)} />
          <PillLabel kind="chip" active={active}>
            {optionLabel(option)}
          </PillLabel>
          {count === undefined ? null : <PillCount kind="chip" active={active} count={count} />}
        </FilterPill>
      </RNPressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={label}
        contentContainerStyle={styles.row}
        style={style}
      >
        {chips}
      </ScrollView>
    );
  }

  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={[styles.row, style]}>
      {chips}
    </View>
  );
}
