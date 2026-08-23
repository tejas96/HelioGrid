import type { MapAccuracy, MapGeofence, MapRoutePoint } from './MapSurface.types';
import { MAP_ACCENT, MAP_INFO } from './MapTokens';

interface MapVectorsProps {
  geofences: MapGeofence[];
  accuracy: MapAccuracy | null;
  route: MapRoutePoint[] | null;
}

/**
 * Geofences, the accuracy radius and the day route, all in percent coordinates over the tiles.
 * The accuracy circle is drawn whenever `accuracy` is given, so a 200 m fix never looks like a
 * pin on a doorstep.
 */
export function MapVectors({ geofences, accuracy, route }: MapVectorsProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="hg-map-surface-vectors"
    >
      {geofences.map((fence) => (
        <circle
          key={String(fence.id ?? `${fence.x}-${fence.y}-${fence.r}`)}
          cx={fence.x}
          cy={fence.y}
          r={fence.r}
          fill={MAP_ACCENT}
          fillOpacity="0.07"
          stroke={MAP_ACCENT}
          strokeOpacity="0.45"
          strokeWidth="0.4"
          strokeDasharray="1.6 1.2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {accuracy === null ? null : (
        <circle
          cx={accuracy.x}
          cy={accuracy.y}
          r={accuracy.r}
          fill={MAP_INFO}
          fillOpacity="0.10"
          stroke={MAP_INFO}
          strokeOpacity="0.5"
          strokeWidth="0.4"
          strokeDasharray="1.4 1.2"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {route !== null && route.length > 1 ? (
        <polyline
          points={route.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={MAP_ACCENT}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.85"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
