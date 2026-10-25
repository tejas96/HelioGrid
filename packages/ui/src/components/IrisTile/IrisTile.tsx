import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { IrisTileProps } from './IrisTile.types';

export function IrisTile({ glyph, iris, size, stroke }: IrisTileProps) {
  return (
    <span className="hg-iris-tile hg-iris" data-iris={iris} data-size={size} aria-hidden="true">
      <svg
        aria-hidden="true"
        width={ICON_SIZE.md}
        height={ICON_SIZE.md}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={glyph} />
      </svg>
    </span>
  );
}
