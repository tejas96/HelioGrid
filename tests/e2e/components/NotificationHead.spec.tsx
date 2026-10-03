import { centreHeadWords, createTranslator } from '@heliogrid/i18n';
import { NotificationHead } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

/** The centre's head (`SCR-SHELL-03`, the owner's board change), at the web panel's 456. */
const en = await createTranslator('en');
const facts = {
  readState: 'all',
  filtered: false,
  match: 46,
  unread: 7,
  unreadListed: 7,
  markAllShows: true,
} as const;

test.use({ viewport: { width: 456, height: 200 } });

test('the count and, at its end, Mark all read named with the count', async ({ mount }) => {
  let pressed = 0;
  const head = await mount(
    <NotificationHead {...centreHeadWords(en.t, facts)} onMarkAll={() => (pressed += 1)} />,
  );
  await expect(head).toContainText('7 unread · 46 in the last 30 days');
  await head.getByRole('button', { name: 'Mark all 7 unread notifications read' }).click();
  expect(pressed).toBe(1);
});

test('nothing unread listed: Mark all read is absent, never greyed (F4-27)', async ({ mount }) => {
  const head = await mount(
    <NotificationHead {...centreHeadWords(en.t, { ...facts, markAllShows: false })} />,
  );
  await expect(head.getByRole('button')).toHaveCount(0);
});

test('while one is on its way, a press sends nothing', async ({ mount }) => {
  let pressed = 0;
  const head = await mount(
    <NotificationHead {...centreHeadWords(en.t, facts)} marking onMarkAll={() => (pressed += 1)} />,
  );
  await head.getByRole('button').click();
  expect(pressed).toBe(0);
});
