import {
  createTranslator,
  leadDockWords,
  siteDetailsPageWords,
  siteDetailsWords,
  studioCanvasWords,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { abortWrites } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { CUSTOMER, captureLead, ownerWithCompany } from '../support/project';
import {
  LEAD_SITE,
  LEAD_SITE_STATE,
  SITE_POINT,
  SITE_POINT_TEXT,
  saveLeadSiteThroughApi,
  withoutMapService,
} from '../support/studio';

/**
 * `/designs/<id>/site` (`SCR-M05-01`, T-M05-001a): a rep at the customer's house taps *Create
 * design* on the lead and lands on Site details with the lead's facts filled. *Start design* is
 * off until a location is set. With the map service down, typed coordinates still set the pin and
 * start the design; wrong coordinates are refused with the reason; a save that fails says so and
 * keeps the form.
 */
const en = await createTranslator('en');
const DOCK = leadDockWords(en.t);
const PAGE = siteDetailsPageWords(en.t);
const SITE = siteDetailsWords(en.t, false);
const STUDIO = studioCanvasWords(en.t);

const SITE_PATH = /\/designs\/[0-9a-f-]{36}\/site$/;
const DESIGN_PATH = /\/designs\/[0-9a-f-]{36}$/;

/** The lead page's *Create design*, pressed: Site details of the new "Design 1". */
async function createDesignFromLead(page: Page): Promise<void> {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  await saveLeadSiteThroughApi(page, leadId);
  await withoutMapService(page);
  await page.goto(`/leads/${leadId}`);
  await page.getByRole('button', { name: DOCK.design.label }).first().click();
  await expect(page).toHaveURL(SITE_PATH);
  await expect(page.getByRole('heading', { name: PAGE.title })).toBeVisible();
}

/** The two numbers typed in the Coordinates fields and read with Enter, as a rep does. */
async function typeCoordinates(page: Page, latitude: string, longitude: string): Promise<void> {
  await page.getByRole('radio', { name: SITE.modes.coordinates }).click();
  await page.getByRole('textbox', { name: SITE.latitude }).fill(latitude);
  await page.getByRole('textbox', { name: SITE.longitude }).fill(longitude);
  await page.getByRole('textbox', { name: SITE.longitude }).press('Enter');
}

test('Create design opens Site details with the lead filled, and typed coordinates start the design', async ({
  page,
}) => {
  await createDesignFromLead(page);

  /* The lead's own facts are there: the site is named for the customer, on a roof, and its
     address, state, supply phase and sanctioned load are the ones the lead holds. */
  await expect(page.getByRole('textbox', { name: SITE.name })).toHaveValue(CUSTOMER.name);
  await expect(page.getByRole('radio', { name: SITE.mounts.roof })).toBeChecked();
  await expect(page.getByRole('textbox', { name: SITE.address })).toHaveValue(LEAD_SITE.address);
  await expect(page.getByRole('combobox', { name: SITE.state })).toContainText(LEAD_SITE_STATE);
  await expect(page.getByRole('radio', { name: SITE.phases[LEAD_SITE.supplyPhase] })).toBeChecked();
  await expect(page.getByRole('textbox', { name: SITE.load })).toHaveValue(
    String(LEAD_SITE.sanctionedLoadKw),
  );
  await expectNoSeriousViolations(page);
  await expectNoSidewaysScroll(page);

  /* No location yet: the design cannot start, and the bar says why. */
  const start = page.getByRole('button', { name: SITE.start });
  await expect(start).toBeDisabled();
  await expect(page.getByText(SITE.needsLocation)).toBeVisible();

  /* A latitude past the pole is refused with the reason, and sets no pin. */
  await typeCoordinates(page, '91', String(SITE_POINT.longitude));
  await expect(page.getByText(SITE.fault.out_of_range)).toBeVisible();
  await expect(start).toBeDisabled();

  /* The right numbers set the pin with the search down, and the bar says what comes next. */
  await typeCoordinates(page, String(SITE_POINT.latitude), String(SITE_POINT.longitude));
  await expect(page.getByText(SITE_POINT_TEXT)).toBeVisible();
  await expect(page.getByText(SITE.next.roof)).toBeVisible();
  await expect(start).toBeEnabled();

  /* Start design saves the site and opens the design's own page. */
  await start.click();
  await expect(page).toHaveURL(DESIGN_PATH);
  /* The site has its place, so the studio opens on it: with no roof and no sky picture, on the
     size card that makes the first roof. */
  await expect(page.getByRole('form', { name: STUDIO.sizeTitle })).toBeVisible();
});

test('a site that does not save says so and keeps what was typed', async ({ page }) => {
  await createDesignFromLead(page);
  await typeCoordinates(page, String(SITE_POINT.latitude), String(SITE_POINT.longitude));
  await expect(page.getByText(SITE_POINT_TEXT)).toBeVisible();

  await abortWrites(page, '**/designs/*/site');
  await page.getByRole('button', { name: SITE.start }).click();
  await expect(page.getByText(PAGE.saveFailed('other'))).toBeVisible();
  await expect(page).toHaveURL(SITE_PATH);
  await expect(page.getByText(SITE_POINT_TEXT)).toBeVisible();
});
