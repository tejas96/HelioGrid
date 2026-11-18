import {
  createTranslator,
  designPageWords,
  leadDesignsWords,
  leadSectionsWords,
  siteDetailsPageWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { captureLead, ownerWithCompany } from '../support/project';
import {
  SITE_POINT_TEXT,
  saveSiteThroughApi,
  startDesignThroughApi,
  withoutMapService,
} from '../support/studio';

/**
 * `/designs/<id>` (`SCR-M05-02`, T-M05-001a): where the studio opens. Until the roof step is
 * built the page names the design, says what comes next, and leads to Site details. The lead's
 * Designs section holds the design's card, and Continue opens this page. A design that is not the
 * reader's says so and offers the way back.
 */
const en = await createTranslator('en');
const DESIGN = designPageWords(en.t);
const PAGE = siteDetailsPageWords(en.t);
const SECTIONS = leadSectionsWords(en.t);
const DESIGNS = leadDesignsWords(en.t, { ago: String, readerId: null });

test('a design opens on its own page, and Site details is one press away', async ({ page }) => {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  const { design } = await startDesignThroughApi(page, leadId);
  await withoutMapService(page);

  /* No location yet: the page asks for it before anything is drawn. */
  await page.goto(`/designs/${design.id}`);
  await expect(page.getByRole('heading', { name: DESIGN.named(design.ordinal) })).toBeVisible();
  await expect(page.getByText(DESIGN.holdingTitle)).toBeVisible();
  await expect(page.getByText(DESIGN.holdingLine('roof', false))).toBeVisible();
  await expectNoSeriousViolations(page);
  await expectNoSidewaysScroll(page);

  /* With the site saved the page names the next step, and Site details shows the saved pin. */
  await saveSiteThroughApi(page, design.id);
  await page.reload();
  await expect(page.getByText(DESIGN.holdingLine('roof', true))).toBeVisible();
  await page.getByRole('button', { name: DESIGN.editSite }).click();
  await expect(page.getByRole('heading', { name: PAGE.title })).toBeVisible();
  await expect(page.getByText(SITE_POINT_TEXT)).toBeVisible();
});

test("the lead's Designs section holds the design, and Continue opens it", async ({ page }) => {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  const { design } = await startDesignThroughApi(page, leadId);

  await page.goto(`/leads/${leadId}`);
  await page.getByRole('tab', { name: SECTIONS.tabs.designs }).click();
  await expect(page.getByText(DESIGNS.named(design)).first()).toBeVisible();
  await expect(page.getByText(DESIGNS.status(design.status)).first()).toBeVisible();
  await page.getByRole('button', { name: DESIGNS.continue }).click();
  await expect(page).toHaveURL(new RegExp(`/designs/${design.id}$`));
  await expect(page.getByRole('heading', { name: DESIGN.named(design.ordinal) })).toBeVisible();
});

test('a design that is not here says so and offers the way back', async ({ page }) => {
  await ownerWithCompany(page, en);
  await page.goto(`/designs/${crypto.randomUUID()}`);
  await expect(page.getByText(PAGE.states.goneTitle)).toBeVisible();
  await expect(page.getByRole('button', { name: PAGE.states.backToList })).toBeVisible();
});
