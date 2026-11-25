'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { IconButton, ShellGlyph, useFormat } from '@heliogrid/ui';

/**
 * Roofs (`T-M05-002`, part e): the stack of roofs, once one stands, with their count on its corner
 * in the accent, as the 3D switch's dot. While a roof waits to be checked, a small amber dot sits
 * on its other corner, as on that roof's row. A tap opens Roofs; a second tap closes it.
 */
export function StudioRoofsButton({
  studio,
  words,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const { panel, roofList, moves } = studio;
  const { count, waiting } = roofList;
  return (
    <span className="hg-studio-roofs-button">
      <IconButton
        label={words.roofsCount(count, waiting)}
        pressed={panel.open === 'roofs' || panel.open === 'picker'}
        onClick={moves.tapRoofs}
      >
        <ShellGlyph name="layers" size="md" />
      </IconButton>
      <span className="hg-studio-roofs-count" aria-hidden>
        {format.number(count)}
      </span>
      {waiting > 0 ? <span className="hg-studio-roofs-waits" aria-hidden /> : null}
    </span>
  );
}
