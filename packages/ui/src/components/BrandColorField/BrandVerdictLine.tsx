import type { BrandVerdictKind } from './BrandColorField.types';
import { VERDICT_PATH } from './BrandVerdictLine.logic';

interface BrandVerdictLineProps {
  kind: BrandVerdictKind;
  children: string;
}

/**
 * One verdict: a GLYPH plus the words. F7-12 — this is the one control in the product whose subject
 * matter *is* colour, which makes it the likeliest pattern for other screens to copy, so it must not
 * model a verdict as a coloured dot.
 */
export function BrandVerdictLine({ kind, children }: BrandVerdictLineProps) {
  return (
    <p className="hg-brand-color-verdict" data-kind={kind}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={VERDICT_PATH[kind]} />
      </svg>
      <span>{children}</span>
    </p>
  );
}
