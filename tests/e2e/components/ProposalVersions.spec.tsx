import { formatMoneyPlainly, IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, proposalVersionsWords, putInForceWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { IN_FORCE, LATEST_VERSION } from '../support/proposal-after-sample';
import { VersionsAsDrawn } from './ProposalAfter.story';

/**
 * A proposal's versions (`SCR-M06-16`): the change note first, the facts that moved as old → new,
 * the line for the pages that did not, a row per version — and, on a won deal, *Put in force*.
 */
const en = await createTranslator('en');
const money = (amount: string) => formatMoneyPlainly(IN_FORMATS, amount);
const formats = {
  money,
  number: String,
  when: (instant: string) => `${instant.slice(8, 10)} Nov, ${instant.slice(11, 16)}`,
  due: (stage: string) => stage,
  day: () => '14 Nov 2026',
};
const words = proposalVersionsWords(en.t, formats);

for (const width of [375, 1536]) {
  test(`at ${width} the change note leads, each moved fact reads old then new, and v2 is shared`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const frame = await mount(<VersionsAsDrawn />);
    await expect(page.getByText(LATEST_VERSION.changeNote ?? '')).toBeVisible();
    await expect(page.getByText(money('190575.00')).first()).toBeVisible();
    await expect(page.getByText(money('305000.00')).first()).toBeVisible();
    await expect(page.getByText(words.unchanged(7))).toBeVisible();
    await page.getByRole('button', { name: words.share }).click();
    await expect(frame).toHaveAttribute('data-act', 'share:2');
    await page.getByRole('button', { name: words.view }).click();
    await expect(frame).toHaveAttribute('data-act', 'view:1');
    await expect(page.getByText(words.hint(false))).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}

test('on a won deal the newest version is put in force: the sheet shows what changes first', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const sheet = putInForceWords(en.t, formats, {
    version: 2,
    customerName: 'Anil',
    segment: 'residential',
  });
  const frame = await mount(<VersionsAsDrawn won />);
  await expect(page.getByText(words.hint(true))).toBeVisible();
  await page.getByRole('button', { name: words.putInForce }).click();
  const dialog = page.getByRole('dialog', { name: sheet.title });
  for (const row of sheet.summary(IN_FORCE)) {
    await expect(dialog.getByText(row.label)).toBeVisible();
    await expect(dialog.getByText(row.value).first()).toBeVisible();
  }
  await dialog.getByRole('button', { name: sheet.confirm }).click();
  await expect(frame).toHaveAttribute('data-act', 'confirmed');
});
