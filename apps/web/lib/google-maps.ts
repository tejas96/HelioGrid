/**
 * Google's Maps JavaScript, loaded once and only when a page first draws a map: the script is the
 * provider's own, added to the page with the browser key, and the few parts of its API this app
 * uses are named here — the map under a pin, its centre and its listeners — so no screen reaches
 * for the global.
 */
export interface MapPoint {
  readonly lat: number;
  readonly lng: number;
}

interface LatLng {
  lat(): number;
  lng(): number;
}

export interface LiveMap {
  getCenter(): LatLng | undefined;
  setCenter(point: MapPoint): void;
  panTo(point: MapPoint): void;
  addListener(
    name: 'idle' | 'click',
    heard: (event?: { readonly latLng?: LatLng | null }) => void,
  ): { remove(): void };
}

export interface MapsApi {
  readonly Map: new (holder: HTMLElement, options: Record<string, unknown>) => LiveMap;
}

const SCRIPT = 'https://maps.googleapis.com/maps/api/js';
const READY = '__heliogridMapsReady';

let loading: Promise<MapsApi> | null = null;
const refusedHeard = new Set<() => void>();

/**
 * Hears the provider refuse the key (wrong, or not allowed on this address): its script loads and
 * a map is made, then it draws its own error tile and calls `gm_authFailure`. Each live map is
 * told, so it can say it did not load; the load is forgotten, so a retry asks again.
 */
export function onMapsRefused(heard: () => void): () => void {
  refusedHeard.add(heard);
  return () => {
    refusedHeard.delete(heard);
  };
}

/** The maps API, loading it on the first ask; a failed load is forgotten, so a retry asks again. */
export function loadGoogleMaps(key: string): Promise<MapsApi> {
  loading ??= new Promise<MapsApi>((resolve, reject) => {
    const holder = window as unknown as Record<string, unknown>;
    const failed = () => {
      loading = null;
      reject(new Error('the map script did not load'));
    };
    holder.gm_authFailure = () => {
      loading = null;
      for (const heard of refusedHeard) heard();
    };
    holder[READY] = () => {
      const maps = (holder.google as { maps?: MapsApi } | undefined)?.maps;
      if (maps === undefined) failed();
      else resolve(maps);
    };
    const query = new URLSearchParams({ key, v: 'weekly', loading: 'async', callback: READY });
    const script = document.createElement('script');
    script.src = `${SCRIPT}?${query.toString()}`;
    script.async = true;
    script.onerror = failed;
    document.head.append(script);
  });
  return loading;
}
