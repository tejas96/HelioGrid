import { createTranslator, destinationLabel, proposalPageHeadWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { TrailAsDrawn } from './ProposalAfterSheets.story';

/**
 * A page's way back (`CLAUDE.md` §10): at the desktop's room each place above this one opens it and
 * the page itself is named as the current one, never a link; in a narrow room the last place alone
 * is the one way back.
 */
const en = await createTranslator('en');
const head = proposalPageHeadWords(en.t, { money: String, number: String });
const proposals = destinationLabel(en.t, 'proposals');

for (const width of [375, 1536]) {
  test(`at ${width} each crumb opens its place and the page is the current one`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 600 });
    const frame = await mount(<TrailAsDrawn />);
    const trail = page.getByRole('navigation', { name: head.trail });
    await expect(trail.locator('[aria-current="page"]')).toHaveText(head.versions);
    await expect(trail.getByRole('button', { name: head.versions })).toHaveCount(0);
    await trail.getByRole('button', { name: 'PRP-0042' }).click();
    await expect(frame).toHaveAttribute('data-act', 'detail');
    await trail.getByRole('button', { name: proposals }).click();
    await expect(frame).toHaveAttribute('data-act', 'proposals');
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}

test('in a narrow room the last place alone is the way back, and no trail is drawn', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 600 });
  const frame = await mount(<TrailAsDrawn narrow />);
  await expect(page.getByRole('navigation', { name: head.trail })).toHaveCount(0);
  await expect(page.getByRole('button', { name: proposals })).toHaveCount(0);
  await page.getByRole('button', { name: 'PRP-0042' }).click();
  await expect(frame).toHaveAttribute('data-act', 'detail');
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});
