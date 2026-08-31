import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import {
  asWordOnPaper,
  bestTextOn,
  darkenToPass,
  normaliseHex,
  TEXT_FLOOR,
} from '../../utils/color-contrast';
import { Input } from '../Input/Input.native';
import type { BrandColorFieldProps } from './BrandColorField.types';
import { textOnFillVerdict, wordOnPaperVerdict } from './BrandColorField.verdicts';
import { BrandColorSpecimen } from './BrandColorSpecimen.native';
import { BrandVerdictLine } from './BrandVerdictLine.native';
import { BRAND_SWATCH_PRESETS, DEFAULT_BRAND_COLOUR } from './brand-swatches';

interface NativeBrandColorFieldProps extends BrandColorFieldProps {
  style?: StyleProp<ViewStyle>;
}

const SWATCH = 44;

const styles = StyleSheet.create({
  column: { gap: 14, minWidth: 0 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: SWATCH / 2, ...theme.elevation.e2 },
  swatchSelected: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.elevation.e2,
  },
  chip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors['canvas-sunken'],
  },
  verdicts: { gap: 7 },
  fixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-0-5'],
  },
  fixButton: {
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['action-primary'],
  },
});

/**
 * Same three laws as the web half. Two mappings worth naming: the selected swatch's double ring is
 * an RN border (RN has no layered box-shadow), and the 44px target comes from the Pressable
 * primitive rather than this file's own minimum.
 */
export function BrandColorField({
  value = DEFAULT_BRAND_COLOUR,
  onChange,
  label = 'Primary brand colour',
  helper = 'Used on the proposal PDF and the customer link page. The HelioGrid app itself is never restyled.',
  presets = BRAND_SWATCH_PRESETS,
  specimenLabel = 'On the proposal',
  companyName = 'Suryodaya Solar Pvt Ltd',
  showSuggestion = true,
  disabled = false,
  density = 'expressive',
  style,
}: NativeBrandColorFieldProps) {
  const hex = normaliseHex(value);
  const on = hex === null ? null : bestTextOn(hex);
  const word = hex === null ? null : asWordOnPaper(hex);
  const fix =
    hex !== null && on !== null && !on.passes && showSuggestion
      ? darkenToPass(hex, TEXT_FLOOR)
      : null;

  const set = (next: string) => {
    const normalised = normaliseHex(next);
    if (normalised !== null) {
      onChange?.(normalised);
    }
  };

  return (
    <View style={[styles.column, style]}>
      <View>
        <Text variant="body-sm" color="secondary">
          {label}
        </Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.swatches}>
          {presets.map((preset) => {
            const chosen = normaliseHex(preset) === hex;
            return (
              <Pressable
                key={preset}
                accessibilityLabel={preset}
                /* A SWATCH IS A RADIO, the same word the web half spells on its own button inside
                   the radiogroup — through the primitive, so the 44dp floor stays. */
                accessibilityRole="radio"
                /* WHICH COLOUR IS CHOSEN, said rather than ringed (F7-12): the accent border is the
                   sighted channel and `checked` is the spoken one. `aria-checked` on the web. */
                accessibilityState={{ checked: chosen }}
                disabled={disabled}
                onPress={() => set(preset)}
                style={[
                  styles.swatch,
                  { backgroundColor: preset },
                  chosen ? styles.swatchSelected : undefined,
                ]}
              />
            );
          })}
        </View>
      </View>

      <Input
        label="Hex"
        value={hex ?? value}
        mono
        commitOnBlur
        onCommit={set}
        disabled={disabled}
        density={density}
        helper={hex === null ? 'Enter a 6-digit hex colour, e.g. #1F5FA9' : undefined}
        error={hex === null ? "That isn't a hex colour." : undefined}
        leading={
          <View style={[styles.chip, hex === null ? undefined : { backgroundColor: hex }]} />
        }
      />

      {hex !== null && on !== null && word !== null ? (
        <View>
          <Text variant="overline" color="tertiary">
            {specimenLabel}
          </Text>
          <BrandColorSpecimen
            hex={hex}
            textOn={on.color}
            companyName={companyName}
            figureInBrand={word.passesText}
          />
        </View>
      ) : null}

      {hex !== null && on !== null && word !== null ? (
        <View style={styles.verdicts}>
          {[textOnFillVerdict(on), wordOnPaperVerdict(word)].map((verdict) => (
            <BrandVerdictLine key={verdict.kind + verdict.sentence} kind={verdict.kind}>
              {verdict.sentence}
            </BrandVerdictLine>
          ))}
          {fix === null ? null : (
            <View style={styles.fixRow}>
              <Pressable onPress={() => set(fix.hex)} style={styles.fixButton}>
                <Text color="inverse">Use {fix.hex}</Text>
              </Pressable>
              <Text variant="caption" color="tertiary">
                Same hue, darkened to {fix.ratio}:1.
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {helper === undefined ? null : (
        <Text variant="caption" color="tertiary">
          {helper}
        </Text>
      )}
    </View>
  );
}
