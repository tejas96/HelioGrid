import { useId } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { FoldHeadProps } from './FoldHead.types';
import './FoldHead.css';
import { Text } from '../../primitives/Text/Text';

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
      <span id={titleId}>
        {/* A button holds only phrasing content: the title looks like the card title, without the heading. */}
        <Text variant="h3" as="span">
          {title}
        </Text>
      </span>
      {meta === undefined ? null : (
        <span id={metaId}>
          <Text variant="caption" color="secondary">
            {meta}
          </Text>
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
