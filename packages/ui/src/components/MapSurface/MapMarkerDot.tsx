import { Pressable } from '../../primitives/Pressable';
import type { MapMarker } from './MapSurface.types';
import { type MarkerWords, markerChipOf, markerLabel } from './map-placement';

/**
 * **A live position never looks like a stale one.** Live markers are filled and pulse;
 * last-known markers are hollow rings labelled "last seen 10:42 AM" — and the difference is in
 * the accessible name too, not only in the shape.
 */
export function MapMarkerDot({
  x = 50,
  y = 50,
  tone = 'accent',
  live = false,
  lastSeen,
  label,
  onClick,
  words,
}: MapMarker & { words: MarkerWords }) {
  const stale = !live;
  const chip = markerChipOf(label, live, lastSeen, words);
  return (
    <div className="hg-map-surface-marker" data-tone={tone} style={{ left: `${x}%`, top: `${y}%` }}>
      <Pressable
        className="hg-map-surface-marker-hit"
        accessibilityLabel={markerLabel(label, live, lastSeen, words)}
        onPress={onClick}
      >
        {live ? <span aria-hidden="true" className="hg-map-surface-pulse" /> : null}
        <span className="hg-map-surface-dot" data-live={live ? 'true' : undefined} />
      </Pressable>
      {chip === null ? null : (
        <span className="hg-map-surface-chip" data-stale={stale ? 'true' : undefined}>
          {chip}
        </span>
      )}
    </div>
  );
}
