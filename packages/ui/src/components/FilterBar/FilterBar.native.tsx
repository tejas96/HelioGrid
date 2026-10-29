import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { FacetChips } from './FacetChips.native';
import { filtersButtonName } from './FilterBar.logic';
import type { FiltersButtonProps, ScopeToggleProps, SortPillsProps } from './FilterBar.types';
import { optionLabel, optionValue, PILL_HEIGHT } from './FilterBar.types';
import { FilterChips } from './FilterChips.native';
import { FilterPill, filterStyles, PillLabel } from './FilterPill.native';

/* The square's 50dp side and the badge's 20dp size, 5dp inset, 2dp ring and corner offset are the
   design system's own and sit off the 4dp scale, so no token carries them. The ring is a border,
   so the badge's box grows by it on each side and its offset grows with it: the drawn badge lands
   where the web's outer ring puts it. */
const BADGE = 20;
const BADGE_RING = 2;
const BADGE_OFFSET = -5;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  sortLabel: { marginRight: theme.spacing['sp-1'] },
  square: {
    width: PILL_HEIGHT.filters,
    height: PILL_HEIGHT.filters,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-field'],
    backgroundColor: theme.colors['action-primary'],
  },
  squarePressed: { backgroundColor: theme.colors['action-primary-pressed'] },
  badge: {
    position: 'absolute',
    top: BADGE_OFFSET - BADGE_RING,
    right: BADGE_OFFSET - BADGE_RING,
    minWidth: BADGE + 2 * BADGE_RING,
    height: BADGE + 2 * BADGE_RING,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BADGE_RING,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  badgeWords: { fontVariant: ['tabular-nums'] },
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
export function SortPills({ options, value, onChange, label, style }: NativeSortPillsProps) {
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

/** The sliders' ink: white on the near-black square. */
const SQUARE_INK = theme.colors['text-inverse'];

/**
 * The filter square that opens the filter body — `FilterPanel`, **at every width**, beside the
 * search pill (`SearchField`'s `onFilterClick` draws it). 50×50, the near-black primary fill,
 * darker while pressed, radius `r-field`, white sliders; the active count rides its top-right
 * corner, ringed in what holds the square. Not a phone affordance: on a wide screen the same body
 * opens as a side panel (`F7-31`).
 */
export function FiltersButton({
  onClick,
  count = 0,
  label,
  activeLabel,
  style,
}: NativeFiltersButtonProps) {
  const { ground } = useGround();
  return (
    <RNPressable
      accessibilityRole="button"
      accessibilityLabel={filtersButtonName({ count, label, activeLabel })}
      onPress={onClick}
      style={({ pressed }) => [styles.square, pressed ? styles.squarePressed : undefined, style]}
    >
      <Icon size="md" color={SQUARE_INK}>
        <Svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={SQUARE_INK}
          strokeWidth={1.75}
          strokeLinecap="round"
        >
          <ShellGlyphMarks name="sliders" />
        </Svg>
      </Icon>
      {count > 0 ? (
        <View style={[styles.badge, { borderColor: ground }]}>
          <Text variant="caption" color="inverse" bold style={styles.badgeWords}>
            {String(count)}
          </Text>
        </View>
      ) : null}
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
