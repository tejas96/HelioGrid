import { useId } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { FoldHeadProps } from './FoldHead.types';
import './FoldHead.css';

/** A card's head as its one toggle: name, standing, marks, and the chevron that turns open. */
export function FoldHead({ title, meta, aside, open, onToggle }: FoldHeadProps) {
  /* The name is the title and the standing as two words, never run together as one. */
  const titleId = useId();
  const metaId = useId();
  return (
    <button
      type="button"
      className="hg-fold-head"
      aria-expanded={open}
      aria-labelledby={meta === undefined ? titleId : `${titleId} ${metaId}`}
      onClick={onToggle}
    >
      <span id={titleId} className="hg-fold-head-title">
        {title}
      </span>
      {meta === undefined ? null : (
        <span id={metaId} className="hg-fold-head-meta">
          {meta}
        </span>
      )}
      {aside === undefined ? null : (
        <span className="hg-fold-head-aside" aria-hidden="true">
          {aside}
        </span>
      )}
      <span className="hg-fold-head-chevron" data-open={open ? 'true' : undefined}>
        <ShellGlyph name="caret-down" size="sm" tone="secondary" />
      </span>
    </button>
  );
}
