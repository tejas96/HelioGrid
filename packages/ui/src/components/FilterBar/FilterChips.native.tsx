import { theme } from '@heliogrid/theme';
import { useImperativeHandle, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, ScrollView, StyleSheet, View } from 'react-native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Chip } from '../Chip/Chip.native';
import { chosenChipIndex } from './FilterBar.logic';
import type { FilterChipsProps } from './FilterBar.types';
import { optionIcon, optionLabel, optionValue } from './FilterBar.types';
import { CHIP_INK, filterStyles, OptionGlyph } from './FilterPill.native';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  /* A row that does not scroll wraps, so a long chip never runs past the screen's edge. */
  wrap: { flexWrap: 'wrap' },
});

interface NativeFilterChipsProps extends FilterChipsProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Kind and stage chips: 32dp hairline pills in a 44dp target, in the control fill, with an
 * optional 18dp glyph before the label; the chosen one is OneOhm's quiet choice, an ink outline
 * around ink words.
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
  look = 'filled',
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
        accessibilityHint={label}
        onPress={() => onChange?.(optValue)}
        style={filterStyles.target}
      >
        <Chip
          density={look === 'outlined' ? 'expressive' : 'filter'}
          active={active}
          leading={icon ? <OptionGlyph icon={icon} color={CHIP_INK} /> : undefined}
          {...(count === undefined ? {} : { count })}
        >
          {optionLabel(option)}
        </Chip>
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
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={[styles.row, styles.wrap, style]}
    >
      {chips}
    </View>
  );
}
