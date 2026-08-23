import type { DerivationPart } from './Derivation.types';
import { DERIVATION_KINDS } from './Derivation.types';

/** The parts of one explanation: each kind's heading in the overline role, then its sentences. */
export function DerivationParts({
  parts,
  size = 'sm',
}: {
  parts: DerivationPart[];
  /** `sm` = 13px (the cell panel), `md` = 14px (a block), `xs` = 12px (the print appendix). */
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <div className="hg-derivation-parts" data-size={size}>
      {parts.map((part, position) => (
        <div
          className="hg-derivation-part"
          key={`${part.kind}-${typeof part.text === 'string' ? part.text : position}`}
        >
          <span className="hg-derivation-part-label">
            {part.label ?? DERIVATION_KINDS[part.kind].label}
          </span>
          <p className="hg-derivation-part-text">{part.text}</p>
        </div>
      ))}
    </div>
  );
}
