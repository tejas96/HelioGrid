// @vitest-environment happy-dom

import { type SessionProjection, SKY_TICKET_HEADER, type SkyTilesWire } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { onlineManager, useQuery } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { queryKeys } from '../../src/cache/keys';
import { createDataLayer } from '../../src/data-layer';
import { useRepositories } from '../../src/react/context';
import { DataProvider } from '../../src/react/provider';
import { useSkyTiles } from '../../src/react/use-sky-tiles';
import { useTenantId } from '../../src/react/use-tenant-id';
import { listeningOrigin, refusal, send } from './origin-wire';

/**
 * A design's sky tiles through the real client (`packages/data/CLAUDE.md`, Done means): an origin
 * that gives the picture's facts with a new ticket each time they are asked for, and gives a tile
 * only for the ticket it gave last — as the api refuses a ticket that ran out.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DESIGN_ID = '01a50000-0000-7000-8000-000000000601';
const PUNE = { latitude: 18.5204, longitude: 73.8567 };
const KEY = { z: 19, x: 369_706, y: 234_673 };
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const TILE = /^\/designs\/[^/]+\/sky-tiles\/(\d+)\/(\d+)\/(\d+)$/;

const START = () => ({
  /** How many tickets were given: the last is `ticket-<given>`. */
  given: 0,
  /** What a tile answers instead of its picture, while set. */
  tileStatus: null as number | null,
  /** Every tile asked for: the ticket it was asked with. */
  tiles: [] as string[],
});
const origin = START();

const facts = (): SkyTilesWire => {
  origin.given += 1;
  return {
    kind: 'tiles',
    source: 'google',
    credit: 'Test imagery',
    metresPerPixel: 0.28,
    takenOn: null,
    ticket: `ticket-${origin.given}`,
    ticketUntil: new Date(Date.now() + 3_600_000).toISOString(),
    zoomMin: 16,
    zoomMax: 19,
    reach: { west: -300, east: 300, south: -300, north: 300 },
  };
};

const projection = () =>
  ({
    actor: {
      userId: '01a50000-0000-7000-8000-000000000002',
      phoneE164: '+919900000002',
      displayName: 'Asha Patil',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: {
      tenantId: '01a50000-0000-7000-8000-000000000001',
      roles: [FOUNDER_ROLE],
      authorizationVersion: 1,
    },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  }) as SessionProjection;

const served = listeningOrigin((req, res) => {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (path === '/auth/session') return send(res, req, 200, projection());
  if (path === `/designs/${DESIGN_ID}/sky-tiles`) return send(res, req, 200, facts());
  if (TILE.test(path)) {
    const ticket = String(req.headers[SKY_TICKET_HEADER] ?? '');
    origin.tiles.push(ticket);
    if (origin.tileStatus !== null) {
      return send(res, req, origin.tileStatus, refusal('SKY_TILE_UNAVAILABLE'));
    }
    if (ticket !== `ticket-${origin.given}`) return send(res, req, 403, refusal('FORBIDDEN'));
    res.writeHead(200, {
      'content-type': 'image/jpeg',
      'access-control-allow-origin': req.headers.origin ?? '*',
      'access-control-allow-credentials': 'true',
    });
    return res.end(JPEG);
  }
  return send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, START());
});

/** The hook as the studio mounts it: the picture's facts read once, the tiles asked through them. */
function mounted() {
  const layer = createDataLayer({ baseUrl: served.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(
    () => {
      const repositories = useRepositories();
      // As the studio reads it: once the session names the company, never before.
      const tenantId = useTenantId();
      const sky = useQuery({
        queryKey: [...queryKeys.studio.design(tenantId, DESIGN_ID), 'sky-tiles'],
        queryFn: ({ signal }) => repositories.studio.skyTiles(DESIGN_ID, signal),
        enabled: tenantId !== '',
        staleTime: Number.POSITIVE_INFINITY,
      });
      return useSkyTiles(DESIGN_ID, sky, PUNE);
    },
    { wrapper },
  );
}

async function ready() {
  const hook = mounted();
  await waitFor(() => expect(hook.result.current.tiles).not.toBeNull());
  const tiles = hook.result.current.tiles;
  if (tiles === null) throw new Error('no tiles');
  return { hook, tiles };
}

const live = () => new AbortController().signal;
/** Long enough for an answer the hook is waiting on to have come and been read. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

describe('a design’s sky tiles', () => {
  it('hands the ground the first picture’s tiles, the tiles a view needs, and a tile’s picture asked with the ticket', async () => {
    const { tiles } = await ready();
    expect(tiles.reach).toEqual({ west: -300, east: 300, south: -300, north: 300 });
    // The first picture: the coarsest zoom over the whole reach, each tile with its ground.
    expect(tiles.base.length).toBeGreaterThanOrEqual(1);
    expect(tiles.base.length).toBeLessThanOrEqual(9);
    expect(tiles.base.every((tile) => tile.key.z === 16)).toBe(true);
    // A screen whose pixel covers 5 cm asks for the finest zoom the site allows, under what it sees.
    const near = tiles.view({ west: -40, east: 40, south: -25, north: 25 }, 0.05);
    expect(near.zoom).toBe(19);
    const [first] = near.tiles;
    expect(first?.ground.east).toBeGreaterThan(first?.ground.west ?? Number.NaN);
    expect(near.tiles.some(({ ground }) => ground.west <= 0 && ground.east > 0)).toBe(true);
    // A screen whose pixel covers 2 m needs no more than the first picture.
    expect(tiles.view({ west: -300, east: 300, south: -300, north: 300 }, 2).zoom).toBe(16);
    expect(tiles.finestPixelMetres).toBeCloseTo(tiles.pixelMetres(19), 12);
    expect(tiles.pixelMetres(18)).toBeCloseTo(2 * tiles.pixelMetres(19), 12);
    const picture = await tiles.fetch(KEY, live());
    expect(picture).toBeInstanceOf(Blob);
    expect(picture?.size).toBe(JPEG.length);
    expect(origin.tiles).toEqual(['ticket-1']);
  });

  it('a ticket that ran out is asked for again, once for every tile it was refused, and the tiles come', async () => {
    const { hook, tiles } = await ready();
    // The api gave a newer ticket elsewhere: the one held is refused from now on.
    origin.given += 1;
    let pictures: (Blob | null)[] = [];
    await act(async () => {
      pictures = await Promise.all([1, 2, 3].map((x) => tiles.fetch({ ...KEY, x }, live())));
    });
    expect(pictures.every((picture) => picture instanceof Blob)).toBe(true);
    // Three refused with the old ticket, one renewal, three given with the new one.
    expect(origin.given).toBe(3);
    expect(origin.tiles.filter((ticket) => ticket === 'ticket-1')).toHaveLength(3);
    expect(origin.tiles.filter((ticket) => ticket === 'ticket-3')).toHaveLength(3);
    // The ground keeps the tiles it holds: the renewal hands it the same object.
    expect(hook.result.current.tiles).toBe(tiles);
  });

  it.each([
    ['a tile the map service does not hold', 404],
    ['a map service that does not answer', 503],
    ['a person past their tiles for the minute', 429],
  ])('%s is no picture, and no ticket is asked for again', async (_what, status) => {
    const { tiles } = await ready();
    origin.tileStatus = status;
    expect(await tiles.fetch(KEY, live())).toBeNull();
    expect(origin.given).toBe(1);
  });

  it('a tile no longer wanted is no picture', async () => {
    const { tiles } = await ready();
    const gone = new AbortController();
    gone.abort();
    expect(await tiles.fetch(KEY, gone.signal)).toBeNull();
  });

  it('a picture whose first tiles never came is lost, and is back only when a tile of it comes', async () => {
    const { hook, tiles } = await ready();
    const backOnline = () => {
      act(() => onlineManager.setOnline(false));
      act(() => onlineManager.setOnline(true));
    };
    expect(hook.result.current.lost).toBe(false);
    origin.tileStatus = 503;
    act(() => tiles.lost());
    expect(hook.result.current.lost).toBe(true);
    // The connection returns, but the map service still does not answer: one tile is tried, and
    // the picture stays lost — the studio does not flip back to a picture it cannot show.
    backOnline();
    await waitFor(() => expect(origin.tiles).toHaveLength(1));
    await settle();
    expect(hook.result.current.lost).toBe(true);
    // The service answers again: the next try brings a tile of the first picture, and it is back.
    origin.tileStatus = null;
    backOnline();
    await waitFor(() => expect(hook.result.current.lost).toBe(false));
    expect(origin.tiles).toHaveLength(2);
    expect(hook.result.current.tiles).toBe(tiles);
  });
});
