import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { HueTileProps } from './HueTile.types';

export function HueTile({ glyph, hue, size, stroke }: HueTileProps) {
  return (
    <span className="hg-hue-tile hg-hue" data-hue={hue} data-size={size} aria-hidden="true">
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
