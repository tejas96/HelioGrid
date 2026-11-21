import { SKY_TILES_PER_OPENING_MAX } from '@heliogrid/domain';
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
import {
  SKY_TILES,
  saveSiteThroughApi,
  startDesignThroughApi,
  withoutMapService,
  withSkyPicture,
} from '../support/studio';

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
  // Saved is the pill's word; on a phone the pill shows its mark alone, and the word stays its name.
  await expect(page.getByText(STUDIO.saved)).toBeAttached();
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
  const siteStep = page.getByRole('button', { name: STUDIO.changeSite });

  /* The rail opens on the site, done: a press opens its form as a change, not a start. */
  await page.goto(`/designs/${design.id}`);
  await siteStep.click();
  await expect(page).toHaveURL(new RegExp(`/designs/${design.id}/site`));
  await expect(page.getByRole('heading', { name: PAGE.title })).toBeVisible();
  await expect(page.getByRole('button', { name: CHANGE.start })).toBeVisible();
  await expect(page.getByText(CHANGE.next.roof)).toBeVisible();
  await expectNoSeriousViolations(page);

  /* The trail names the design: a press goes back to the studio. */
  await page.getByRole('button', { name: named }).click();
  await expect(page.getByRole('navigation', { name: STUDIO.steps })).toBeVisible();

  /* Cancel goes back to the studio too where the page draws it (a phone's way back is the trail),
     and so does the save. */
  await siteStep.click();
  if (test.info().project.name === 'desktop') {
    await page.getByRole('button', { name: CHANGE.cancel }).click();
    await expect(page.getByRole('navigation', { name: STUDIO.steps })).toBeVisible();
    await siteStep.click();
  }
  await page.getByRole('button', { name: CHANGE.start }).click();
  await expect(page).toHaveURL(new RegExp(`/designs/${design.id}(\\?|$)`));
  await expect(page.getByRole('navigation', { name: STUDIO.steps })).toBeVisible();
});

test('the studio opens on the sky picture, tile by tile, and on its grid when no tile comes', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  const { design } = await startDesignThroughApi(page, leadId);
  await withoutMapService(page);
  await saveSiteThroughApi(page, design.id);
  const noPicture = page.getByText(STUDIO.noPictureWhy('not_answered'));
  /** The same studio opened again with other tiles coming. */
  const openedWith = async (tiles: Parameters<typeof withSkyPicture>[1]) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await withoutMapService(page);
    const asked = await withSkyPicture(page, tiles);
    await page.goto(`/designs/${design.id}`);
    return asked;
  };

  /* The picture's facts name who took it. Its tiles are asked for with the ticket they came with,
     the coarse first picture first, and an opening asks for no more than it may. */
  const asked = await openedWith('come');
  await expect(page.getByText(SKY_TILES.credit)).toBeVisible();
  await expect.poll(() => asked.some((tile) => tile.zoom > SKY_TILES.zoomMin)).toBe(true);
  await page.waitForLoadState('networkidle');
  expect(new Set(asked.map((tile) => tile.ticket))).toEqual(new Set([SKY_TILES.ticket]));
  expect(asked[0]?.zoom).toBe(SKY_TILES.zoomMin);
  expect(asked.length).toBeLessThanOrEqual(SKY_TILES_PER_OPENING_MAX);
  await expect(noPicture).toBeHidden();

  /* A sharp tile that does not come leaves the first picture showing: the site still has one. */
  const coarse = await openedWith('only the first picture comes');
  await expect(page.getByText(SKY_TILES.credit)).toBeVisible();
  await expect.poll(() => coarse.some((tile) => tile.zoom > SKY_TILES.zoomMin)).toBe(true);
  await page.waitForLoadState('networkidle');
  await expect(noPicture).toBeHidden();
  await expect(page.getByText(SKY_TILES.credit)).toBeVisible();

  /* No tile of the first picture comes: the studio says so and opens on its grid (`F8-36`). */
  await openedWith('never come');
  await expect(noPicture).toBeVisible();
  await expect(page.getByText(SKY_TILES.credit)).toBeHidden();
  // A tile still on its way when the flow ends is let go, not answered.
  await page.unrouteAll({ behavior: 'ignoreErrors' });
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
