import type { BrandColorSpecimenProps } from './BrandColorField.types';

/**
 * The document context, and the ONLY thing the tenant colour paints. F7-07 makes the operator
 * application identical for every tenant, so this control writes no token and touches no ancestor
 * style — the inline colours below are the tenant's data inside a specimen, nothing more. It
 * prints no figure: an untiered amount has no place on a screen of the tenant's own values.
 */
export function BrandColorSpecimen({
  hex,
  textOn,
  companyName,
  kindWord,
  word,
  wordColour,
}: BrandColorSpecimenProps) {
  return (
    <div className="hg-brand-color-specimen">
      <div className="hg-brand-color-specimen-band" style={{ background: hex, color: textOn }}>
        {companyName === undefined ? null : (
          <span className="hg-brand-color-specimen-name">{companyName}</span>
        )}
        <span className="hg-brand-color-specimen-kind">{kindWord}</span>
      </div>
      <div className="hg-brand-color-specimen-body">
        <span className="hg-brand-color-specimen-word" style={{ color: wordColour }}>
          {word}
        </span>
      </div>
    </div>
  );
}
