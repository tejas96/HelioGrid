'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { RoofSheetView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';

/**
 * The roof sheet's one line on the height map (`T-M05-002`, part g, board G21 and G22): where its
 * read was unclear, and while the height view is on, how far the map sits above or below the
 * roof at the height in hand — with the amber dot, as every line that asks a look does.
 */
export function StudioSheetFit({
  studio,
  sheet,
  words,
}: {
  studio: StudioScreen;
  sheet: RoofSheetView;
  words: StudioCanvasWords;
}) {
  if (!sheet.hasHeight) return null;
  const fit = studio.site.fitOf(sheet.roof, sheet.height.metres);
  if (fit === null) return null;
  return (
    <p className="hg-sheet-check" data-fit={fit.line}>
      <span className="hg-sheet-dot" aria-hidden="true" />
      {words.siteFit(fit.line)}
    </p>
  );
}
