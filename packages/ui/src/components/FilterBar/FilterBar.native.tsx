import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Text } from '../../primitives/Text/Text.native';
import { FacetChips } from './FacetChips.native';
import type { FiltersButtonProps, ScopeToggleProps, SortPillsProps } from './FilterBar.types';
import { optionLabel, optionValue } from './FilterBar.types';
import { FilterChips } from './FilterChips.native';
import { FilterPill, filterStyles, PillLabel, pillWords } from './FilterPill.native';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  sortLabel: { marginRight: theme.spacing['sp-1'] },
});

interface NativeScopeToggleProps extends ScopeToggleProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeSortPillsProps extends SortPillsProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeFiltersButtonProps extends FiltersButtonProps {
  style?: StyleProp<ViewStyle>;
}

/** Two-or-three-way scope switch. Active = near-black pill, the primary-action marker. */
export function ScopeToggle({ options, value, onChange, style }: NativeScopeToggleProps) {
  return (
    <View accessibilityRole="tablist" style={[styles.row, style]}>
      {options.map((option) => {
        const optValue = optionValue(option);
        const active = optValue === value;
        return (
          <RNPressable
            key={optValue}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange?.(optValue)}
            style={filterStyles.target}
          >
            <FilterPill kind="scope" active={active}>
              <PillLabel kind="scope" active={active}>
                {optionLabel(option)}
              </PillLabel>
            </FilterPill>
          </RNPressable>
        );
      })}
    </View>
  );
}

/** "Sort" label + inline pills. Active = accent fill. */
export function SortPills({
  options,
  value,
  onChange,
  label = 'Sort',
  style,
}: NativeSortPillsProps) {
  return (
    <View style={[styles.row, style]}>
      <Text variant="caption" color="tertiary" style={styles.sortLabel}>
        {label}
      </Text>
      {options.map((option) => {
        const optValue = optionValue(option);
        const active = optValue === value;
        return (
          <RNPressable
            key={optValue}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange?.(optValue)}
            style={filterStyles.target}
          >
            <FilterPill kind="sort" active={active}>
              <PillLabel kind="sort" active={active}>
                {optionLabel(option)}
              </PillLabel>
            </FilterPill>
          </RNPressable>
        );
      })}
    </View>
  );
}

/**
 * White pill that opens the filter body — `FilterPanel`, **at every width**. Not a phone
 * affordance: on a wide screen the same body opens as a side panel (`F7-31`).
 */
export function FiltersButton({
  onClick,
  count = 0,
  label = 'Filters',
  style,
}: NativeFiltersButtonProps) {
  return (
    <RNPressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `${label}, ${count} active` : label}
      onPress={onClick}
      style={[filterStyles.target, style]}
    >
      <FilterPill kind="filters">
        <Icon size="sm" color={theme.colors['text-primary']}>
          <Svg viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 6h16M7 12h10M10 18h4"
              stroke={theme.colors['text-primary']}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Icon>
        <PillLabel kind="filters" active={false}>
          {label}
        </PillLabel>
        {count > 0 ? (
          <View style={filterStyles.badge}>
            <Text variant="caption" color="inverse" style={pillWords}>
              {String(count)}
            </Text>
          </View>
        ) : null}
      </FilterPill>
    </RNPressable>
  );
}

export { FacetChips, FilterChips };

/** All filter controls as one namespace object — the whole filtering vocabulary as one unit. */
export const FilterBar = {
  ScopeToggle,
  FilterChips,
  FacetChips,
  SortPills,
  FiltersButton,
};
