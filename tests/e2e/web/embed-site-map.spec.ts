import {
  readSiteMapMessage,
  SITE_MAP_BRIDGE_VERSION,
  type SiteMapSaid,
  type SiteMapShow,
  siteMapSaidSchema,
} from '@heliogrid/contracts';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { SITE_POINT, withoutMapService } from '../support/studio';

/**
 * `/embed/site-map` (`SCR-M05-01`, T-M05-001a): the map under the pin, as a phone's web view shows
 * it. The page opens with no session and speaks only the bridge's messages. It speaks first —
 * ready for a point, or unavailable where no map key is set — and with the map service down it
 * says `failed`, so the app can offer the retry; it never reports a move it did not see. Which
 * messages each side drops is the bridge's own test (`packages/contracts/tests/site-map-bridge.test.ts`).
 */

/** A phone's web view stands in: what the page says is kept on the window for the flow to read. */
async function asWebView(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const said: string[] = [];
    Object.assign(window, {
      said,
      ReactNativeWebView: { postMessage: (text: string) => said.push(text) },
    });
  });
}

/** Each message the page has said so far, as its host reads them. */
async function saidBy(page: Page): Promise<SiteMapSaid['kind'][]> {
  const texts = await page.evaluate(() => (window as unknown as { said: string[] }).said);
  return texts.flatMap((text) => {
    const message = readSiteMapMessage(siteMapSaidSchema, text);
    return message === null ? [] : [message.kind];
  });
}

test('the site map page speaks first, and never draws or moves a map it could not load', async ({
  page,
}) => {
  await withoutMapService(page);
  await asWebView(page);
  await page.goto('/embed/site-map');

  /* The page speaks first: ready for a point, or unavailable where it has no map to draw. */
  await expect.poll(() => saidBy(page)).not.toHaveLength(0);
  const [first] = await saidBy(page);
  expect(['ready', 'unavailable']).toContain(first);
  await expectNoSeriousViolations(page);

  /* The host answers with the point. The map service is down, so no map is drawn or moved. */
  const show: SiteMapShow = { v: SITE_MAP_BRIDGE_VERSION, kind: 'show', point: SITE_POINT };
  await page.evaluate((message) => window.postMessage(JSON.stringify(message), '*'), show);
  if (first === 'ready') await expect.poll(() => saidBy(page)).toContain('failed');
  else expect(await saidBy(page)).not.toContain('failed');
  expect(await saidBy(page)).not.toContain('moved');
});
