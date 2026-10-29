import type { DemoDoor } from '@heliogrid/domain';
import { createTranslator, setupReadyWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { settledBox } from '../support/layout';
import { resolvedLength } from '../support/token';
import { SetupReadyAsHeld } from './SetupReady.story';

/**
 * *You're ready* (`SCR-M01-06` m-default, m-loading, m-error-demo, d-default): the heading with the
 * company read back and exactly two doors; door two follows the demo and keeps the ready door's
 * height, so the heading and door one never move as it resolves.
 */
/** The board's company. */
const COMPANY = 'Suryodaya Solar Solutions';
const en = setupReadyWords((await createTranslator('en')).t);
const DEMO_STATES: readonly DemoDoor[] = ['ready', 'loading', 'unavailable'];

/** Where the heading and door one sit, and door two's height, for one demo state. */
async function placesOf(page: Page, root: Locator) {
  /* Under a loaded run the first mount can be measured before its face has loaded, a line off. */
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const heading = await settledBox(root.getByRole('heading', { level: 1 }));
  const doors = root.locator('.hg-setup-ready-doors > *');
  const one = await settledBox(doors.nth(0));
  const two = await settledBox(doors.nth(1));
  const sideways = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  return { heading: heading?.y, one: [one?.x, one?.y, one?.height], two: two?.height, sideways };
}

for (const [width, height] of [
  [375, 812],
  [1536, 1000],
] as const) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height } });

    for (const reader of ['en', 'hi', 'mr'] as const) {
      test(`in ${reader}, the heading and door one hold still while door two resolves, and nothing scrolls sideways`, async ({
        mount,
        page,
      }) => {
        const places = [];
        for (const demo of DEMO_STATES) {
          const root = await mount(
            <SetupReadyAsHeld reader={reader} demo={demo} company={COMPANY} />,
          );
          places.push(await placesOf(page, root));
          await root.unmount();
        }
        const [ready, ...waiting] = places;
        expect(ready?.sideways).toBe(0);
        for (const other of waiting) {
          expect(other.heading).toBe(ready?.heading);
          expect(other.one).toEqual(ready?.one);
          expect(other.two).toBeCloseTo(ready?.two ?? 0, 0);
          expect(other.sideways).toBe(0);
        }
      });
    }
  });
}

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the heading names the company, and the two doors stack with their acts full width', async ({
    mount,
    page,
  }) => {
    const root = await mount(<SetupReadyAsHeld reader="en" demo="ready" company={COMPANY} />);
    await expect(root.getByRole('heading', { level: 1, name: en.title })).toBeVisible();
    await expect(root.getByText(en.companyLine(COMPANY))).toBeVisible();
    await expect(root.getByRole('heading', { level: 2 })).toHaveText([
      en.lead.title,
      en.demo.title,
    ]);
    await expect(root.getByText(en.demo.badge, { exact: true })).toBeVisible();
    const wordmark = await settledBox(root.locator('.hg-door-wordmark'));
    const heading = await settledBox(root.getByRole('heading', { level: 1 }));
    const line = await settledBox(root.getByText(en.companyLine(COMPANY)));
    const first = await settledBox(root.locator('.hg-setup-ready-doors > *').first());
    expect((heading?.y ?? 0) - ((wordmark?.y ?? 0) + (wordmark?.height ?? 0))).toBe(
      await resolvedLength(page, '--sp-8'),
    );
    expect((line?.y ?? 0) - ((heading?.y ?? 0) + (heading?.height ?? 0))).toBe(
      await resolvedLength(page, '--sp-2'),
    );
    expect((first?.y ?? 0) - ((line?.y ?? 0) + (line?.height ?? 0))).toBe(
      await resolvedLength(page, '--sp-6'),
    );
    const pad = await resolvedLength(page, '--screen-pad-mobile');
    for (const name of [en.lead.act, en.demo.act]) {
      const act = await settledBox(root.getByRole('button', { name }));
      expect(act?.height).toBe(await resolvedLength(page, '--sp-12'));
      expect(act?.width).toBeLessThan(375 - 2 * pad);
      expect(act?.width).toBeGreaterThan(
        375 - 2 * pad - 2 * (await resolvedLength(page, '--tile-pad')) - 1,
      );
    }
    const doors = root.locator('.hg-setup-ready-doors > *');
    const one = await settledBox(doors.nth(0));
    const two = await settledBox(doors.nth(1));
    expect((two?.y ?? 0) - ((one?.y ?? 0) + (one?.height ?? 0))).toBe(
      await resolvedLength(page, '--sp-4'),
    );
    await root.getByRole('button', { name: en.lead.act }).click();
    await expect(root.getByTestId('pressed')).toHaveText('lead');
    await root.getByRole('button', { name: en.demo.act }).click();
    await expect(root.getByTestId('pressed')).toHaveText('demo');
  });

  test('while the demo loads door two says so where its act will be, and door one stays live', async ({
    mount,
  }) => {
    const root = await mount(<SetupReadyAsHeld reader="en" demo="loading" company={COMPANY} />);
    await expect(root.getByText(en.demo.loading)).toBeVisible();
    await expect(root.getByRole('button')).toHaveCount(1);
    await root.getByRole('button', { name: en.lead.act }).click();
    await expect(root.getByTestId('pressed')).toHaveText('lead');
  });

  test('with no demo door two states what happened, its title alone, and offers Try again', async ({
    mount,
  }) => {
    const root = await mount(<SetupReadyAsHeld reader="en" demo="unavailable" company={COMPANY} />);
    await expect(root.locator('.hg-card-message-text')).toHaveText(en.demo.failed);
    await expect(root.getByRole('button')).toHaveCount(2);
    await expect(root.getByRole('button', { name: en.lead.act })).toBeEnabled();
    await root.getByRole('button', { name: en.tryAgain }).click();
    await expect(root.getByTestId('pressed')).toHaveText('retry-demo');
  });
});

test.describe('the wall', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const reader of ['en', 'hi', 'mr'] as const) {
    test(`in ${reader} at 375 it follows the wordmark with Try again, no door is offered, and the doors take the focus once it works`, async ({
      mount,
      page,
    }) => {
      const words = setupReadyWords((await createTranslator(reader)).t);
      const root = await mount(
        <SetupReadyAsHeld reader={reader} demo="unavailable" company={COMPANY} unreachable />,
      );
      await expect(root.getByText(words.wall.title)).toBeVisible();
      await expect(root.getByText(words.wall.line)).toBeVisible();
      await expect(root.getByRole('heading', { level: 2 })).toHaveCount(0);
      await expect(root.getByRole('button')).toHaveCount(1);
      const wordmark = await settledBox(root.locator('.hg-door-wordmark'));
      const title = await settledBox(root.getByText(words.wall.title));
      expect(title?.y).toBeGreaterThan((wordmark?.y ?? 0) + (wordmark?.height ?? 0));
      expect(title?.y).toBeLessThan(400);
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(sideways).toBe(0);
      await root.getByRole('button', { name: words.tryAgain }).click();
      await expect(root.getByTestId('pressed')).toHaveText('try-again');
      await expect(root.getByRole('button', { name: words.lead.act })).toBeFocused();
    });
  }
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('with the company unread the wall is centred in the task pane, the brand pane holds only the wordmark', async ({
    mount,
  }) => {
    const root = await mount(
      <SetupReadyAsHeld reader="en" demo="unavailable" company={COMPANY} unreachable />,
    );
    await expect(root.getByRole('heading', { level: 1 })).toHaveCount(0);
    const wall = await settledBox(root.getByText(en.wall.title));
    const pane = await settledBox(root.locator('.hg-door-task'));
    expect(
      Math.abs((wall?.x ?? 0) + (wall?.width ?? 0) / 2 - ((pane?.x ?? 0) + (pane?.width ?? 0) / 2)),
    ).toBeLessThan(1);
    expect(pane?.height).toBe(1000);
    const block = await settledBox(root.locator('.hg-setup-ready-wall'));
    expect(Math.abs((block?.y ?? 0) + (block?.height ?? 0) / 2 - 500)).toBeLessThan(1);
  });

  test('the doors sit side by side in the task pane, top-aligned with the heading, their lines at the body size and their acts at their own widths', async ({
    mount,
    page,
  }) => {
    const root = await mount(<SetupReadyAsHeld reader="en" demo="ready" company={COMPANY} />);
    const heading = await settledBox(root.getByRole('heading', { level: 1 }));
    const doors = root.locator('.hg-setup-ready-doors > *');
    const one = await settledBox(doors.nth(0));
    const two = await settledBox(doors.nth(1));
    expect(two?.y).toBe(one?.y);
    expect(two?.height).toBe(one?.height);
    expect(Math.round((two?.x ?? 0) - ((one?.x ?? 0) + (one?.width ?? 0)))).toBe(
      await resolvedLength(page, '--sp-5'),
    );
    expect(Math.round(one?.y ?? 0)).toBe(Math.round(heading?.y ?? 0));
    expect((one?.x ?? 0) - (heading?.x ?? 0)).toBeGreaterThan(400);
    const act = await settledBox(root.getByRole('button', { name: en.lead.act }));
    expect(act?.width).toBeLessThan((one?.width ?? 0) / 2);
    const line = root.getByText(en.lead.line);
    await expect(line).toHaveCSS('font-size', `${await resolvedLength(page, '--fs-body')}px`);
    const pane = await root
      .locator('.hg-door-task')
      .evaluate((el) => getComputedStyle(el).paddingBottom);
    expect(pane).toBe(`${await resolvedLength(page, '--sp-10')}px`);
  });
});
