import { derivationPartHeading, derivationPartKey } from './Derivation.logic';
import type { DerivationKindWords, DerivationPart } from './Derivation.types';

/** The parts of one explanation: each kind's heading in the overline role, then its sentences. */
export function DerivationParts({
  parts,
  kindWords,
  size = 'sm',
}: {
  parts: DerivationPart[];
  kindWords: DerivationKindWords;
  /** `sm` = 13px (the cell panel), `md` = 14px (a block), `xs` = 12px (the print appendix). */
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <div className="hg-derivation-parts" data-size={size}>
      {parts.map((part, position) => (
        <div className="hg-derivation-part" key={derivationPartKey(part, position)}>
          <span className="hg-derivation-part-label">{derivationPartHeading(part, kindWords)}</span>
          <p className="hg-derivation-part-text">{part.text}</p>
        </div>
      ))}
    </div>
  );
}
