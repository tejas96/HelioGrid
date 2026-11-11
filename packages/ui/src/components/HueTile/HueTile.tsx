import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { isCategoryHue } from '../Avatar/Avatar.logic';
import { HUE_TILE_GLYPH } from './HueTile.logic';
import type { HueTileProps } from './HueTile.types';

export function HueTile({ glyph, hue, size, stroke }: HueTileProps) {
  const category = isCategoryHue(hue);
  return (
    <span
      className={category ? 'hg-hue-tile hg-hue' : 'hg-hue-tile'}
      data-hue={category ? hue : undefined}
      data-tone={category ? undefined : hue}
      data-size={size}
      aria-hidden="true"
    >
      <svg
        aria-hidden="true"
        width={HUE_TILE_GLYPH[size]}
        height={HUE_TILE_GLYPH[size]}
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
