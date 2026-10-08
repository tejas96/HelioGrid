import { createTranslator, SHELL } from '@heliogrid/i18n';
import { Avatar, MobileTopBar, ShellAction, ShellGlyph } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedLength } from '../support/token';
import { MIN_TOUCH_TARGET } from '../support/touch-target';

/**
 * The phone header (`MS12-19`, the design system's open-page `MobileTopBar`): the product tile,
 * the company's name as words — no chip, it opens nothing (`F7-15`) — then the round grey search
 * and bell, and the avatar. No page title rides in the bar.
 */
const en = await createTranslator('en');
const words = { searchLabel: en.t(SHELL.search), notificationsLabel: en.t(SHELL.notifications) };
const LONG_NAME = 'Suryodaya Solar and Rooftop Energy Systems Private Limited Pune';

test('the bar is the tile, then the company name as bold words on one line, cut by an ellipsis', async ({
  mount,
  page,
}) => {
  const screen = await mount(
    <div style={{ width: 375 }}>
      <MobileTopBar
        {...words}
        company={LONG_NAME}
        onSearchClick={() => {}}
        onNotificationsClick={() => {}}
        avatar={<Avatar name="Amit Rane" size={44} />}
      />
    </div>,
  );
  const bar = screen.getByRole('banner');
  const name = screen.getByText(LONG_NAME);

  expect((await bar.boundingBox())?.height).toBe(await resolvedLength(page, '--topbar-h-mobile'));
  const side = `${await resolvedLength(page, '--screen-pad-mobile')}px`;
  await expect(bar).toHaveCSS('padding-left', side);
  await expect(bar).toHaveCSS('padding-right', side);
  await expect(name).toHaveCSS('font-size', `${await resolvedLength(page, '--fs-body')}px`);
  await expect(name).toHaveCSS('font-weight', '700');
  await expect(name).toHaveCSS('white-space', 'nowrap');
  await expect(name).toHaveCSS('text-overflow', 'ellipsis');
  await expect(name).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(await name.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  expect(((await bar.boundingBox())?.width ?? 0) <= 375).toBe(true);
});

test('search and the bell are round grey 44 buttons with primary icons', async ({
  mount,
  page,
}) => {
  const screen = await mount(
    <div style={{ width: 375 }}>
      <MobileTopBar
        {...words}
        company="Suryodaya Solar"
        onSearchClick={() => {}}
        onNotificationsClick={() => {}}
      />
    </div>,
  );
  const fill = await resolvedColour(page, '--fill');
  const primary = await resolvedColour(page, '--text-primary');
  const pill = `${await resolvedLength(page, '--r-pill')}px`;

  for (const label of [words.searchLabel, words.notificationsLabel]) {
    const button = screen.getByRole('button', { name: label });
    const box = await button.boundingBox();
    expect(box?.width).toBe(MIN_TOUCH_TARGET);
    expect(box?.height).toBe(MIN_TOUCH_TARGET);
    await expect(button).toHaveCSS('background-color', fill);
    await expect(button).toHaveCSS('border-top-left-radius', pill);
    await expect(button.locator('svg')).toHaveCSS('color', primary);
  }
});

test('a bar that names only the company draws no button', async ({ mount }) => {
  const screen = await mount(
    <div style={{ width: 375 }}>
      <MobileTopBar {...words} company="Suryodaya Solar" />
    </div>,
  );

  await expect(screen.getByText('Suryodaya Solar')).toBeVisible();
  await expect(screen.getByRole('button')).toHaveCount(0);
});

test('safeTop marks the bar and keeps its own padding where no inset is reported', async ({
  mount,
  page,
}) => {
  const screen = await mount(
    <div style={{ width: 375 }}>
      <MobileTopBar {...words} company="Suryodaya Solar" safeTop />
    </div>,
  );
  const bar = screen.getByRole('banner');

  // A desktop browser reports no camera inset, so the bar keeps its own padding; the inset itself
  // is read only on a device.
  await expect(bar).toHaveAttribute('data-safe-top', 'true');
  await expect(bar).toHaveCSS('padding-top', `${await resolvedLength(page, '--sp-2')}px`);
});

test('a shell button that is not round is transparent at --r-md', async ({ mount, page }) => {
  const button = await mount(
    <ShellAction label={words.notificationsLabel} icon={<ShellGlyph name="bell" size="md" />} />,
  );

  await expect(button).toHaveAccessibleName(words.notificationsLabel);
  await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(button).toHaveCSS(
    'border-top-left-radius',
    `${await resolvedLength(page, '--r-md')}px`,
  );
});
