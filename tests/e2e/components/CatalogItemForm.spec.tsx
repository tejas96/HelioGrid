import { IN_CERTIFICATION_SCHEMES, SPEC_FIELDS, type UiLanguage } from '@heliogrid/domain';
import { catalogAddItemWords, catalogItemFailureWords, createTranslator } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { bottomOf, expectNoSidewaysScroll, expectNothingClipped } from '../support/layout';
import { animationsSettled } from '../support/motion';
import { expectTouchFloor } from '../support/touch-target';
import { ALMM_REFERENCE, FRAMES } from './CatalogItemForm.frames';
import { CatalogItemFormAsRead, type ItemFormSetup } from './CatalogItemForm.story';

/**
 * The add sheet (`SCR-M01-16`, RFC P4, P9): every built frame at 375 and as the 1536 panel — parts
 * in the board's order, the tile alone in its row, the touch floor, no axe finding; Hindi and
 * Marathi unclipped; the end state at once under reduced motion. No datasheet path is built.
 */
const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

type FrameName = keyof typeof FRAMES;

const wordsOf = (setup: ItemFormSetup, reader: UiLanguage = 'en') =>
  catalogAddItemWords(READERS[reader].t, {
    kind: setup.kind,
    caller: setup.caller,
    schemes: IN_CERTIFICATION_SCHEMES.schemes,
    priced: setup.priced ?? true,
    copiedFrom: setup.copiedFrom ?? null,
  });

const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true });

/** The title, the five cards in the board's order, and the spreadsheet tile alone in its row. */
async function expectBody(page: Page, setup: ItemFormSetup) {
  const en = wordsOf(setup);
  await expect(heading(page, en.theItem)).toBeVisible();
  await expect(heading(page, en.specification)).toBeVisible();
  await expect(heading(page, en.certification)).toBeVisible();
  await expect(heading(page, en.price)).toHaveCount(setup.priced === false ? 0 : 1);
  await expect(page.getByRole('combobox', { name: en.whatItIs })).toContainText(
    en.kinds.find((kind) => kind.value === setup.kind)?.label ?? '',
  );
  const tile = page.locator('.hg-item-accelerator');
  const tiled = setup.spreadsheet !== false && setup.copiedFrom === undefined;
  await expect(tile).toHaveCount(tiled ? 1 : 0);
  if (!tiled) return;
  await expect(tile).toContainText(en.spreadsheet);
  await expect(tile).toContainText(en.spreadsheetSub);
  /* The datasheet tile is not built: the spreadsheet tile fills the body's width alone. */
  const tileWidth = (await tile.boundingBox())?.width;
  expect(tileWidth).toBe((await page.locator('.hg-item-form').boundingBox())?.width);
}

const WINDOW_ENDS = new Set(['mppt.minV', 'mppt.maxV']);

/** The required fields of the kind are each labelled; the window is one field. */
async function expectSpecLabels(page: Page, setup: ItemFormSetup) {
  const en = wordsOf(setup);
  const spec = page.locator('.hg-item-spec');
  for (const { path, required } of SPEC_FIELDS[setup.kind]) {
    if (!required) continue;
    const label = WINDOW_ENDS.has(path) ? en.mpptWindow : (en.fields[path]?.label ?? path);
    await expect(spec.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(en.yourOwn, { exact: true })).toBeVisible();
}

/** *Length must be more than Width.*, as the judge words the panel's order gate. */
const lengthGate = () =>
  catalogItemFailureWords(READERS.en.t, {
    path: 'spec.lengthMm',
    issue: 'exceeds',
    than: 'widthMm',
  });

/** The foot: the consequence line (or the returned line) over *Cancel* and the primary. */
async function expectFoot(page: Page, setup: ItemFormSetup, wide: boolean) {
  const en = wordsOf(setup);
  const foot = page.locator('.hg-item-foot');
  const cancel = foot.getByRole('button', { name: en.cancel, exact: true });
  await expect(cancel).toBeVisible();
  await expect(foot.getByRole('button', { name: en.primary, exact: true })).toBeVisible();
  const line = foot.locator('.hg-item-foot-line');
  if (setup.returned === true) {
    await expect(line).toHaveCount(0);
    await expect(foot.getByText(en.returned)).toBeVisible();
    await expect(foot.getByRole('button', { name: en.tryAgain })).toBeVisible();
    await expect(foot.getByRole('button', { name: en.dismiss })).toBeVisible();
    return;
  }
  await expect(line).toHaveText(wide ? en.consequence : en.consequenceNarrow);
  expect(await bottomOf(line)).toBeLessThanOrEqual((await cancel.boundingBox())?.y ?? 0);
}

/** What one frame holds beyond the parts every frame draws. */
async function expectFrameWords(page: Page, name: FrameName, setup: ItemFormSetup) {
  const en = wordsOf(setup);
  const text = (words: string) =>
    expect(page.getByText(words, { exact: true }).first()).toBeVisible();
  switch (name) {
    case 's16-c':
      await text(en.needs.needed);
      for (const value of en.needs.neededValues) {
        await expect(page.getByText(value).first()).toBeVisible();
      }
      return text(en.addOptional);
    case 's16-a':
      await expect(page.getByRole('status', { name: en.loading })).toBeVisible();
      return expect(page.getByText(en.yourOwn, { exact: true })).toHaveCount(0);
    case 'refused':
      await text(lengthGate());
      /* A refused send lands focus on the first field it names. */
      await page.locator('.hg-item-foot').getByRole('button', { name: en.primary }).click();
      return expect(page.getByRole('textbox', { name: en.fields.lengthMm?.label })).toBeFocused();
    case 'd16-c':
      await expect(page.locator('.hg-banner')).toContainText(en.banner ?? '');
      await text(en.copied ?? '');
      await text(en.modelCopied ?? '');
      await text(en.optional);
      await text(en.schemeNote);
      return text(en.priceNote ?? '');
    case 'd16-d':
      return text(en.schemeNote);
    case 'm16-f':
      await expect(page.getByRole('switch', { name: en.schemeRows.ALMM?.label })).toBeChecked();
      await expect(page.getByLabel(en.schemeRows.ALMM?.reference ?? '')).toHaveValue(
        ALMM_REFERENCE,
      );
      return text(en.addOptional);
    default:
      return undefined;
  }
}

/** Every act a person presses on the sheet, measured against the touch floor. */
const acts = (page: Page) =>
  page
    .locator('.hg-item-form button:visible, .hg-item-foot button:visible, .hg-item-form .hg-switch')
    .all();

/** One frame: its title, then the confirm alone, or the body, its spec and its foot. */
async function expectFrame(page: Page, name: FrameName, wide: boolean): Promise<void> {
  const setup: ItemFormSetup = FRAMES[name];
  const en = wordsOf(setup);
  await expect(page.getByText(en.title, { exact: true }).first(), name).toBeVisible();
  /* The sheet and the panel rise in: measure the box they settle at. */
  await entrySettled(page);
  if (wide) {
    const panel = page.getByRole('dialog', { name: en.title });
    expect((await panel.boundingBox())?.width, name).toBe(900);
  }
  if (name === 's16-i') {
    await expectDiscard(page, setup);
    return;
  }
  await expectBody(page, setup);
  if (setup.loading !== true) await expectSpecLabels(page, setup);
  await expectFoot(page, setup, wide);
  await expectFrameWords(page, name, setup);
  await expectTouchFloor(await acts(page));
}

/** *Discard this panel?* over the sheet: its words and its two answers. */
async function expectDiscard(page: Page, setup: ItemFormSetup) {
  const { discard } = wordsOf(setup);
  const confirm = page.getByRole('dialog', { name: discard.title });
  await expect(confirm).toBeVisible();
  await expect(confirm.getByText(discard.body)).toBeVisible();
  await expect(confirm.getByRole('button', { name: discard.keep })).toBeVisible();
  await expect(confirm.getByRole('button', { name: discard.discard })).toBeVisible();
}

/** Waits out the surface's entry: every finite animation — the loading bars loop while they wait. */
function entrySettled(page: Page) {
  return page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((motion) => motion.effect?.getComputedTiming().iterations !== Infinity)
        .map((motion) => motion.finished),
    ),
  );
}

const FRAME_NAMES = Object.keys(FRAMES) as FrameName[];

test('every built frame at 375 and 1536', async ({ mount, page }) => {
  for (const width of [375, 1536]) {
    await at(page, width);
    for (const name of FRAME_NAMES) {
      await test.step(`${name} at ${width}`, async () => {
        const setup: ItemFormSetup = FRAMES[name];
        const root = await mount(<CatalogItemFormAsRead reader="en" setup={setup} />);
        await expectFrame(page, name, width === 1536);
        await expectNoSidewaysScroll(page);
        await expectNoSeriousViolations(page);
        await root.unmount();
      });
    }
  }
});

/** The boxes that hold the product's own words, which must never clip in any language. */
const WORDS_BOXES = '.hg-button, .hg-text, .hg-select-label, .hg-select-value, .hg-switch-label'
  .concat(', .hg-item-card-title, .hg-item-accelerator-title, .hg-item-accelerator-sub')
  .concat(', .hg-item-optional-title, .hg-item-card-note, .hg-item-foot-line');

test('Hindi and Marathi at 375 and 1536', async ({ mount, page }) => {
  for (const width of [375, 1536]) {
    await at(page, width);
    for (const reader of ['hi', 'mr'] as const) {
      for (const name of ['m16-f', 'm16-g', 'm16-h', 's16-c', 'd16-c'] as const) {
        const setup: ItemFormSetup = FRAMES[name];
        const words = wordsOf(setup, reader);
        const root = await mount(<CatalogItemFormAsRead reader={reader} setup={setup} />);
        await expect(page.getByText(words.title, { exact: true }).first()).toBeVisible();
        await entrySettled(page);
        await expect(heading(page, words.specification)).toBeVisible();
        await expectNoSidewaysScroll(page);
        await expect(page.locator(WORDS_BOXES).first()).toBeVisible();
        await expectNothingClipped(page, WORDS_BOXES);
        await root.unmount();
      }
    }
  }
});

test('reduced motion shows the end state', async ({ mount, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [375, 1536]) {
    await at(page, width);
    const setup: ItemFormSetup = FRAMES['m16-f'];
    const en = wordsOf(setup);
    const root = await mount(<CatalogItemFormAsRead reader="en" setup={setup} />);
    /* No wait for the entry: the sheet and its foot are there on the first read. */
    const primary = page.locator('.hg-item-foot').getByRole('button', { name: en.primary });
    await expect(primary).toBeVisible();
    await page.getByRole('button', { name: en.addOptional }).click();
    /* The optional values swap in at once. */
    const optional = page.getByText(en.optional, { exact: true });
    expect(await optional.isVisible()).toBe(true);
    await animationsSettled(page);
    await expect(page.getByRole('button', { name: en.addOptional })).toHaveCount(0);
    await root.unmount();
  }
});
