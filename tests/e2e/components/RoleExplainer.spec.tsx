import { join } from 'node:path';
import { type RoleCardNames, type RolePreset, roleCard } from '@heliogrid/domain';
import { createTranslator, roleCardWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import {
  bottomOf,
  expectNoSidewaysScroll,
  expectNothingClipped,
  settledBox,
} from '../support/layout';
import { animationsSettled } from '../support/motion';
import { resolvedLength } from '../support/token';
import { RoleExplainerAsHeld } from './RoleExplainer.story';

/**
 * The role card's first-run life (`SCR-M01-10`, `m-first-run` … `m-stacked-end`, `d-first-run`):
 * the onboarding frame held to the window, the heading, the card whose head stays while its rows
 * scroll, and one act named for the home, with its line. Each frame's picture is saved beside the
 * suite's results for the board comparison.
 */
const en = await createTranslator('en');
const BOARD: RoleCardNames = {
  companyName: 'Suryodaya Solar',
  setterName: 'Rajesh Kulkarni',
  owners: { names: ['Rajesh Kulkarni'], more: 0 },
};
const wordsFor = (roles: readonly RolePreset[]) => roleCardWords(en.t, roleCard(roles), BOARD);
const SALES = wordsFor(['sales_executive']);
const STACKED = wordsFor(['sales_executive', 'design_engineer']);
const TEXT =
  'h1, .hg-role-card-presets, .hg-role-card-credit, .hg-role-card-overline, .hg-role-card-phrase, .hg-scope-note, .hg-button, .hg-role-explainer-act .hg-text';
const PICTURES = join(import.meta.dirname, '../../../.qa/components/role-explainer');

/** The vertical gap from `above`'s bottom to `below`'s top. */
async function gapBetween(page: Page, above: string, below: string): Promise<number> {
  const [top, bottom] = await Promise.all([
    settledBox(page.locator(below).first()),
    bottomOf(page.locator(above).first()),
  ]);
  return Math.round((top?.y ?? 0) - bottom);
}

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('m-first-run: the heading, the board six and six, the act named for the home, nothing scrolls the page', async ({
    mount,
    page,
  }) => {
    const screen = await mount(<RoleExplainerAsHeld reader="en" names={BOARD} />);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(SALES.title);
    await expect(page.locator('.hg-role-card-presets')).toHaveText(SALES.presets);
    await expect(page.locator('.hg-role-card-credit')).toHaveText(SALES.credit ?? '');
    await expect(page.getByRole('region', { name: SALES.region })).toBeVisible();
    await expect(page.getByRole('note')).toContainText(SALES.note?.title ?? '');
    const act = page.getByRole('button', { name: SALES.act });
    await expect(act).toHaveText('Go to my day');
    await expect(page.locator('.hg-role-explainer-act')).toContainText(SALES.atAct);
    await expect(act).toBeInViewport();
    const sp4 = await resolvedLength(page, '--sp-4');
    expect(await gapBetween(page, '.hg-door-header', 'h1')).toBe(sp4);
    expect(await gapBetween(page, 'h1', '.hg-role-card')).toBe(sp4);
    expect(await gapBetween(page, '.hg-role-card', '.hg-role-explainer-act')).toBe(sp4);
    expect(await page.evaluate(() => document.scrollingElement?.scrollHeight)).toBe(812);
    await expectNothingClipped(page, TEXT);
    await expectNoSidewaysScroll(page);
    await animationsSettled(page);
    await page.screenshot({ path: `${PICTURES}/m-first-run.png` });
    await act.click();
    await expect(screen).toHaveAttribute('data-acted', 'true');
  });

  test('m-stacked and m-stacked-end: the heading and the head stay while the rows scroll to the note', async ({
    mount,
    page,
  }) => {
    await mount(
      <RoleExplainerAsHeld
        reader="en"
        roles={['sales_executive', 'design_engineer']}
        names={BOARD}
      />,
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(STACKED.title);
    await expect(page.locator('.hg-role-explainer-act')).toContainText(STACKED.atAct);
    await expect(
      page.locator('.hg-role-card-section').nth(0).locator('.hg-role-card-phrase'),
    ).toHaveCount(STACKED.grants.length);
    await animationsSettled(page);
    await page.screenshot({ path: `${PICTURES}/m-stacked.png` });
    const region = page.getByRole('region');
    expect(await region.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    const [heading, head] = await Promise.all([
      settledBox(page.getByRole('heading', { level: 1 })),
      settledBox(page.locator('.hg-role-card-presets')),
    ]);
    await region.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    expect(await settledBox(page.getByRole('heading', { level: 1 }))).toEqual(heading);
    expect(await settledBox(page.locator('.hg-role-card-presets'))).toEqual(head);
    await expect(page.getByRole('note')).toBeInViewport();
    await expect(page.getByRole('button', { name: STACKED.act })).toBeInViewport();
    await page.screenshot({ path: `${PICTURES}/m-stacked-end.png` });
  });

  test('m-loading: the head and the act draw while the rows wait', async ({ mount, page }) => {
    await mount(<RoleExplainerAsHeld reader="en" names={BOARD} surface="loading" />);
    await expect(page.locator('.hg-role-card-presets')).toHaveText(SALES.presets);
    await expect(page.getByRole('status', { name: SALES.loading })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await expect(page.getByRole('button', { name: SALES.act })).toBeEnabled();
    await page.screenshot({ path: `${PICTURES}/m-loading.png` });
  });

  test('names pending: the frame and the act draw, the heading and the credit wait undrawn', async ({
    mount,
    page,
  }) => {
    await mount(<RoleExplainerAsHeld reader="en" names={BOARD} pending />);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
    await expect(page.locator('.hg-role-card-credit')).toHaveCount(0);
    await expect(page.locator('.hg-role-card-presets')).toHaveText(SALES.presets);
    await expect(page.getByRole('status', { name: SALES.loading })).toBeVisible();
    await expect(page.getByRole('button', { name: SALES.act })).toBeEnabled();
  });

  test('m-error: the error card, the act after it, and Try again reloads', async ({
    mount,
    page,
  }) => {
    const screen = await mount(<RoleExplainerAsHeld reader="en" names={BOARD} surface="failed" />);
    await expect(page.locator('.hg-role-explainer')).toContainText(SALES.error.title);
    await expect(page.locator('.hg-role-card-presets')).toHaveCount(0);
    await expect(page.getByRole('button', { name: SALES.act })).toBeEnabled();
    await page.screenshot({ path: `${PICTURES}/m-error.png` });
    await page.getByRole('button', { name: SALES.error.retry }).click();
    await expect(screen).toHaveAttribute('data-retried', 'true');
    await expect(page.locator('.hg-role-card-presets')).toBeVisible();
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader}, stacked presets: nothing clips and nothing scrolls sideways`, async ({
      mount,
      page,
    }) => {
      await mount(
        <RoleExplainerAsHeld
          reader={reader}
          roles={['sales_executive', 'design_engineer']}
          names={BOARD}
        />,
      );
      await animationsSettled(page);
      await expect(page.locator('.hg-role-explainer-act .hg-button')).toBeInViewport();
      await expectNothingClipped(page, TEXT);
      await expectNoSidewaysScroll(page);
      await page.screenshot({ path: `${PICTURES}/m-stacked-${reader}.png` });
    });
  }
});

test.describe('on a window shorter than the bounded floor', () => {
  test.use({ viewport: { width: 375, height: 480 } });

  test('the column scrolls whole, so every row and the act are reachable', async ({
    mount,
    page,
  }) => {
    await mount(<RoleExplainerAsHeld reader="en" names={BOARD} />);
    const region = page.getByRole('region');
    expect(await region.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(false);
    const act = page.getByRole('button', { name: SALES.act });
    await act.scrollIntoViewIfNeeded();
    await expect(act).toBeInViewport();
    await expectNothingClipped(page, TEXT);
    await expectNoSidewaysScroll(page);
  });
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('d-first-run: the heading in the brand pane, two columns in the card, the act at the right edge', async ({
    mount,
    page,
  }) => {
    await mount(<RoleExplainerAsHeld reader="en" names={BOARD} />);
    await animationsSettled(page);
    const [heading, card, act, line] = await Promise.all([
      settledBox(page.getByRole('heading', { level: 1 })),
      settledBox(page.locator('.hg-role-card')),
      settledBox(page.getByRole('button', { name: SALES.act })),
      settledBox(page.locator('.hg-role-explainer-act .hg-text')),
    ]);
    const sp16 = await resolvedLength(page, '--sp-16');
    expect((heading?.x ?? 0) + (heading?.width ?? 0)).toBeLessThanOrEqual(512);
    expect(card?.x).toBe(512 + sp16);
    expect(Math.round((card?.x ?? 0) + (card?.width ?? 0))).toBe(1536 - sp16);
    const [grants, limits] = await Promise.all(
      [0, 1].map((n) => settledBox(page.locator('.hg-role-card-section').nth(n))),
    );
    expect(limits?.y).toBe(grants?.y);
    expect(gapOf(grants, limits)).toBe(await resolvedLength(page, '--sp-8'));
    expect(Math.round((act?.x ?? 0) + (act?.width ?? 0))).toBe(1536 - sp16);
    expect(act?.width ?? 0).toBeLessThan((card?.width ?? 0) / 2);
    expect(Math.round((line?.x ?? 0) + (line?.width ?? 0) / 2)).toBe(
      Math.round((act?.x ?? 0) + (act?.width ?? 0) / 2),
    );
    expect(Math.round((act?.y ?? 0) - ((card?.y ?? 0) + (card?.height ?? 0)))).toBe(
      await resolvedLength(page, '--sp-8'),
    );
    /* The two-line heading's ink reaches 2 px under its box, which hides nothing: it is left out here. */
    await expectNothingClipped(page, TEXT.replace('h1, ', ''));
    await expectNoSidewaysScroll(page);
    await page.screenshot({ path: `${PICTURES}/d-first-run.png` });
  });
});

type Box = { x: number; width: number } | null | undefined;

function gapOf(left: Box, right: Box): number {
  return Math.round((right?.x ?? 0) - ((left?.x ?? 0) + (left?.width ?? 0)));
}
