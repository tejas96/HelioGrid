import { formatMoneyPlainly, IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, markWonBasisWords, markWonWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { WON_BASIS, type WonCase } from '../support/proposal-after-lists';
import { MarkWonAsDrawn } from './ProposalAfterSheets.story';

/**
 * Mark won's proposal basis (`M07-62`, `T-M06-025`): an accepted version fills the value, locked,
 * with the plan's amounts; a newer version not answered, and no acceptance at all, keep the value
 * typed, say why, and state no amount for a value nobody gave.
 */
const en = await createTranslator('en');
const sheet = markWonWords(en.t, 'Anil Sharma');
const basisOf = (basis: WonCase) =>
  markWonBasisWords(
    en.t,
    {
      money: (amount) => formatMoneyPlainly(IN_FORMATS, amount),
      when: (instant) => `${instant.slice(8, 10)} Nov, ${instant.slice(11, 16)}`,
      due: (stage) => stage.replace(/_/g, ' '),
    },
    WON_BASIS[basis],
    { customerName: 'Anil Sharma', segment: 'residential', phone: '+91 98765 43210' },
  );

for (const width of [375, 1536]) {
  test(`at ${width} an accepted proposal locks the value and prints the plan's amounts`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const words = basisOf('accepted');
    const frame = await mount(<MarkWonAsDrawn basis="accepted" />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(words.proofTitle)).toBeVisible();
    await expect(dialog.getByText(words.proofLine)).toBeVisible();
    await expect(dialog.getByText(words.lockedValue, { exact: true })).toBeVisible();
    await expect(dialog.getByText(words.lockedNote)).toBeVisible();
    await expect(dialog.getByLabel(sheet.finalValue)).toHaveCount(0);
    await expect(dialog.getByText(words.planTitle)).toBeVisible();
    for (const part of words.plan) {
      await expect(dialog.getByText(part.name, { exact: true })).toBeVisible();
    }
    await expect(dialog.getByText(words.plan[1]?.amount ?? '', { exact: true })).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
    await dialog.getByRole('button', { name: sheet.send }).click();
    await expect(frame).toHaveAttribute('data-act', `sent:${WON_BASIS.accepted.finalValue}`);
  });
}

test('a value typed before the basis locked it does not block the send', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const frame = await mount(<MarkWonAsDrawn basis="accepted" typedBefore="0" />);
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel(sheet.finalValue)).toHaveCount(0);
  await dialog.getByRole('button', { name: sheet.send }).click();
  await expect(frame).toHaveAttribute('data-act', `sent:${WON_BASIS.accepted.finalValue}`);
});

for (const basis of ['newer', 'none'] as const) {
  test(`with ${basis} to stand on the value is typed and the plan states no amount`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    const words = basisOf(basis);
    await mount(<MarkWonAsDrawn basis={basis} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(words.proofTitle)).toBeVisible();
    await expect(dialog.getByText(words.proofLine)).toBeVisible();
    await expect(dialog.getByText(words.lockedNote)).toHaveCount(0);
    await expect(dialog.getByLabel(sheet.finalValue)).toBeVisible();
    await expect(dialog.getByText(words.planTitle)).toBeVisible();
    await expect(dialog.getByRole('listitem').filter({ hasText: '₹' })).toHaveCount(0);
  });
}

test('in Hindi the sheet keeps to its width', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await mount(<MarkWonAsDrawn basis="accepted" reader="hi" />);
  await expectNoSidewaysScroll(page);
});
