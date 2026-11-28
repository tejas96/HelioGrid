import type { StudioScreen } from '@heliogrid/data/react';
import { pointText } from './roof-marks-place';

/** A guide as drawn: a magnet's line across the map, faint when it does not pull, or an arm of
 * the pen's cross. */
export function StudioGuideLine({
  span: { from, to },
  kind,
}: {
  span: StudioScreen['guideSpans'][number];
  kind: 'held' | 'soft' | 'cross';
}) {
  const pts = `${pointText(from)};${pointText(to)}`;
  return <path key={`${kind};${pts}`} className="hg-roof-guide" data-kind={kind} data-pts={pts} />;
}
