import {
  type DesignDetail,
  type EditLead,
  IDEMPOTENCY_KEY_HEADER,
  type SaveSite,
} from '@heliogrid/contracts';
import { expect, type Page } from '@playwright/test';
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
