import { StyleSheet } from 'react-native';
import { Circle, Polyline, Svg } from 'react-native-svg';
import type { MapAccuracy, MapGeofence, MapRoutePoint } from './MapSurface.types';
import { MAP_ACCENT, MAP_INFO } from './MapTokens.native';

interface MapVectorsProps {
  geofences: MapGeofence[];
  accuracy: MapAccuracy | null;
  route: MapRoutePoint[] | null;
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});

/**
 * Geofences, the accuracy radius and the day route, all in percent coordinates over the tiles.
 * The accuracy circle is drawn whenever `accuracy` is given, so a 200 m fix never looks like a
 * pin on a doorstep.
 *
 * RN has no `vector-effect`, so stroke widths scale with the non-uniform viewBox the way the
 * shapes do; the widths below are chosen against the same 0–100 space the web half uses.
 */
export function MapVectors({ geofences, accuracy, route }: MapVectorsProps) {
  return (
    <Svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      style={styles.layer}
      pointerEvents="none"
    >
      {geofences.map((fence) => (
        <Circle
          key={String(fence.id ?? `${fence.x}-${fence.y}-${fence.r}`)}
          cx={fence.x}
          cy={fence.y}
          r={fence.r}
          fill={MAP_ACCENT}
          fillOpacity={0.07}
          stroke={MAP_ACCENT}
          strokeOpacity={0.45}
          strokeWidth={0.4}
          strokeDasharray={[1.6, 1.2]}
        />
      ))}
      {accuracy === null ? null : (
        <Circle
          cx={accuracy.x}
          cy={accuracy.y}
          r={accuracy.r}
          fill={MAP_INFO}
          fillOpacity={0.1}
          stroke={MAP_INFO}
          strokeOpacity={0.5}
          strokeWidth={0.4}
          strokeDasharray={[1.4, 1.2]}
        />
      )}
      {route !== null && route.length > 1 ? (
        <Polyline
          points={route.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={MAP_ACCENT}
          strokeWidth={0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.85}
        />
      ) : null}
    </Svg>
  );
}
