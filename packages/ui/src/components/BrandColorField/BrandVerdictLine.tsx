import type { BrandVerdictKind } from './BrandColorField.types';

const PATH: Record<BrandVerdictKind, string> = {
  pass: 'M20 6 9 17l-5-5',
  warn: 'M12 9v4m0 3.5v.01M10.3 3.9 2.7 17a1.6 1.6 0 0 0 1.4 2.4h15.8a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0z',
  info: 'M12 16v-4m0-3.5v-.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
};

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
        <path d={PATH[kind]} />
      </svg>
      <span>{children}</span>
    </p>
  );
}
