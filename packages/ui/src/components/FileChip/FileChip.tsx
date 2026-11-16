import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import type { FileChipProps } from './FileChip.types';
import './FileChip.css';

interface WebFileChipProps extends FileChipProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * One chosen file, named: a sheet glyph, the file's name on one line (it is data, so it is cut, not
 * wrapped), what was read in it or what went wrong, and *Replace* when the caller offers it.
 * `wide` sets the glyph in its own tile. The glyph is decoration; the name says what the file is.
 */
export function FileChip({
  name,
  meta,
  tone = 'read',
  layout = 'compact',
  onReplace,
  replaceLabel,
  className,
  style,
}: WebFileChipProps) {
  return (
    <div className={classNames('hg-file-chip', className)} data-layout={layout} style={style}>
      <span className="hg-file-chip-glyph">
        <ShellGlyph name="board" size="md" tone="current" />
      </span>
      <span className="hg-file-chip-words">
        <span className="hg-file-chip-name">{name}</span>
        <span className="hg-file-chip-meta" data-tone={tone}>
          {meta}
        </span>
      </span>
      {onReplace !== undefined && replaceLabel !== undefined ? (
        <Button variant="ghost" size="sm" onClick={onReplace}>
          {replaceLabel}
        </Button>
      ) : null}
    </div>
  );
}
