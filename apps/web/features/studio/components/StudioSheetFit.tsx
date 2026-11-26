'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofSheetView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';

/**
 * The roof sheet's one line on the height map (`T-M05-002`, part g, board G21 and G22): where its
 * read was unclear, and while the height view is on, how far the map sits above or below the
 * roof at the height in hand — with the amber dot, as every line that asks a look does.
 */
export function StudioSheetFit({
  studio,
  sheet,
  units,
  words,
}: {
  studio: StudioScreen;
  sheet: RoofSheetView;
  units: MeasurementSystem;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  if (!sheet.hasHeight) return null;
  const fit = studio.site.fitOf(sheet.roof, sheet.height.metres);
  if (fit === null) return null;
  const heightOf = (metres: number) => format.roofHeight(metres, units);
  return (
    <p className="hg-sheet-check" data-fit={fit.line}>
      <span className="hg-sheet-dot" aria-hidden="true" />
      {words.siteFit(fit.line, heightOf(fit.mapM), heightOf(Math.abs(fit.byM)))}
    </p>
  );
}
