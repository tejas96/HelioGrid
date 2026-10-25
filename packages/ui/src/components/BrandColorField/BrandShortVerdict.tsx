import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { Button } from '../Button';
import type { BrandShortVerdictProps } from './BrandColorField.types';
import { VERDICT_GLYPH } from './BrandVerdictLine.logic';

/**
 * `verdict="short"` — the outcome in one line, no ratio, beside a glyph disc: a WORD plus a mark,
 * never the tint alone (F7-12). A failing colour gets its derived ink as a quiet row — the shade,
 * what it is, and one secondary act that takes it.
 */
export function BrandShortVerdict({
  verdict,
  fixHex,
  words,
  onUse,
  disabled,
}: BrandShortVerdictProps) {
  return (
    <div className="hg-brand-color-short">
      <p className="hg-brand-color-short-line" data-kind={verdict.kind}>
        <span className="hg-brand-color-short-disc" aria-hidden="true">
          <svg
            aria-hidden="true"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ShellGlyphMarks name={VERDICT_GLYPH[verdict.kind]} />
          </svg>
        </span>
        <span>{verdict.sentence}</span>
      </p>
      {fixHex === null ? null : (
        <InkRow hex={fixHex} words={words} onUse={onUse} disabled={disabled} />
      )}
    </div>
  );
}

function InkRow({
  hex,
  words,
  onUse,
  disabled,
}: Pick<BrandShortVerdictProps, 'words' | 'onUse' | 'disabled'> & { hex: string }) {
  const { before, after } = words.inkWords(hex);
  return (
    <div className="hg-brand-color-ink">
      {/* The ink is tenant DATA — inline is the only honest place for it. */}
      <span className="hg-brand-color-ink-swatch" aria-hidden="true" style={{ background: hex }} />
      <span className="hg-brand-color-ink-words">
        <span className="hg-brand-color-ink-title">
          {before}
          <span className="hg-brand-color-ink-hex">{hex}</span>
          {after}
        </span>
        <span className="hg-brand-color-ink-caption">{words.caption}</span>
      </span>
      <Button variant="secondary" size="sm" disabled={disabled} onClick={onUse}>
        {words.act}
      </Button>
    </div>
  );
}
