'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { IconButton, ShellGlyph } from '@heliogrid/ui';

/**
 * The pencil (`T-M05-002`, part e): a tap draws a roof — what is open closes first. While a roof is
 * drawn it turns into a filled × in its own place, the way out of drawing, and a tap stops. Roofs has
 * its own button (`StudioRoofsButton`).
 */
export function StudioPencil({
  studio,
  words,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  const stop = studio.pencil === 'stop';
  return (
    <IconButton
      label={stop ? words.stopDrawing : words.drawRoof}
      variant={stop ? 'dark' : 'surface'}
      pressed={stop}
      onClick={studio.moves.tapPencil}
    >
      <ShellGlyph name={stop ? 'close' : 'pencil'} size="md" />
    </IconButton>
  );
}
