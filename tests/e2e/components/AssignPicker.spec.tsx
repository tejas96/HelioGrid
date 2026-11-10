import { assignPendingWords, assignPickerWords, createTranslator } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { TEAM } from '../support/crm-sheets';
import { animationsSettled } from '../support/motion';
import { expectTouchFloor } from '../support/touch-target';
import { AssignPickerForLead } from './AssignPicker.story';

const en = await createTranslator('en');
const words = assignPickerWords(en.t, { name: 'Priya Sharma' });

test.use({ viewport: { width: 375, height: 812 } });

test('each person shows their open and overdue counts, and one tap assigns with no confirm', async ({
  mount,
  page,
}) => {
  await mount(<AssignPickerForLead />);
  await animationsSettled(page);
  const sheet = page.getByRole('dialog', { name: words.title });

  await expect(sheet.getByText(words.subtitle)).toBeVisible();
  const rowOf = (person: (typeof TEAM)[number]) =>
    sheet.getByRole('button', {
      name: person.userId === 'me' ? words.you(person.name) : person.name,
    });
  for (const person of TEAM) {
    await expect(rowOf(person)).toContainText(words.open(person.openCount));
    await expect(rowOf(person)).toContainText(words.overdue(person.overdueCount));
  }
  const rows = TEAM.map(rowOf);
  await expectTouchFloor(rows);
  await sheet.getByRole('button', { name: 'Neha Kulkarni' }).click();
  await expect(page.locator('[data-picked]')).toHaveAttribute('data-picked', 'neha');
});

test('only an overdue count above nought carries the warning glyph', async ({ mount, page }) => {
  await mount(<AssignPickerForLead />);
  const sheet = page.getByRole('dialog', { name: words.title });
  const late = sheet.locator('.hg-assignee-load-overdue[data-late="true"]');

  await expect(late).toHaveCount(1);
  await expect(late).toContainText(words.overdue(2));
  await expect(late.locator('svg')).toHaveCount(1);
});

test('the lead’s owner is marked and a tap on them sends nothing', async ({ mount, page }) => {
  await mount(<AssignPickerForLead ownerId="rajesh" />);
  const sheet = page.getByRole('dialog', { name: words.title });
  const owner = sheet.getByRole('button', { name: 'Rajesh Jadhav' });

  await expect(owner).toContainText(words.holds);
  await owner.click();
  await expect(page.locator('[data-picked]')).toHaveAttribute('data-picked', '');
});

test('while an assign waits its line sits in that row, no tap sends and Esc keeps the sheet', async ({
  mount,
  page,
}) => {
  await mount(<AssignPickerForLead waitingOn="neha" />);
  const sheet = page.getByRole('dialog', { name: words.title });
  const neha = sheet.getByRole('button', { name: 'Neha Kulkarni' });

  await expect(neha).toContainText(assignPendingWords(en.t).assigning('Neha Kulkarni'));
  await expect(neha).toHaveAttribute('aria-busy', 'true');
  await sheet.getByRole('button', { name: 'Rajesh Jadhav' }).click();
  await page.keyboard.press('Escape');
  const frame = page.locator('[data-picked]');
  await expect(frame).toHaveAttribute('data-picked', '');
  await expect(frame).toHaveAttribute('data-closed', 'false');
});

test('a people read that failed says so and offers its retry', async ({ mount, page }) => {
  await mount(<AssignPickerForLead failed />);
  const sheet = page.getByRole('dialog', { name: words.title });

  await expect(sheet.getByText(words.failedTitle)).toBeVisible();
  await sheet.getByRole('button', { name: words.retry }).click();
  await expect(page.locator('[data-retried]')).toHaveAttribute('data-retried', 'true');
});
