'use client';
import type { SiteDetailsScreen } from '@heliogrid/data/react';
import type { Coordinate } from '@heliogrid/domain';
import { type ReactNode, useEffect, useRef } from 'react';
import { GOOGLE_MAPS_KEY } from '../../../lib/env';
import { type LiveMap, loadGoogleMaps, onMapsRefused } from '../../../lib/google-maps';

/** Close enough for a roof to fill the map, as the satellite picture allows. */
const ROOF_ZOOM = 19;
/** Two points are one where they agree to the six decimals a pin is stored at. */
const SAME_WITHIN = 0.0000005;

/** Shops and stops are hidden: over a roof they cover the house the pin is for. Roads keep their names. */
const QUIET_LABELS = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const same = (left: Coordinate, right: Coordinate): boolean =>
  Math.abs(left.latitude - right.latitude) < SAME_WITHIN &&
  Math.abs(left.longitude - right.longitude) < SAME_WITHIN;

/**
 * The live map under the pin. The pin is the map's centre: the person drags the map, or clicks a
 * roof to bring it under the pin, and where the map comes to rest is reported as the pin. A pin
 * set from outside — a found place, *Put it back* — moves the map to it. The site map page draws
 * the same tiles for a phone's web view.
 */
export function SiteMapTiles({
  pin,
  onMove,
  onFailed,
  mapKey,
  shown = 0,
  touch = false,
  whole = false,
}: {
  pin: Coordinate;
  /** Counts the times the map is told the pin again though the pin did not change (a refused move). */
  shown?: number;
  onMove: (point: Coordinate) => void;
  onFailed: () => void;
  mapKey: string;
  /** Shown in a phone's web view: no keyboard is there, so the map's key help is left out. */
  touch?: boolean;
  /**
   * The big map, where moving the map is the whole job: one finger moves it. In the form's small
   * map one finger scrolls the page and two move the map — Google says so on the map — so a person
   * scrolling the form never moves the pin by mistake.
   */
  whole?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const live = useRef<LiveMap | null>(null);
  const latest = useRef({ pin, onMove, onFailed });
  latest.current = { pin, onMove, onFailed };

  useEffect(() => {
    let gone = false;
    const heard: { remove(): void }[] = [];
    const unhear = onMapsRefused(() => {
      if (!gone) latest.current.onFailed();
    });
    void loadGoogleMaps(mapKey).then(
      (maps) => {
        const element = holder.current;
        if (gone || element === null) return;
        const at = latest.current.pin;
        const map = new maps.Map(element, {
          center: { lat: at.latitude, lng: at.longitude },
          zoom: ROOF_ZOOM,
          mapTypeId: 'hybrid',
          styles: QUIET_LABELS,
          disableDefaultUI: true,
          keyboardShortcuts: !touch,
          gestureHandling: whole ? 'greedy' : 'cooperative',
          clickableIcons: false,
          tilt: 0,
        });
        live.current = map;
        heard.push(
          map.addListener('idle', () => {
            const centre = map.getCenter();
            if (centre === undefined) return;
            const point = { latitude: centre.lat(), longitude: centre.lng() };
            if (!same(point, latest.current.pin)) latest.current.onMove(point);
          }),
          map.addListener('click', (event) => {
            const picked = event?.latLng;
            if (picked != null) map.panTo({ lat: picked.lat(), lng: picked.lng() });
          }),
        );
      },
      () => {
        if (!gone) latest.current.onFailed();
      },
    );
    return () => {
      gone = true;
      unhear();
      for (const one of heard) one.remove();
      live.current = null;
    };
  }, [mapKey, touch, whole]);

  const { latitude, longitude } = pin;
  const told = useRef(shown);
  useEffect(() => {
    told.current = shown;
    const map = live.current;
    const centre = map?.getCenter();
    if (map === null || centre === undefined) return;
    const rests = { latitude: centre.lat(), longitude: centre.lng() };
    if (!same(rests, { latitude, longitude })) map.setCenter({ lat: latitude, lng: longitude });
  }, [latitude, longitude, shown]);

  return <div ref={holder} className="hg-studio-map-tiles" />;
}

/**
 * The map slot's tiles on the web: the live map while the screen's hook says one is drawn. With
 * no browser key, or after a load that failed, there are none and the frame shows what the hook's
 * `map.read` says — its neutral grid, or that the map did not load.
 */
export function sitePinTilesOf(
  pin: Coordinate | null,
  onMove: (point: Coordinate) => void,
  map: SiteDetailsScreen['map'],
): ReactNode | null {
  if (GOOGLE_MAPS_KEY === undefined || pin === null || !map.live) return null;
  // The map draws under its own grey until its tiles arrive: the frame shows it at once.
  return (
    <SiteMapTiles
      key={map.attempt}
      pin={pin}
      onMove={onMove}
      onFailed={map.loadFailed}
      mapKey={GOOGLE_MAPS_KEY}
      shown={map.shown}
      whole={map.big}
    />
  );
}
