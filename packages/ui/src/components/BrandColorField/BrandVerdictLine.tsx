import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { ProvenanceTier } from '../Provenance/Provenance';
import type { BrandVerdictKind } from './BrandColorField.types';
import { VERDICT_GLYPH } from './BrandVerdictLine.logic';

interface BrandVerdictLineProps {
  kind: BrandVerdictKind;
  children: string;
}

/**
 * One full verdict: a GLYPH plus the words, and the tier of the ratio it states (`F8-01` —
 * *Derived*; the floors it quotes are rules and carry none). F7-12 — this is the one control in the
 * product whose subject matter *is* colour, so it must not model a verdict as a coloured dot.
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
        <ShellGlyphMarks name={VERDICT_GLYPH[kind]} />
      </svg>
      <span>
        {children} <ProvenanceTier tier="derived" />
      </span>
    </p>
  );
}
