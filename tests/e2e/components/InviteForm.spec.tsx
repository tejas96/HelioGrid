import { createTranslator, inviteWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { InviteFormAsHeld } from './InviteForm.story';

const en = inviteWords((await createTranslator('en')).t);

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('draws the name, the number with its line, the ask and the twelve presets in F2 order with their lines', async ({
    mount,
  }) => {
    const form = await mount(<InviteFormAsHeld reader="en" />);
    await expect(form.getByLabel(en.name)).toBeVisible();
    await expect(form.getByText(en.phoneHelper)).toBeVisible();
    await expect(form.getByRole('heading', { name: en.rolesHeading, level: 2 })).toBeVisible();
    await expect(form.getByRole('button', { name: en.rolesAsk.label })).toBeVisible();
    const roles = form.getByRole('group', { name: en.rolesGroup }).getByRole('checkbox');
    await expect(roles).toHaveCount(12);
    await expect(roles.first()).toContainText(en.roles[0]?.title ?? '');
    await expect(roles.first()).toContainText(en.roles[0]?.description ?? '');
    await expect(roles.last()).toContainText(en.roles[11]?.title ?? '');
    await expect(form.getByText(en.noRole)).toHaveCount(0);
  });

  test('a press with nothing filled answers every field at once and sends nothing', async ({
    mount,
  }) => {
    const form = await mount(<InviteFormAsHeld reader="en" />);
    await form.getByRole('button', { name: en.send }).click();
    await expect(form.getByText(en.noRole)).toBeVisible();
    await expect(form.getByText(en.required)).toHaveCount(2);
    const group = form.getByRole('group', { name: en.rolesGroup });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(group).toHaveAccessibleDescription(en.noRole);
    await expect(form.getByTestId('sent')).toHaveText('');
  });

  test('a name past 120 characters and a short number are answered on their fields', async ({
    mount,
  }) => {
    const form = await mount(<InviteFormAsHeld reader="en" name={'A'.repeat(121)} />);
    await form.getByLabel(en.phone).fill('98220');
    await form.getByRole('checkbox', { name: en.roles[3]?.title }).click();
    await form.getByRole('button', { name: en.send }).click();
    await expect(form.getByText(en.digitsMismatch(5, 10))).toBeVisible();
    await expect(form.getByText(en.noRole)).toHaveCount(0);
    await expect(form.getByText(en.nameTooLong)).toBeVisible();
    await expect(form.getByTestId('sent')).toHaveText('');
  });

  test('a filled form with one role sends', async ({ mount }) => {
    const form = await mount(<InviteFormAsHeld reader="en" name="Anjali Kulkarni" />);
    await form.getByLabel(en.phone).fill('9822041187');
    await form.getByRole('checkbox', { name: en.roles[3]?.title }).click();
    await form.getByRole('button', { name: en.send }).click();
    await expect(form.getByTestId('sent')).toHaveText('sent');
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} nothing runs past the 375 frame`, async ({ mount, page }) => {
      await mount(<InviteFormAsHeld reader={reader} />);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('in an editor the heading is a quiet line, not a heading', async ({ mount }) => {
    const form = await mount(<InviteFormAsHeld reader="en" heading="quiet" />);
    await expect(form.getByRole('heading', { name: en.rolesHeading })).toHaveCount(0);
    await expect(form.getByText(en.rolesHeading)).toBeVisible();
  });
});

test.describe('at 1536, wide', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('name and number share a row, the roles take three columns, and the number has no line', async ({
    mount,
  }) => {
    const form = await mount(<InviteFormAsHeld reader="en" layout="wide" />);
    const name = await form.getByLabel(en.name).boundingBox();
    const phone = await form.getByLabel(en.phone).boundingBox();
    expect(Math.abs((name?.y ?? 0) - (phone?.y ?? 1))).toBeLessThan(2);
    const roles = form.getByRole('checkbox');
    const tops = await Promise.all(
      [0, 1, 2, 3].map(async (i) => (await roles.nth(i).boundingBox())?.y ?? -1),
    );
    expect(tops[0]).toBe(tops[1]);
    expect(tops[1]).toBe(tops[2]);
    expect(tops[3]).toBeGreaterThan(tops[0] ?? 0);
    await expect(form.getByText(en.phoneHelper)).toHaveCount(0);
  });
});
