import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { Input } from '../Input/Input.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import type { BrandColorFieldProps } from './BrandColorField.types';
import {
  brandColourActs,
  fieldWordsOf,
  fullVerdicts,
  isChosenSwatch,
  readFieldColour,
  shortVerdict,
  specimenWordColour,
} from './BrandColorField.verdicts';
import { BrandColorSpecimen } from './BrandColorSpecimen.native';
import { BrandShortVerdict } from './BrandShortVerdict.native';
import { BrandVerdictLine } from './BrandVerdictLine.native';
import { BRAND_SWATCH_PRESETS, DEFAULT_BRAND_COLOUR } from './brand-swatches';

interface NativeBrandColorFieldProps extends BrandColorFieldProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Same three laws as the web half. Two mappings worth naming: the selected swatch's double ring is
 * an RN border (RN has no layered box-shadow), and the 44px target comes from the Pressable
 * primitive rather than this file's own minimum.
 */
export function BrandColorField({
  words,
  value = DEFAULT_BRAND_COLOUR,
  onChange,
  label,
  helper,
  presets = BRAND_SWATCH_PRESETS,
  specimenLabel,
  companyName,
  specimenWord,
  showSuggestion = true,
  specimen = true,
  verdict = 'full',
  disabled = false,
  density = 'expressive',
  style,
}: NativeBrandColorFieldProps) {
  const shown = fieldWordsOf(words, { label, helper, specimenLabel, specimenWord });
  const { hex, reading } = readFieldColour(value, showSuggestion);
  const { set, takeInk } = brandColourActs(reading, onChange);

  return (
    <View style={[styles.column, style]}>
      <View>
        <Text variant="body-sm" color="secondary">
          {shown.label}
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={shown.label}
          style={styles.swatches}
        >
          {presets.map((preset) => {
            const chosen = isChosenSwatch(preset, hex);
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
        label={words.hexLabel}
        value={hex ?? value}
        mono
        commitOnBlur
        onCommit={set}
        disabled={disabled}
        density={density}
        helper={hex === null ? words.hexHelper : undefined}
        error={hex === null ? words.hexError : undefined}
        leading={
          <View style={[styles.chip, hex === null ? undefined : { backgroundColor: hex }]} />
        }
      />

      {reading !== null && specimen ? (
        <View>
          <Text variant="overline" color="tertiary">
            {shown.specimenLabel}
          </Text>
          <BrandColorSpecimen
            hex={reading.hex}
            textOn={reading.on.color}
            companyName={companyName}
            kindWord={words.specimenKind}
            word={shown.specimenWord}
            wordColour={specimenWordColour(reading)}
          />
        </View>
      ) : null}

      {reading !== null && verdict === 'short' ? (
        <BrandShortVerdict
          verdict={shortVerdict(reading, words.short)}
          fixHex={reading.fix?.hex ?? null}
          words={words.ink}
          onUse={takeInk}
          disabled={disabled}
        />
      ) : null}

      {reading !== null && verdict === 'full' ? (
        <View style={styles.verdicts}>
          {fullVerdicts(reading, words.full).map((line) => (
            <BrandVerdictLine key={line.kind + line.sentence} kind={line.kind}>
              {line.sentence}
            </BrandVerdictLine>
          ))}
          {reading.fix === null ? null : (
            <View style={styles.fixRow}>
              <Button variant="primary" size="sm" disabled={disabled} onClick={takeInk}>
                {words.full.takeHexWords(reading.fix.hex)}
              </Button>
              <View style={styles.fixNote}>
                <Text variant="caption" color="tertiary">
                  {words.full.inkNote({ ratio: String(reading.fix.ratio) })}
                </Text>
                <ProvenanceTier tier="derived" />
              </View>
            </View>
          )}
        </View>
      ) : null}

      {shown.helper === '' ? null : (
        <Text variant="caption" color="tertiary">
          {shown.helper}
        </Text>
      )}
    </View>
  );
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
  fixNote: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
