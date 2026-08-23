import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

interface MapPlaceLayerProps {
  onTap: (event: ReactMouseEvent<HTMLElement>) => void;
  /** A keyboard activation reports no coordinates, so it places the pin at the centre. */
  onKeyboardPlace: () => void;
}

/**
 * Tap-to-place — a touch addition, so it exists only where the directive puts it. It sits above
 * the tiles and BELOW the pin, the controls and the overlay: the overlay carries `MS1-18`'s
 * Confirm Location, and a placement layer stacked over it made the one button that consumes the
 * pending state untappable — the tap re-placed the pin instead.
 *
 * A `<button>` rather than the reference's bare `<div onClick>`: a surface a finger activates is
 * an activatable element, and this way the layer is reachable and announced. A keyboard
 * activation carries `detail === 0` and no coordinates, so it places at the centre.
 */
export function MapPlaceLayer({ onTap, onKeyboardPlace }: MapPlaceLayerProps) {
  return (
    <button
      type="button"
      className="hg-map-surface-place"
      aria-label="Place the pin — tap the map, or press Enter to place it at the centre"
      onClick={(event) => {
        if (event.detail === 0) {
          onKeyboardPlace();
          return;
        }
        onTap(event);
      }}
    />
  );
}

interface MapAttributionProps {
  words: string | null;
  node: ReactNode;
  hasOverlay: boolean;
}

/**
 * Attribution sits ON the 12px floor, deliberately. It stays quiet by COLOUR and POSITION —
 * `--text-tertiary`, bottom-right, outside the reading path — never by size: this product is a
 * mid-range Android phone on a roof in direct sunlight. Do not "fix" this back down to 10px.
 */
export function MapAttribution({ words, node, hasOverlay }: MapAttributionProps) {
  if (words === null && node === undefined) {
    return null;
  }
  return (
    <div className="hg-map-surface-attribution" data-overlay={hasOverlay ? 'true' : undefined}>
      {words === null ? null : <div>{words}</div>}
      {node === undefined ? null : <div>{node}</div>}
    </div>
  );
}
