import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import {
  FIELD_BOX_EDGE,
  fieldBox,
  fieldBoxPlaceholder,
  fieldBoxText,
} from '../../primitives/FieldBox/FieldBox.native';
import { GroundProvider, useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { FiltersButton } from '../FilterBar/FilterBar.native';
import type { SearchFieldProps } from './SearchField.types';

type NativeSearchFieldProps = SearchFieldProps & {
  style?: StyleProp<ViewStyle>;
};

type SearchPillProps = Omit<SearchFieldProps, 'onFilterClick' | 'filterCount' | 'filterLabel'> & {
  style?: StyleProp<ViewStyle>;
};

/**
 * Borderless search input with a leading magnifier: a well (`FieldBox`), whose ring sits on its
 * own edge on the phone and is always laid out, so the box never reflows when focus arrives.
 * Expressive is the open page's grey pill, 50 tall; functional the dense 40px box. With
 * `onFilterClick` the 50×50 filter square rides beside the pill, and the caller's style places
 * the pair.
 */
export function SearchField(props: NativeSearchFieldProps) {
  if (props.onFilterClick === undefined) return <SearchPill {...props} />;
  const { onFilterClick, filterCount, filterLabel, style, ...pill } = props;
  return (
    <View style={[styles.row, style]}>
      <SearchPill {...pill} style={styles.rowPill} />
      <FiltersButton onClick={onFilterClick} count={filterCount} label={filterLabel} />
    </View>
  );
}

function SearchPill({
  value,
  onChange,
  placeholder = 'Search name, phone or city',
  density = 'expressive',
  onClear,
  disabled = false,
  ariaLabel,
  style,
}: SearchPillProps) {
  const [focus, setFocus] = useState(false);
  const hasValue = value !== undefined && value !== '';
  return (
    <View
      style={[
        styles.box,
        fieldBox({ focused: focus, disabled, density }),
        density === 'functional' ? styles.boxFunctional : styles.boxExpressive,
        style,
      ]}
    >
      {/* 18dp is the DS glyph size; it is off the Icon primitive's ladder, so the Svg is direct. */}
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors['text-tertiary']}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Circle cx={11} cy={11} r={7} />
        <Path d="m20 20-3.5-3.5" />
      </Svg>
      <TextInput
        style={[styles.input, fieldBoxText(disabled)]}
        value={value}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={fieldBoxPlaceholder(disabled)}
        accessibilityLabel={ariaLabel ?? placeholder}
        onChangeText={(next) => onChange?.(next)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        returnKeyType="search"
        autoCorrect={false}
      />
      {hasValue && onClear !== undefined ? (
        /* The well is the ground of what sits in it, as RichText's frame is: a control there takes
           the opposite of the well. */
        <GroundProvider ground="tile">
          <Pressable accessibilityLabel="Clear search" onPress={onClear} style={styles.clear}>
            <ClearPill />
          </Pressable>
        </GroundProvider>
      ) : null}
    </View>
  );
}

/** 44dp target, 28dp pill: the two rectangles again. */
function ClearPill() {
  const { controlFill } = useGround();
  return (
    <View style={[styles.clearPill, { backgroundColor: controlFill }]}>
      <Svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors['text-secondary']}
        strokeWidth={2}
        strokeLinecap="round"
      >
        <Path d="M18 6 6 18M6 6l12 12" />
      </Svg>
    </View>
  );
}

/* The heights, the side paddings and the 10dp gaps are the design system's own and sit off the
   4dp scale, so no token carries them. Each side padding is less the always-present edge, so the
   inner box matches web exactly. */
const box: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  minHeight: 44,
  flexShrink: 0,
};

const input: TextStyle = {
  flex: 1,
  minWidth: 0,
  alignSelf: 'stretch',
  padding: 0,
  fontFamily: theme.type.families.sans,
  fontSize: theme.type.roles.body.fontSize,
  color: theme.colors['text-primary'],
};

const styles = StyleSheet.create({
  box,
  /* After `fieldBox`, so the pill's radius replaces the well's expressive one. */
  boxExpressive: {
    height: 50,
    paddingHorizontal: 18 - FIELD_BOX_EDGE,
    borderRadius: theme.radius['r-pill'],
  },
  boxFunctional: {
    height: 40,
    paddingHorizontal: 14 - FIELD_BOX_EDGE,
  },
  input,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  rowPill: {
    flex: 1,
    minWidth: 0,
  },
  clear: {
    /* The 44dp target, with the extra width taken back so the row geometry is unchanged. */
    width: 44,
    height: 44,
    marginLeft: -8,
    marginRight: -12,
  },
  clearPill: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
});
