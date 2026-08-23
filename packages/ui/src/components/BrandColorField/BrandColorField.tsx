import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import {
  asWordOnPaper,
  bestTextOn,
  darkenToPass,
  normaliseHex,
  TEXT_FLOOR,
} from '../../utils/color-contrast';
import { Input } from '../Input';
import type { BrandColorFieldProps } from './BrandColorField.types';
import { textOnFillVerdict, wordOnPaperVerdict } from './BrandColorField.verdicts';
import { BrandColorSpecimen } from './BrandColorSpecimen';
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
 * 2. N4 / F7-11 — contrast is measured, not eyeballed, at entry, and stated in words with the ratio.
 * 3. F7-12 — every verdict is a WORD plus a glyph; the swatch is never the message.
 *
 * It does not refuse a colour. It says what is wrong and offers a darker shade that passes.
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
  className,
  style,
}: WebBrandColorFieldProps) {
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
    <div className={classNames('hg-brand-color', className)} style={style}>
      <div>
        <span className="hg-brand-color-title">{label}</span>
        {/* Curated swatches are the thumb path; the hex field is the precise one. Both ≥44. */}
        <div className="hg-brand-color-swatches" role="radiogroup" aria-label={label}>
          {presets.map((preset) => (
            // biome-ignore lint/a11y/useSemanticElements: an <input type="radio"> cannot BE the 44px colour circle it selects — the swatch's fill IS the option, so the DS draws a button in the radio role inside a radiogroup.
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={normaliseHex(preset) === hex}
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
          <span
            aria-hidden="true"
            className="hg-brand-color-chip"
            style={hex === null ? undefined : { background: hex }}
          />
        }
      />

      {/* Document context only — this specimen is the ONLY thing the tenant colour paints. */}
      {hex !== null && on !== null && word !== null ? (
        <div>
          <span className="hg-brand-color-overline">{specimenLabel}</span>
          <BrandColorSpecimen
            hex={hex}
            textOn={on.color}
            companyName={companyName}
            figureInBrand={word.passesText}
          />
        </div>
      ) : null}

      {hex !== null && on !== null && word !== null ? (
        <div className="hg-brand-color-verdicts">
          {[textOnFillVerdict(on), wordOnPaperVerdict(word)].map((verdict) => (
            <BrandVerdictLine key={verdict.kind + verdict.sentence} kind={verdict.kind}>
              {verdict.sentence}
            </BrandVerdictLine>
          ))}
          {fix === null ? null : (
            <div className="hg-brand-color-fix">
              <button
                type="button"
                className="hg-brand-color-fix-button"
                onClick={() => set(fix.hex)}
              >
                Use {fix.hex}
              </button>
              <span className="hg-brand-color-fix-note">Same hue, darkened to {fix.ratio}:1.</span>
            </div>
          )}
        </div>
      ) : null}

      {helper === undefined ? null : <p className="hg-brand-color-helper">{helper}</p>}
    </div>
  );
}
