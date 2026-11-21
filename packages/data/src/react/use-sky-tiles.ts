'use client';
import type { SkyTilesWire } from '@heliogrid/contracts';
import {
  type Coordinate,
  type GroundBox,
  type SkyTileKey,
  skyTileGround,
  skyTilePixelMetres,
  skyTilesInView,
  skyTileZoom,
} from '@heliogrid/domain';
import { onlineManager, type UseQueryResult } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';

/** One tile of a site's sky picture: its place in the grid, and the ground it lies on. */
export interface StudioSkyTile {
  readonly key: SkyTileKey;
  /** In metres east and north of the pin, as the picture lies. */
  readonly ground: GroundBox;
}

/**
 * A site's sky picture as the studio's ground asks for it. The ground draws; which tiles a view
 * needs, at which zoom, with which ticket, and what a tile that did not come means are decided
 * here, for the web and the phone alike.
 */
export interface StudioSkyTiles {
  /** The ground the picture may be fetched for, in metres from the pin. */
  readonly reach: GroundBox;
  /** The first picture: the few coarse tiles that cover the whole reach. */
  readonly base: readonly StudioSkyTile[];
  /** The ground one pixel of the picture's finest tile covers: a view opens at it. */
  readonly finestPixelMetres: number;
  /**
   * The tiles a view needs: those under the ground it sees, at the zoom a screen whose one pixel
   * covers `metresPerDevicePixel` can show — nearest the view's middle first, never past the reach.
   */
  view(
    seen: GroundBox,
    metresPerDevicePixel: number,
  ): { readonly zoom: number; readonly tiles: readonly StudioSkyTile[] };
  /** The ground one pixel of a tile covers at a zoom. */
  pixelMetres(zoom: number): number;
  /** One tile's picture; `null` when it is not to be had now — the ground keeps what it shows. */
  fetch(key: SkyTileKey, signal: AbortSignal): Promise<Blob | null>;
  /** Told when no tile of the first picture came: the site then has no picture to show. */
  lost(): void;
}

/** The ticket is asked for again this long before it runs out. */
const RENEW_BEFORE_MS = 120_000;
/** A renewal that is due at once still waits this long: a failing one is never a loop. */
const RENEW_AT_LEAST_MS = 30_000;
/** A picture whose first tiles never came is asked for again this often, and when the connection returns. */
const LOST_RETRY_MS = 30_000;
/** The api's answer to a ticket that ran out or is not its own. */
const TICKET_REFUSED = 403;

/**
 * The tiles of a design's sky picture, read with the ticket its facts came with. The ticket is
 * renewed before it runs out, and once more when a tile is refused for it; a tile that still does
 * not come is `null`, never an error the ground must handle. A picture whose first tiles never came
 * is lost only for now: one of them is asked for again in a while and when the connection returns,
 * so a studio opened in a bad patch of network gets its picture without a reload.
 */
export function useSkyTiles(
  designId: string,
  sky: UseQueryResult<SkyTilesWire>,
  pin: Coordinate | null,
): { readonly tiles: StudioSkyTiles | null; readonly lost: boolean } {
  const repositories = useRepositories();
  const facts = sky.data?.kind === 'tiles' ? sky.data : null;
  const ticket = useRef<string | null>(null);
  ticket.current = facts?.ticket ?? null;
  const [lost, setLost] = useState(false);

  const { refetch } = sky;
  const renewing = useRef<Promise<unknown> | null>(null);
  /** One renewal at a time: every tile refused for the old ticket waits for the same new one. */
  const renew = useCallback(() => {
    renewing.current ??= refetch()
      .then((answer) => {
        // Held at once: a tile waiting on this renewal asks again before the next render.
        if (answer.data?.kind === 'tiles') ticket.current = answer.data.ticket;
      })
      .finally(() => {
        renewing.current = null;
      });
    return renewing.current;
  }, [refetch]);

  const until = facts?.ticketUntil ?? null;
  useEffect(() => {
    if (until === null) return;
    const wait = Date.parse(until) - Date.now() - RENEW_BEFORE_MS;
    const timer = setTimeout(() => void renew(), Math.max(wait, RENEW_AT_LEAST_MS));
    return () => clearTimeout(timer);
  }, [until, renew]);

  const fetch = useCallback(
    async (key: SkyTileKey, signal: AbortSignal): Promise<Blob | null> => {
      const ask = () => {
        const held = ticket.current;
        return held === null ? null : repositories.studio.skyTile(designId, key, held, signal);
      };
      try {
        return await ask();
      } catch (error) {
        if (signal.aborted || !(error instanceof ApiError) || error.status !== TICKET_REFUSED) {
          return null;
        }
      }
      await renew();
      if (signal.aborted) return null;
      try {
        return await ask();
      } catch {
        return null;
      }
    },
    [repositories, designId, renew],
  );

  const zoomMin = facts?.zoomMin ?? null;
  const zoomMax = facts?.zoomMax ?? null;
  const { west, east, south, north } = facts?.reach ?? { west: 0, east: 0, south: 0, north: 0 };
  const latitude = pin?.latitude ?? null;
  const longitude = pin?.longitude ?? null;
  // Held on the facts' own values: a renewed ticket hands the ground the same tiles to keep.
  const tiles = useMemo<StudioSkyTiles | null>(() => {
    if (zoomMin === null || zoomMax === null || latitude === null || longitude === null) {
      return null;
    }
    const site = { latitude, longitude };
    const reach = { west, east, south, north };
    const laid = (key: SkyTileKey): StudioSkyTile => ({ key, ground: skyTileGround(site, key) });
    return {
      reach,
      base: skyTilesInView(site, reach, reach, zoomMin, zoomMin).tiles.map(laid),
      finestPixelMetres: skyTilePixelMetres(latitude, zoomMax),
      view: (seen, metresPerDevicePixel) => {
        const zoom = skyTileZoom(metresPerDevicePixel, latitude, { zoomMin, zoomMax });
        const wanted = skyTilesInView(site, seen, reach, zoom, zoomMin);
        return { zoom: wanted.zoom, tiles: wanted.tiles.map(laid) };
      },
      pixelMetres: (zoom) => skyTilePixelMetres(latitude, zoom),
      fetch,
      lost: () => setLost(true),
    };
  }, [zoomMin, zoomMax, west, east, south, north, latitude, longitude, fetch]);
  // A lost picture is tried again with one tile of the first picture, and is back only when that
  // tile comes: a studio whose tiles keep failing stays on its grid, and never flips to and fro.
  useEffect(() => {
    const first = tiles?.base[0]?.key;
    if (!lost || first === undefined) return;
    let live = true;
    const stop = new AbortController();
    const again = async () => {
      const came = await fetch(first, stop.signal);
      if (live && came !== null) setLost(false);
    };
    const timer = setInterval(() => void again(), LOST_RETRY_MS);
    const offline = onlineManager.subscribe((online) => online && void again());
    return () => {
      live = false;
      stop.abort();
      clearInterval(timer);
      offline();
    };
  }, [lost, tiles, fetch]);
  return { tiles, lost };
}
