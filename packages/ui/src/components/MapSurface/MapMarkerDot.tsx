import { Pressable } from '../../primitives/Pressable';
import type { MapMarker } from './MapSurface.types';
import { markerLabel } from './map-placement';

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
}: MapMarker) {
  const stale = !live;
  const chip = label !== undefined || (stale && lastSeen !== undefined);
  return (
    <div className="hg-map-surface-marker" data-tone={tone} style={{ left: `${x}%`, top: `${y}%` }}>
      <Pressable
        className="hg-map-surface-marker-hit"
        accessibilityLabel={markerLabel(label, live, lastSeen)}
        onPress={onClick}
      >
        {live ? <span aria-hidden="true" className="hg-map-surface-pulse" /> : null}
        <span className="hg-map-surface-dot" data-live={live ? 'true' : undefined} />
      </Pressable>
      {chip ? (
        <span className="hg-map-surface-chip" data-stale={stale ? 'true' : undefined}>
          {label}
          {stale && lastSeen !== undefined ? ` · last seen ${lastSeen}` : ''}
        </span>
      ) : null}
    </div>
  );
}
