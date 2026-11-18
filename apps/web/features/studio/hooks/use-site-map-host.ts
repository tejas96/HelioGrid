'use client';
import {
  type GeoPoint,
  readSiteMapMessage,
  SITE_MAP_BRIDGE_VERSION,
  type SiteMapSaid,
  siteMapShowSchema,
} from '@heliogrid/contracts';
import { useEffect, useSyncExternalStore } from 'react';

/** What a phone's web view gives the page it shows: the way to send its app one line of text. */
interface NativeHost {
  postMessage(text: string): void;
}

/** One message to the app that shows this page. A plain browser tab has no host, and nothing is said. */
function say(message: SiteMapSaid): void {
  const host = (window as { ReactNativeWebView?: NativeHost }).ReactNativeWebView;
  host?.postMessage(JSON.stringify(message));
}

export interface SiteMapHost {
  /** The point the host asked the map to show; `null` until its first message. */
  readonly point: GeoPoint | null;
  /** The map came to rest at a new centre. */
  moved(point: GeoPoint): void;
  /** The map did not load. */
  failed(): void;
}

/** The point the host last asked for. The page has one map, so one value holds it. */
let shown: GeoPoint | null = null;

/**
 * Listens for the host's messages. Android's web view delivers a message on the document, iOS's on
 * the window: the page listens on both.
 */
function listen(changed: () => void): () => void {
  const heard = (event: Event) => {
    const show = readSiteMapMessage(siteMapShowSchema, (event as MessageEvent).data);
    if (show === null) return;
    shown = show.point;
    changed();
  };
  window.addEventListener('message', heard);
  document.addEventListener('message', heard);
  return () => {
    window.removeEventListener('message', heard);
    document.removeEventListener('message', heard);
  };
}

/**
 * The site map page's line to its host (`site-map-bridge.ts`): it says `ready`, takes the point
 * each `show` names, and reports where the map rests. `drawable` is false where this page has no
 * map to draw, and the host is told so at once: nothing failed, and a retry would not help.
 */
export function useSiteMapHost(drawable: boolean): SiteMapHost {
  const point = useSyncExternalStore(
    listen,
    () => shown,
    () => null,
  );
  // Said after the listener above is on: the host answers `ready` with the point.
  useEffect(() => {
    say({ v: SITE_MAP_BRIDGE_VERSION, kind: drawable ? 'ready' : 'unavailable' });
  }, [drawable]);
  return {
    point,
    moved: (at) => say({ v: SITE_MAP_BRIDGE_VERSION, kind: 'moved', point: at }),
    failed: () => say({ v: SITE_MAP_BRIDGE_VERSION, kind: 'failed' }),
  };
}
