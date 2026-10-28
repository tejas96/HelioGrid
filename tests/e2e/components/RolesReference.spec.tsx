import { ROLE_PRESETS, roleHolders, type UiLanguage } from '@heliogrid/domain';
import { createTranslator, rolesReferenceWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll, expectNothingClipped, settledBox } from '../support/layout';
import { animationsSettled } from '../support/motion';
import { resolvedColour } from '../support/token';
import { RolesReferenceAsRead } from './RolesReference.story';
import { BOARD_ROSTER } from './roles-reference-roster';

/**
 * The Roles reference (`SCR-M01-14`): twelve tiles in F2's order with each role's count, two across
 * at 375 and four at 1536, three while the side panel is open; a role's details in the sheet or
 * the panel — its holders, then *Can do* and *Can't*. Read-only: no act changes a role (`M01-21`).
 */
const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};
const wordsIn = (reader: UiLanguage) =>
  rolesReferenceWords(READERS[reader].t, roleHolders(BOARD_ROSTER));
const en = wordsIn('en');
const [, SALES_MANAGER, SALES_EXECUTIVE] = ROLE_PRESETS;
const presetOf = (value: (typeof ROLE_PRESETS)[number]) => {
  const preset = en.presets.find((each) => each.value === value);
  if (preset === undefined) throw new Error(`no preset ${value}`);
  return preset;
};
const tiles = (page: Page) => page.getByRole('list', { name: en.roles }).getByRole('button');
const columnsOf = async (page: Page) =>
  new Set(await tiles(page).evaluateAll((all) => all.map((tile) => tile.getBoundingClientRect().x)))
    .size;

for (const [width, height, form, columns] of [
  [375, 812, 'sheet', 2],
  [1536, 960, 'panel', 4],
] as const) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height } });

    test(`the twelve roles in F2 order, ${columns} across, each with its count`, async ({
      mount,
      page,
    }) => {
      await mount(<RolesReferenceAsRead reader="en" />);
      await expect(tiles(page)).toHaveCount(12);
      await expect(tiles(page).first()).toContainText(
        `${en.presets[0]?.name}${en.presets[0]?.count}`,
      );
      expect(await columnsOf(page)).toBe(columns);
      /* Zero is a count at full strength, never dimmed. */
      const zero = tiles(page).filter({ hasText: presetOf(SALES_MANAGER).name });
      await expect(zero).toContainText('0 people');
      await expect(zero.getByText('0 people')).toHaveCSS('opacity', '1');
      /* Read-only: nothing on the page edits, adds or removes a role. */
      await expect(page.getByRole('textbox')).toHaveCount(0);
      await expectNoSidewaysScroll(page);
    });

    test(`details name holders, chips and both lists (${form})`, async ({ mount, page }) => {
      await mount(<RolesReferenceAsRead reader="en" />);
      const sales = presetOf(SALES_EXECUTIVE);
      await tiles(page).filter({ hasText: sales.name }).click();
      const details = page.getByRole('dialog');
      await expect(details.getByRole('heading', { name: sales.name })).toBeVisible();
      await expect(details).toContainText(sales.summary);
      await expect(details).toContainText('Amit Rane, Anjali Kulkarni');
      await expect(details).toContainText('Invited');
      await expect(details).toContainText('Priya Deshmukh');
      /* Named once: by the sheet's scroll region, or by the panel's list itself. */
      const can = details.getByLabel(sales.canList, { exact: true });
      await expect(can.getByRole('listitem')).toHaveCount(sales.can.length);
      await details.getByRole('radio', { name: sales.cantTab }).click();
      const cant = details.getByLabel(sales.cantList, { exact: true });
      await expect(cant.getByRole('listitem')).toHaveCount(sales.cant.length);
      await expect(tiles(page).filter({ hasText: sales.name })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      if (form === 'panel') expect(await columnsOf(page)).toBe(3);
      /* The open details' scrolling part is reachable by keyboard and named (`F7-26`). */
      await expectNoSeriousViolations(page);
    });

    if (form === 'sheet') {
      test('only the list scrolls, and once it moves a hairline marks the cut', async ({
        mount,
        page,
      }) => {
        await mount(<RolesReferenceAsRead reader="en" />);
        await tiles(page)
          .filter({ hasText: presetOf(SALES_EXECUTIVE).name })
          .click();
        const room = page.locator('.hg-role-details-scroll');
        await expect(room).toHaveAttribute('data-cut', 'false');
        await room.evaluate((node) => node.scrollBy(0, 180));
        await expect(room).toHaveAttribute('data-cut', 'true');
        expect(await room.evaluate((node) => getComputedStyle(node).borderTopColor)).toBe(
          await resolvedColour(page, '--line-soft'),
        );
        await expect(page.getByRole('dialog').getByRole('radio').first()).toBeInViewport();
      });
    }

    test('a role held by nobody says so', async ({ mount, page }) => {
      await mount(<RolesReferenceAsRead reader="en" />);
      await tiles(page)
        .filter({ hasText: presetOf(SALES_MANAGER).name })
        .click();
      await expect(page.getByRole('dialog')).toContainText(en.nobody);
    });

    test('loading: every role draws at once, each count waits in its place', async ({
      mount,
      page,
    }) => {
      await mount(<RolesReferenceAsRead reader="en" counts="loading" />);
      await expect(tiles(page)).toHaveCount(12);
      /* The button carries the wait in its name and is busy; the bar inside is decoration. */
      const first = tiles(page).first();
      await expect(first).toHaveAccessibleName(new RegExp(en.presets[0]?.loadingCount ?? ''));
      await expect(first).toHaveAttribute('aria-busy', 'true');
      await expect(first.locator('.hg-loading-count')).toBeVisible();
    });

    test('counts unavailable keeps the roles working', async ({ mount, page }) => {
      const frame = await mount(<RolesReferenceAsRead reader="en" counts="failed" />);
      await expect(page.getByText(en.countsFailed)).toBeVisible();
      await expect(page.getByText(en.countGap)).toHaveCount(12);
      await expect(tiles(page).first()).toHaveAccessibleName(
        `${en.presets[0]?.name}, ${en.countGap}`,
      );
      await tiles(page)
        .filter({ hasText: presetOf(SALES_EXECUTIVE).name })
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
      /* Holders are unknown, so the details name nobody rather than claim *Nobody holds this*. */
      await expect(page.getByRole('dialog')).not.toContainText(en.nobody);
      await page.getByRole('button', { name: en.retry }).click();
      await expect(frame).toHaveAttribute('data-retried', 'true');
    });

    test('reduced motion shows the end state', async ({ mount, page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await mount(<RolesReferenceAsRead reader="en" />);
      await tiles(page).first().click();
      await animationsSettled(page);
      await expect(page.getByRole('dialog')).toBeInViewport();
    });

    test('Hindi and Marathi at 375 and 1536', async ({ mount, page }) => {
      for (const reader of ['hi', 'mr'] as const) {
        const words = wordsIn(reader);
        const frame = await mount(<RolesReferenceAsRead reader={reader} />);
        await expect(page.getByText(words.presets[7]?.name ?? '')).toBeVisible();
        await page.getByRole('button', { name: new RegExp(words.presets[7]?.name ?? '') }).click();
        await expect(page.getByRole('dialog')).toContainText(words.presets[7]?.summary ?? '');
        await expectNoSidewaysScroll(page);
        await expectNothingClipped(page, '.hg-role-tile, .hg-role-details-text');
        await frame.unmount();
      }
    });
  });
}

for (const width of [1024, 1280]) {
  test.describe(`at ${width}, a role open`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('the tiles keep their names whole', async ({ mount, page }) => {
      await mount(<RolesReferenceAsRead reader="mr" />);
      const roles = page.getByRole('list', { name: wordsIn('mr').roles });
      await roles.getByRole('button').first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNothingClipped(page, '.hg-role-tile');
      await expectNoSidewaysScroll(page);
    });
  });
}

test.describe('opened from Assign Roles, at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('a round way back stands before the title and returns', async ({ mount, page }) => {
    const frame = await mount(<RolesReferenceAsRead reader="en" fromAssign />);
    const back = page.getByRole('button', { name: en.backToAssign });
    const [backBox, titleBox] = await Promise.all([
      settledBox(back),
      settledBox(page.getByRole('heading', { level: 1, name: en.title })),
    ]);
    expect(backBox?.x ?? 0).toBeLessThan(titleBox?.x ?? 0);
    await back.click();
    await expect(frame).toHaveAttribute('data-back', 'true');
  });

  test('an open tile takes the accent ground', async ({ mount, page }) => {
    await mount(<RolesReferenceAsRead reader="en" />);
    const tile = tiles(page).first();
    await tile.click();
    expect(await tile.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(
      await resolvedColour(page, '--accent-subtle'),
    );
  });
});
