import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, ScrollView, StyleSheet, View } from 'react-native';
import type { FilterChipsProps } from './FilterBar.types';
import { optionLabel, optionValue } from './FilterBar.types';
import { FilterPill, filterStyles, PillCount, PillLabel } from './FilterPill.native';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});

interface NativeFilterChipsProps extends FilterChipsProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Stage chips. Active = accent fill; the rest are white pills that separate by shadow.
 *
 * **One-of-N by construction** — `accessibilityRole="tablist"` with each chip a `tab` carrying
 * `selected`, the RN reading of the web half's `role="tablist"` + `aria-selected`. A dimension
 * that holds **several** values takes `FacetChips`.
 *
 * Touch mapping: the web half's arrow keys select as they move, which is what a pointer-free
 * keyboard needs; on touch the tap *is* the move, so there is nothing to add. `scroll` puts the
 * row in a horizontal ScrollView — the phone form the design system asks for.
 */
export function FilterChips({
  options,
  value,
  onChange,
  counts,
  scroll = false,
  label,
  style,
}: NativeFilterChipsProps) {
  const chips = options.map((option) => {
    const optValue = optionValue(option);
    const active = optValue === value;
    const count = counts?.[optValue];
    return (
      <RNPressable
        key={optValue}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onChange?.(optValue)}
        style={filterStyles.target}
      >
        <FilterPill kind="chip" active={active}>
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
