import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
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
        <svg
          viewBox="0 0 24 24"
          width={ICON_SIZE.md}
          height={ICON_SIZE.md}
          fill="none"
          stroke="currentColor"
          strokeWidth={glyphStroke('md')}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name="board" />
        </svg>
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
