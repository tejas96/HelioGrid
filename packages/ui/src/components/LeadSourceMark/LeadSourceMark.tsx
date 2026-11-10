import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { sourceGlyphOf } from './LeadSourceMark.logic';
import type { LeadSourceMarkProps } from './LeadSourceMark.types';

interface WebLeadSourceMarkProps extends LeadSourceMarkProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Where an enquiry came from (`M02-13`): the source's glyph and its word, or the glyph alone with
 * the word as its name — never a glyph a screen reader cannot name.
 */
export function LeadSourceMark({
  source,
  label,
  form = 'word',
  className,
  style,
}: WebLeadSourceMarkProps) {
  const glyph = <ShellGlyph name={sourceGlyphOf(source)} size="sm" tone="secondary" />;
  const frame = classNames('hg-lead-source', className);
  if (form === 'glyph') {
    return (
      <span className={frame} role="img" aria-label={label} title={label} style={style}>
        {glyph}
      </span>
    );
  }
  return (
    <span className={frame} style={style}>
      {glyph}
      <span className="hg-lead-source-word">{label}</span>
    </span>
  );
}
