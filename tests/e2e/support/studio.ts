import {
  type DesignDetail,
  type EditLead,
  IDEMPOTENCY_KEY_HEADER,
  type SaveSite,
  SKY_TICKET_HEADER,
  type SkyTilesWire,
} from '@heliogrid/contracts';
import { expect, type Page, type Route } from '@playwright/test';
import { API } from './api-log';
import { leadSiteBody, SITE_POINT } from './studio-flow';

/*
 * The studio specs' way to a design (`T-M05-001`). A new company is empty, so a spec that is not
 * about *Create design* makes its design through the api under the owner's own session;
 * `designs-[id]-site.spec.ts` presses the lead page's own button.
 */

export { LEAD_SITE, LEAD_SITE_STATE, SITE_POINT, SITE_POINT_TEXT } from './studio-flow';

/**
 * The map service is down from here on: the place search and the map's own script get no answer.
 * A suite reaches no third party, and Site details must still start a design from typed
 * coordinates.
 */
export async function withoutMapService(page: Page): Promise<void> {
  await page.route('**/places/**', (route) => route.abort());
  await page.route('https://maps.googleapis.com/**', (route) => route.abort());
}

/** One grey pixel as a sky tile travels: a JPEG. */
const SKY_TILE = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwAooooA/9k=',
  'base64',
);

/** A site's sky picture as the api gives its facts: a credit a flow can read, and a ticket. */
export const SKY_TILES = {
  kind: 'tiles',
  source: 'google',
  credit: 'Imagery © the flow’s own sky',
  metresPerPixel: 0.28,
  takenOn: null,
  ticket: 'the-flows-ticket',
  ticketUntil: '2099-01-01T00:00:00.000Z',
  zoomMin: 16,
  zoomMax: 19,
  reach: { west: -300, east: 300, south: -300, north: 300 },
} as const satisfies SkyTilesWire;

/** A tile a flow's studio asked for: the ticket it was asked with, and its zoom. */
export interface AskedSkyTile {
  readonly ticket: string;
  readonly zoom: number;
}

/**
 * The site has a sky picture, whatever map service the api runs with: its facts are `SKY_TILES`,
 * and every tile is one grey pixel. `tiles` says which come: all, only the first, coarsest
 * picture's, or none. Answers the tiles the studio asked for, in the order it asked. A suite
 * reaches no third party.
 */
export async function withSkyPicture(
  page: Page,
  tiles: 'come' | 'only the first picture comes' | 'never come',
): Promise<AskedSkyTile[]> {
  const asked: AskedSkyTile[] = [];
  /* Answered here, never by the api, so the answer needs the api's own leave for the page to read
     it. A tile the studio stopped waiting for cannot be answered: that one is let go. */
  const fromTheApi = (route: Route) => ({
    'access-control-allow-origin': route.request().headers().origin ?? '*',
    'access-control-allow-credentials': 'true',
  });
  await page.route('**/designs/*/sky-tiles', (route) =>
    route.fulfill({ json: SKY_TILES, headers: fromTheApi(route) }),
  );
  await page.route('**/designs/*/sky-tiles/*/*/*', async (route) => {
    const [zoom = ''] = new URL(route.request().url()).pathname.split('/').slice(-3);
    const tile = { ticket: route.request().headers()[SKY_TICKET_HEADER] ?? '', zoom: Number(zoom) };
    asked.push(tile);
    const comes =
      tiles === 'come' ||
      (tiles === 'only the first picture comes' && tile.zoom === SKY_TILES.zoomMin);
    const answered = comes
      ? route.fulfill({ contentType: 'image/jpeg', body: SKY_TILE, headers: fromTheApi(route) })
      : route.abort();
    await answered.catch(() => undefined);
  });
  return asked;
}

/** "Design 1" of the lead, empty, as *Create design* sends it. */
export async function startDesignThroughApi(page: Page, leadId: string): Promise<DesignDetail> {
  const answer = await page.request.post(`${API}/leads/${leadId}/designs`, {
    data: { copyOf: null, capturedAt: new Date().toISOString() },
    headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
  });
  expect(answer.status()).toBe(201);
  return (await answer.json()) as DesignDetail;
}

/** The design's site saved with the roof's point and nothing else, as *Start design* sends it. */
export async function saveSiteThroughApi(page: Page, designId: string): Promise<void> {
  const body: SaveSite = {
    name: null,
    address: null,
    pin: SITE_POINT,
    area: null,
    utilityOperator: null,
    supplyPhase: null,
    sanctionedLoadKw: null,
    mount: 'roof',
    capturedAt: new Date().toISOString(),
  };
  const answer = await page.request.put(`${API}/designs/${designId}/site`, { data: body });
  expect(answer.status()).toBe(200);
}

/** The lead's site facts saved as the lead page's own edit sends them. */
export async function saveLeadSiteThroughApi(page: Page, leadId: string): Promise<void> {
  const body = leadSiteBody() as EditLead;
  const answer = await page.request.patch(`${API}/leads/${leadId}`, { data: body });
  expect(answer.status()).toBe(200);
}
