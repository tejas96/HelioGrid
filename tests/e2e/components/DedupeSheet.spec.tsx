import { createTranslator, dedupeSheetWords, SHELL } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { TYPED_PHONE } from '../support/crm-sheets';
import { animationsSettled } from '../support/motion';
import { expectTouchFloor } from '../support/touch-target';
import { DedupeSheetAsCaptured } from './DedupeSheet.story';

const en = await createTranslator('en');
const facts = {
  phone: TYPED_PHONE,
  stage: 'qualified',
  lastContactElapsedMs: 4 * 86_400_000,
} as const;
const visible = dedupeSheetWords(en.t, {
  ...facts,
  inScope: true,
  recordName: 'Priya Sharma',
  ownerName: 'Rajesh Jadhav',
});
const outside = dedupeSheetWords(en.t, {
  ...facts,
  inScope: false,
  recordName: null,
  ownerName: 'Rajesh Jadhav',
});

test.use({ viewport: { width: 375, height: 812 } });

test('the sheet shows the record, its three facts and exactly three choices, each with one line', async ({
  mount,
  page,
}) => {
  await mount(<DedupeSheetAsCaptured />);
  await animationsSettled(page);
  const sheet = page.getByRole('dialog', { name: visible.heading });

  await expect(sheet.getByText(visible.intro)).toBeVisible();
  await expect(sheet.getByText('Priya Sharma', { exact: true })).toBeVisible();
  await expect(sheet.getByText('Nashik')).toBeVisible();
  for (const label of [visible.ownerLabel, visible.stageLabel, visible.lastContactLabel]) {
    await expect(sheet.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(
    sheet.getByRole('img', { name: visible.stageTrack.stepOf('qualified') }),
  ).toBeVisible();
  await expect(sheet.getByText(visible.lastContact)).toBeVisible();
  const choices = [visible.openExisting, visible.logEnquiry, visible.keepBoth];
  for (const choice of choices) {
    await expect(sheet.getByRole('button', { name: choice.title })).toContainText(choice.line);
  }
  await expectTouchFloor(
    choices.map((choice) => sheet.getByRole('button', { name: choice.title })),
  );
});

test('outside the person’s scope the record shows nothing of itself and Open existing asks its owner', async ({
  mount,
  page,
}) => {
  await mount(<DedupeSheetAsCaptured inScope={false} />);
  const sheet = page.getByRole('dialog', { name: outside.heading });

  await expect(sheet.getByText(outside.outsideTitle)).toBeVisible();
  await expect(sheet.getByText('Priya Sharma')).toHaveCount(0);
  await expect(sheet.getByText('Nashik')).toHaveCount(0);
  await sheet.getByRole('button', { name: outside.openExisting.title }).click();
  await expect(page.locator('[data-sent]')).toHaveAttribute('data-sent', 'open_existing');
});

test('keep both’s confirm sleeps until a reason is typed, and sends the reason trimmed', async ({
  mount,
  page,
}) => {
  await mount(<DedupeSheetAsCaptured />);
  const sheet = page.getByRole('dialog', { name: visible.heading });
  const keepBoth = sheet
    .getByRole('button', { name: visible.keepBoth.title })
    .filter({ hasText: visible.keepBoth.line });

  await keepBoth.click();
  await expect(keepBoth).toHaveAttribute('aria-expanded', 'true');
  const confirm = sheet.getByRole('button', { name: visible.keepBothConfirm, exact: true });
  await expect(confirm).toBeDisabled();
  await sheet.getByLabel(visible.reasonLabel).fill('   ');
  await expect(confirm).toBeDisabled();
  await sheet.getByLabel(visible.reasonLabel).fill('  Same family, a second roof ');
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator('[data-sent]')).toHaveAttribute(
    'data-sent',
    'keep_both:Same family, a second roof',
  );
});

test('without the override the third choice is not drawn', async ({ mount, page }) => {
  await mount(<DedupeSheetAsCaptured canKeepBoth={false} />);
  const sheet = page.getByRole('dialog', { name: visible.heading });

  await expect(sheet.getByRole('button', { name: visible.openExisting.title })).toBeVisible();
  await expect(sheet.getByRole('button', { name: visible.logEnquiry.title })).toBeVisible();
  await expect(sheet.getByRole('button', { name: visible.keepBoth.title })).toHaveCount(0);
});

test('while an act waits its line shows, a second press sends nothing and Esc keeps the sheet', async ({
  mount,
  page,
}) => {
  await mount(<DedupeSheetAsCaptured act={{ state: 'waiting', choice: 'log_enquiry' }} />);
  const sheet = page.getByRole('dialog', { name: visible.heading });
  const log = sheet.getByRole('button', { name: visible.logEnquiry.title });

  await expect(sheet.getByText(visible.waiting.log_enquiry)).toBeVisible();
  await expect(log).toHaveAttribute('aria-busy', 'true');
  await log.click();
  await sheet.getByRole('button', { name: visible.openExisting.title }).click();
  await page.keyboard.press('Escape');
  const frame = page.locator('[data-sent]');
  await expect(frame).toHaveAttribute('data-sent', '');
  await expect(frame).toHaveAttribute('data-closed', 'false');
});

test('an act that came back shows its reason under the choice, and dismissing creates nothing', async ({
  mount,
  page,
}) => {
  await mount(<DedupeSheetAsCaptured act={{ state: 'failed', choice: 'open_existing' }} />);
  const sheet = page.getByRole('dialog', { name: visible.heading });

  await expect(sheet.getByText(en.t(SHELL.keepsFailing))).toBeVisible();
  await expect(sheet.getByText(visible.nothingCreated)).toBeVisible();
  await page.keyboard.press('Escape');
  const frame = page.locator('[data-sent]');
  await expect(frame).toHaveAttribute('data-closed', 'true');
  await expect(frame).toHaveAttribute('data-sent', '');
});
