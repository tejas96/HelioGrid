import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Button } from '../Button';
import { Input } from '../Input';
import { ProvenanceTier } from '../Provenance/Provenance';
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
import { BrandColorSpecimen } from './BrandColorSpecimen';
import { BrandShortVerdict } from './BrandShortVerdict';
import { BrandVerdictLine } from './BrandVerdictLine';
import { BRAND_SWATCH_PRESETS, DEFAULT_BRAND_COLOUR } from './brand-swatches';

interface WebBrandColorFieldProps extends BrandColorFieldProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The tenant's primary brand colour (M01-50 / F7-07). Three product laws shape it:
 *
 * 1. F7-07 — the colour rides the generated proposal and the customer link page. THE OPERATOR
 *    APPLICATION IS NEVER RESTYLED PER TENANT, so this control writes no token, sets no ancestor
 *    style, and previews the colour only inside a document specimen.
 * 2. N4 / F7-11 — contrast is measured, not eyeballed, at entry, and stated in words.
 * 3. F7-12 — every verdict is a WORD plus a glyph; the swatch is never the message.
 *
 * It does not refuse a colour. It says what is wrong and offers the derived ink that passes.
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
  className,
  style,
}: WebBrandColorFieldProps) {
  const shown = fieldWordsOf(words, { label, helper, specimenLabel, specimenWord });
  const { hex, reading } = readFieldColour(value, showSuggestion);
  const { set, takeInk } = brandColourActs(reading, onChange);

  return (
    <div className={classNames('hg-brand-color', className)} style={style}>
      <div>
        <span className="hg-brand-color-title">{shown.label}</span>
        {/* Curated swatches are the thumb path; the hex field is the precise one. Both ≥44. */}
        <div className="hg-brand-color-swatches" role="radiogroup" aria-label={shown.label}>
          {presets.map((preset) => (
            // biome-ignore lint/a11y/useSemanticElements: an <input type="radio"> cannot BE the 44px colour circle it selects — the swatch's fill IS the option, so the DS draws a button in the radio role inside a radiogroup.
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={isChosenSwatch(preset, hex)}
              aria-label={preset}
              disabled={disabled}
              className="hg-brand-color-swatch"
              /* The tenant's colour is DATA — inline is the only honest place for it. */
              style={{ background: preset }}
              onClick={() => set(preset)}
            />
          ))}
        </div>
      </div>

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
          <span
            aria-hidden="true"
            className="hg-brand-color-chip"
            style={hex === null ? undefined : { background: hex }}
          />
        }
      />

      {/* Document context only — this specimen is the ONLY thing the tenant colour paints. */}
      {reading !== null && specimen ? (
        <div>
          <span className="hg-brand-color-overline">{shown.specimenLabel}</span>
          <BrandColorSpecimen
            hex={reading.hex}
            textOn={reading.on.color}
            companyName={companyName}
            kindWord={words.specimenKind}
            word={shown.specimenWord}
            wordColour={specimenWordColour(reading)}
          />
        </div>
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
        <div className="hg-brand-color-verdicts">
          {fullVerdicts(reading, words.full).map((line) => (
            <BrandVerdictLine key={line.kind + line.sentence} kind={line.kind}>
              {line.sentence}
            </BrandVerdictLine>
          ))}
          {reading.fix === null ? null : (
            <div className="hg-brand-color-fix">
              <Button variant="primary" size="sm" disabled={disabled} onClick={takeInk}>
                {words.full.takeHexWords(reading.fix.hex)}
              </Button>
              <span className="hg-brand-color-fix-note">
                {words.full.inkNote({ ratio: String(reading.fix.ratio) })}{' '}
                <ProvenanceTier tier="derived" />
              </span>
            </div>
          )}
        </div>
      ) : null}

      {shown.helper === '' ? null : <p className="hg-brand-color-helper">{shown.helper}</p>}
    </div>
  );
}
