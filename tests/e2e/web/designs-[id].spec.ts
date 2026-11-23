import {
  createTranslator,
  designPageWords,
  leadDesignsWords,
  leadSectionsWords,
  siteDetailsPageWords,
  siteDetailsWords,
  studioCanvasWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { captureLead, ownerWithCompany } from '../support/project';
import { saveSiteThroughApi, startDesignThroughApi, withoutMapService } from '../support/studio';

/**
 * `/designs/<id>` (`SCR-M05-02`, T-M05-001a, T-M05-002a): where the studio opens. A design whose
 * site has no place yet names the design, says what comes next, and leads to Site details; with
 * its place saved, the studio opens. The lead's Designs section holds the design's card, and
 * Continue opens this page. A design that is not the reader's says so and offers the way back.
 */
const en = await createTranslator('en');
const DESIGN = designPageWords(en.t);
const PAGE = siteDetailsPageWords(en.t);
const SECTIONS = leadSectionsWords(en.t);
const DESIGNS = leadDesignsWords(en.t, { ago: String, readerId: null });
const STUDIO = studioCanvasWords(en.t);
const CHANGE = siteDetailsWords(en.t, true);

test('a design asks for its site first, and opens the studio once its place is saved', async ({
  page,
}) => {
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

  /* Site details is one press away, and with the site saved the studio opens on it. */
  await page.getByRole('button', { name: DESIGN.editSite }).click();
  await expect(page.getByRole('heading', { name: PAGE.title })).toBeVisible();
  await saveSiteThroughApi(page, design.id);
  await page.goto(`/designs/${design.id}`);
  await expect(page.getByRole('navigation', { name: STUDIO.steps })).toBeVisible();
  await expect(page.getByText(STUDIO.saved)).toBeVisible();
});

test('the Site step opens Site details in the studio’s place, and every way back returns to it', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  const { design } = await startDesignThroughApi(page, leadId);
  await withoutMapService(page);
  await saveSiteThroughApi(page, design.id);
  const named = DESIGN.named(design.ordinal);
  /* A design with no roof and no sky picture opens on the size card, and the steps wait under it:
     the card's close lets the Site step be pressed. */
  const openSite = async () => {
    await page.getByRole('button', { name: STUDIO.sizeClose }).click();
    await page.getByRole('button', { name: STUDIO.changeSite }).click();
  };

  /* The rail opens on the site, done: a press opens its form as a change, not a start. */
  await page.goto(`/designs/${design.id}`);
  await openSite();
  await expect(page).toHaveURL(new RegExp(`/designs/${design.id}/site`));
  await expect(page.getByRole('heading', { name: PAGE.title })).toBeVisible();
  await expect(page.getByRole('button', { name: CHANGE.start })).toBeVisible();
  await expect(page.getByText(CHANGE.next.roof)).toBeVisible();
  await expectNoSeriousViolations(page);

  /* The trail names the design: a press goes back to the studio. */
  await page.getByRole('button', { name: named }).click();
  await expect(page.getByRole('navigation', { name: STUDIO.steps })).toBeVisible();

  /* Where the room is wide the form's bar holds Cancel, which goes back to the studio too; the
     phone's way back is the trail above. The save goes back as well. */
  if (test.info().project.name === 'desktop') {
    await openSite();
    await page.getByRole('button', { name: CHANGE.cancel }).click();
    await expect(page.getByRole('navigation', { name: STUDIO.steps })).toBeVisible();
  }
  await openSite();
  await page.getByRole('button', { name: CHANGE.start }).click();
  await expect(page).toHaveURL(new RegExp(`/designs/${design.id}(\\?|$)`));
  await expect(page.getByRole('navigation', { name: STUDIO.steps })).toBeVisible();
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
