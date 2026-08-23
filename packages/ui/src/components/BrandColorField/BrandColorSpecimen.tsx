interface BrandColorSpecimenProps {
  /** Normalised "#RRGGBB" — tenant DATA, so it is drawn inline. It is never a token. */
  hex: string;
  /** Whichever of white / near-black the document will set on the band. */
  textOn: string;
  companyName: string;
  /** True when the colour itself clears the text floor on paper and may set the figure. */
  figureInBrand: boolean;
}

/**
 * The document context, and the ONLY thing the tenant colour paints. F7-07 makes the operator
 * application identical for every tenant, so this control writes no token and touches no ancestor
 * style — the two inline colours below are the tenant's data inside a specimen, nothing more.
 */
export function BrandColorSpecimen({
  hex,
  textOn,
  companyName,
  figureInBrand,
}: BrandColorSpecimenProps) {
  return (
    <div className="hg-brand-color-specimen">
      <div className="hg-brand-color-specimen-band" style={{ background: hex, color: textOn }}>
        <span className="hg-brand-color-specimen-name">{companyName}</span>
        <span className="hg-brand-color-specimen-kind">Proposal</span>
      </div>
      <div className="hg-brand-color-specimen-body">
        <span className="hg-brand-color-specimen-line">8.4 kWp rooftop system</span>
        <span
          className="hg-brand-color-specimen-figure"
          style={figureInBrand ? { color: hex } : undefined}
        >
          ₹4,52,471
        </span>
      </div>
    </div>
  );
}
