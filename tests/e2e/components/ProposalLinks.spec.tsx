import { createTranslator, newLinkWords, proposalLinksWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { LINKS } from '../support/proposal-after-sample';
import { expectTouchFloor } from '../support/touch-target';
import { LinksAsDrawn } from './ProposalAfter.story';

/**
 * The deal's named links (`SCR-M06-20`, `F5-30`): a card per link with who it is for, its state
 * and its last open; a live link's three acts; Turn off asks once; a link that is off offers none.
 */
const en = await createTranslator('en');
const words = proposalLinksWords(en.t, {
  when: (instant) => `${instant.slice(8, 10)} Nov, ${instant.slice(11, 16)}`,
});
const [anil, , off] = LINKS.links;

for (const width of [375, 1536]) {
  test(`at ${width} a live link copies, a link that is off offers nothing, and Turn off asks once`, async ({
    mount,
    page,
  }) => {
    if (anil === undefined || off === undefined) throw new Error('the sample holds three links');
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const frame = await mount(<LinksAsDrawn />);
    await expect(page.getByText(words.line(anil))).toBeVisible();
    await expect(page.getByText(words.line(off))).toBeVisible();
    await expect(page.getByRole('button', { name: words.act('copy', off.label) })).toHaveCount(0);
    const copy = page.getByRole('button', { name: words.act('copy', anil.label) });
    await expectTouchFloor([copy]);
    await copy.click();
    await expect(frame).toHaveAttribute('data-act', 'copy:c1');
    await page.getByRole('button', { name: words.act('revoke', anil.label) }).click();
    const ask = page.getByRole('dialog', { name: words.confirmTitle(anil.label) });
    await expect(ask.getByText(words.confirmLine)).toBeVisible();
    await expect(frame).toHaveAttribute('data-act', 'copy:c1');
    await ask.getByRole('button', { name: words.confirmYes }).click();
    await expect(frame).toHaveAttribute('data-act', 'revoke:c1');
    // Its acts went with it: focus lands on the page, never on nothing.
    await expect(page.getByTestId('links-page')).toBeFocused();
    await expect(page.getByText(words.hint)).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}

test('a new link needs its name before it is made', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const sheet = newLinkWords(en.t);
  const frame = await mount(<LinksAsDrawn />);
  await page.getByRole('button', { name: 'open-new-link' }).click();
  const dialog = page.getByRole('dialog', { name: sheet.title });
  await dialog.getByRole('button', { name: sheet.make }).click();
  await expect(dialog.getByText(sheet.labelNeeded)).toBeVisible();
  await dialog.getByLabel(sheet.label).fill('Sunita');
  await dialog.getByRole('button', { name: sheet.make }).click();
  await expect(frame).toHaveAttribute('data-act', 'made:Sunita');
});
