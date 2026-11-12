import { createTranslator, leadDetailSheetWords, provenanceWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { settledBox } from '../support/layout';
import { LOST_POSTPONE, lostNoteValues } from '../support/lead-lost';
import { animationsSettled } from '../support/motion';
import { expectTouchFloor } from '../support/touch-target';
import { LeadLostSheet } from './LeadActSheet.lost.story';

const en = await createTranslator('en');
const provenance = provenanceWords(en.t);
const words = leadDetailSheetWords(en.t, 'copy').forms.lost;

test.use({ viewport: { width: 375, height: 812 } });

const sheetOf = (page: Page) => page.getByRole('dialog', { name: words.title });
const reasonOf = (page: Page, name: string) =>
  sheetOf(page).getByRole('radiogroup', { name: words.reasonLabel }).getByRole('radio', { name });

test('the sheet names the lead and its bill, and the send sleeps until a reason is picked', async ({
  mount,
  page,
}) => {
  await mount(<LeadLostSheet />);
  await animationsSettled(page);
  const sheet = sheetOf(page);

  await expect(sheet.getByText('Kavita Joshi', { exact: true })).toBeVisible();
  await expect(sheet.getByText(words.bill('₹3,100'))).toBeVisible();
  // A money figure carries its tier where it is read (CLAUDE.md §9).
  await expect(sheet.getByText(provenance.tier('measured'))).toBeVisible();
  const reasons = Object.values(words.reason);
  for (const reason of reasons) await expect(reasonOf(page, reason)).toBeVisible();
  await expect(sheet.getByRole('button', { name: words.send(null) })).toBeDisabled();
  await expectTouchFloor(reasons.map((reason) => reasonOf(page, reason)));

  await reasonOf(page, words.reason.price).click();
  await expect(reasonOf(page, words.reason.price)).toHaveAttribute('aria-checked', 'true');
  await sheet.getByRole('button', { name: words.send('price') }).click();
  await expect(page.locator('[data-sent]')).toHaveAttribute('data-sent', 'price:none');
});

test('the seventh reason takes the whole row; the others stand two across', async ({
  mount,
  page,
}) => {
  await mount(<LeadLostSheet />);
  await animationsSettled(page);
  const first = await settledBox(reasonOf(page, words.reason.price));
  const seventh = await settledBox(reasonOf(page, words.reason.not_interested));
  expect(seventh?.width ?? 0).toBeGreaterThan((first?.width ?? 0) * 1.8);
});

test('postponed needs its day: each chip names the day it comes back, and the day is sent', async ({
  mount,
  page,
}) => {
  await mount(<LeadLostSheet />);
  await animationsSettled(page);
  const sheet = sheetOf(page);
  await reasonOf(page, words.reason.postponed).click();
  const send = sheet.getByRole('button', { name: words.send('postponed') });
  await expect(send).toBeDisabled();

  const spans = sheet.getByRole('radiogroup', { name: words.whenLabel });
  await expectTouchFloor(
    Object.values(words.span).map((span) => spans.getByRole('radio', { name: span })),
  );
  for (const [span, day] of [
    ['week', LOST_POSTPONE.week],
    ['month', LOST_POSTPONE.month],
    ['threeMonths', LOST_POSTPONE.threeMonths],
  ] as const) {
    await spans.getByRole('radio', { name: words.span[span] }).click();
    const { day: shown, time } = lostNoteValues(day);
    await expect(sheet.getByText(words.comesBack(shown, time))).toBeVisible();
  }
  await expect(send).toBeEnabled();

  await spans.getByRole('radio', { name: words.span.pick }).click();
  await expect(send).toBeDisabled();
  // The field the chip opens says what the day is, not the chip's own words again.
  await expect(sheet.getByText(words.dayLabel)).toBeVisible();
  await spans.getByRole('radio', { name: words.span.month }).click();
  await send.click();
  await expect(page.locator('[data-sent]')).toHaveAttribute(
    'data-sent',
    `postponed:${LOST_POSTPONE.month}`,
  );
});

test('not interested says the calls stop for six months, and sends no day', async ({
  mount,
  page,
}) => {
  await mount(<LeadLostSheet />);
  await animationsSettled(page);
  const sheet = sheetOf(page);
  await expect(sheet.getByText(words.notInterestedLine)).toHaveCount(0);
  await reasonOf(page, words.reason.not_interested).click();
  await expect(sheet.getByText(words.notInterestedLine)).toBeVisible();
  await sheet.getByRole('button', { name: words.send('not_interested') }).click();
  await expect(page.locator('[data-sent]')).toHaveAttribute('data-sent', 'not_interested:none');
});

test('a postponed sheet with its day shown has no serious accessibility violation', async ({
  mount,
  page,
}) => {
  await mount(<LeadLostSheet />);
  await animationsSettled(page);
  await reasonOf(page, words.reason.postponed).click();
  await sheetOf(page)
    .getByRole('radiogroup', { name: words.whenLabel })
    .getByRole('radio', { name: words.span.week })
    .click();
  await expectNoSeriousViolations(page);
});

test('the reasons are one tab stop, and the arrows move the pick round the seven', async ({
  mount,
  page,
}) => {
  await mount(<LeadLostSheet />);
  await animationsSettled(page);
  const first = reasonOf(page, words.reason.price);
  const last = reasonOf(page, words.reason.not_interested);
  const tabbable = sheetOf(page).locator('[role="radio"][tabindex="0"]');
  await expect(tabbable).toHaveCount(1);

  await first.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(last).toBeFocused();
  await expect(last).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('aria-checked', 'true');
  await expect(tabbable).toHaveCount(1);
});
