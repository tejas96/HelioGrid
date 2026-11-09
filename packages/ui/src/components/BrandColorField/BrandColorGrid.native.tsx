import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { isChosenSwatch } from './BrandColorField.verdicts';
import { BRAND_PICKER_COLOURS } from './brand-swatches';

/**
 * The hex field's dot on the phone: a tap opens the colour grid under the field, as the web's dot
 * opens the browser's picker. `expanded` says the grid is open; the dot's fill is the sighted channel.
 */
export function BrandColorDot({
  hex,
  label,
  open,
  disabled,
  onToggle,
}: {
  hex: string | null;
  label: TranslatedText;
  open: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: open, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={styles.dotTarget}
    >
      <View style={[styles.dot, hex === null ? undefined : { backgroundColor: hex }]} />
    </Pressable>
  );
}

/** The grid itself: each colour a radio, as the swatches above it are; a pick closes the grid. */
export function BrandColorGrid({
  hex,
  label,
  disabled,
  onPick,
}: {
  hex: string | null;
  label: TranslatedText;
  disabled: boolean;
  onPick: (hex: string) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.grid}>
      {BRAND_PICKER_COLOURS.map((colour) => {
        const chosen = isChosenSwatch(colour, hex);
        return (
          <Pressable
            key={colour}
            accessibilityLabel={colour}
            accessibilityRole="radio"
            accessibilityState={{ checked: chosen }}
            disabled={disabled}
            onPress={() => onPick(colour)}
            style={[
              styles.cell,
              { backgroundColor: colour },
              chosen ? styles.cellChosen : undefined,
            ]}
          />
        );
      })}
    </View>
  );
}

const CELL = 44;
const DOT = 22;

const styles = StyleSheet.create({
  dotTarget: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors['canvas-sunken'],
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  cell: { width: CELL, height: CELL, borderRadius: CELL / 2 },
  cellChosen: { borderWidth: 2, borderColor: colors.accent },
});
