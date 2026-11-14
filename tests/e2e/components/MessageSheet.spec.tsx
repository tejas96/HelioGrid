import { createTranslator, messageSheetWords, taxNumberNoticeWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { SHARE_MESSAGE } from '../support/proposal-after-lists';
import { expectTouchFloor } from '../support/touch-target';
import { MessageAsDrawn } from './ProposalAfterSheets.story';

/**
 * A composed message, ready for a person to send (`M06-53`, `F5-48`, `F5-68`): the words as a
 * bubble with the link, *Share on WhatsApp* as the main act, a copy and the PDF, and the line that
 * the person picks the chat. The first send with no tax number says so and still sends.
 */
const en = await createTranslator('en');
const FACTS = { name: 'Anil', segment: 'residential', language: 'English' } as const;

for (const width of [375, 1536]) {
  test(`at ${width} the share sheet shows the message and hands each act the composed words`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const words = messageSheetWords(en.t, 'share', FACTS);
    const frame = await mount(<MessageAsDrawn kind="share" />);
    const sheet = page.getByRole('dialog', { name: words.title });
    const bubble = sheet.getByRole('region', { name: words.bubbleName });
    await expect(bubble.getByText(SHARE_MESSAGE.link)).toBeVisible();
    await expect(sheet.getByText(words.note)).toBeVisible();
    await expect(sheet.getByText(words.hint)).toBeVisible();
    const share = sheet.getByRole('button', { name: words.share });
    const copy = sheet.getByRole('button', { name: words.copy });
    const pdf = sheet.getByRole('button', { name: words.pdf ?? '' });
    await expectTouchFloor([share, copy, pdf]);
    await copy.click();
    await expect(frame).toHaveAttribute('data-act', `copy:${SHARE_MESSAGE.link}`);
    await pdf.click();
    await expect(frame).toHaveAttribute('data-act', 'pdf');
    await share.click();
    await expect(frame).toHaveAttribute('data-act', `share:${SHARE_MESSAGE.link}`);
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}

test('the first send with no tax number says so, offers Add it, and still sends', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const words = messageSheetWords(en.t, 'share', { ...FACTS, withoutTaxNumber: true });
  const notice = taxNumberNoticeWords(en.t, { taxName: 'GST', mayAdd: true, ownerName: null });
  const frame = await mount(<MessageAsDrawn kind="share" noTax />);
  const sheet = page.getByRole('dialog', { name: words.title });
  await expect(sheet.getByText(notice.title)).toBeVisible();
  await expect(sheet.getByText(notice.line)).toBeVisible();
  await sheet.getByRole('button', { name: notice.add }).click();
  await expect(frame).toHaveAttribute('data-act', 'add-tax');
  await sheet.getByRole('button', { name: words.share }).click();
  await expect(frame).toHaveAttribute('data-act', `share:${SHARE_MESSAGE.link}`);
});

for (const kind of ['thank', 'crew'] as const) {
  test(`the ${kind} message copies as a message and offers no PDF`, async ({ mount, page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    const words = messageSheetWords(en.t, kind, FACTS);
    const share = messageSheetWords(en.t, 'share', FACTS);
    await mount(<MessageAsDrawn kind={kind} />);
    const sheet = page.getByRole('dialog', { name: words.title });
    await expect(sheet.getByText(words.hint)).toBeVisible();
    await expect(sheet.getByRole('button', { name: words.copy })).toBeVisible();
    await expect(sheet.getByRole('button', { name: share.pdf ?? '' })).toHaveCount(0);
  });
}

test('in Hindi the sheet keeps to its width', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await mount(<MessageAsDrawn kind="share" noTax reader="hi" />);
  await expectNoSidewaysScroll(page);
});
