import { ShellGlyph } from '../AppShell/ShellGlyph';
import { isCategoryHue } from '../Avatar/Avatar.logic';
import { HUE_TILE_GLYPH } from './HueTile.logic';
import type { HueTileProps } from './HueTile.types';

export function HueTile({ glyph, hue, size }: HueTileProps) {
  const category = isCategoryHue(hue);
  return (
    <span
      className={category ? 'hg-hue-tile hg-hue' : 'hg-hue-tile hg-tone'}
      data-hue={category ? hue : undefined}
      data-tone={category ? undefined : hue}
      data-size={size}
      aria-hidden="true"
    >
      <ShellGlyph name={glyph} size={HUE_TILE_GLYPH[size]} tone="current" />
    </span>
  );
}
