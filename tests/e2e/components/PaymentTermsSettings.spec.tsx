import { allocationVerdict, basisPoints } from '@heliogrid/domain';
import {
  allocationRefusal,
  allocationSentence,
  createTranslator,
  paymentTermsWords,
  stageWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { expectNoSidewaysScroll } from '../support/layout';
import { PaymentTermsAsHeld } from './PaymentTermsSettings.story';

/**
 * The Payment terms page body (`SCR-M01-20`) at the board's two widths, each frame mounted in the
 * state that shows it and read against the RFC's §6 frame map — its parts in order, its words the
 * real catalog's. The editor and the picker stand under the list here; their surfaces are the apps'.
 */

const en = paymentTermsWords((await createTranslator('en')).t);
const { t } = await createTranslator('en');
const enStages = stageWords(t);
/** The meter's line and the save's reason for a split, from the catalog off the one verdict. */
const said = (...shares: number[]) => {
  const verdict = allocationVerdict(shares.map(basisPoints));
  return { line: allocationSentence(t, verdict), refusal: allocationRefusal(t, verdict) ?? '' };
};
const WIDTHS = [
  { name: '375', viewport: { width: 375, height: 812 }, wide: false },
  { name: '1536', viewport: { width: 1536, height: 960 }, wide: true },
] as const;

const cards = (body: Locator) => body.locator('.hg-pay-cards > *');
const foot = (body: Locator) => body.locator('.hg-pay-foot');

async function expectSaveRefused(page: Page, body: Locator, reason: string) {
  const save = foot(body).getByRole('button', { name: en.save });
  await expect(save).toHaveAttribute('aria-disabled', 'true');
  await save.focus();
  await expect(page.locator('.hg-explainer-body', { hasText: reason })).toBeVisible();
}

for (const width of WIDTHS) {
  test.describe(`at ${width.name}`, () => {
    test.use({ viewport: width.viewport });
    const { wide } = width;

    test('every frame at 375 and 1536', async ({ mount, page }) => {
      // m20-a · m20-f — six in use, the default first, two seeded; the archive count; the closing line.
      let body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} />);
      await expect(cards(body)).toHaveCount(6);
      await expect(
        body.getByRole('button', { name: 'Standard 10/60/20/10, default' }),
      ).toBeVisible();
      await expect(body.getByText(en.defaultMark, { exact: true })).toHaveCount(1);
      await expect(body.getByText(en.platformStandard)).toHaveCount(2);
      await expect(
        body.getByRole('region', { name: en.split('Housing society, in thirds') }),
      ).toContainText('33.34%');
      await expect(body.getByRole('button', { name: en.archivedCount(2) })).toBeVisible();
      await expect(body.getByRole('button', { name: en.addTerms })).toBeVisible();
      await expect(body.getByText(en.closing)).toBeVisible();
      if (wide)
        await expect(body.getByRole('heading', { name: en.title, exact: true })).toBeVisible();
      await expectNoSidewaysScroll(page);
      await body.unmount();

      // m20-c · m20-g — 33.33 × 3: the saved schedule, the captions, 0.01% short, Save refused.
      const short = [{ kind: 'line-share' as const, key: 2, share: 3333 }];
      body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} open="t3" edits={short} />);
      await expect(body.getByText(en.previewCaption)).toBeVisible();
      await expect(body.getByText(en.sampleContract)).toBeVisible();
      await expect(body.getByText('₹4,20,000')).toBeVisible();
      await expect(body.locator('.hg-doc-tranche-amount')).toHaveText([
        '₹1,39,986',
        '₹1,39,986',
        '₹1,40,028',
      ]);
      await expect(body.locator('.hg-doc-tranche-when').first()).toHaveText(enStages.won.when);
      await expect(body.getByRole('textbox', { name: en.name, exact: true })).toHaveValue(
        'First instalment',
      );
      await expect(
        body.getByRole('textbox', { name: en.shareOf('Second instalment') }),
      ).toBeVisible();
      await expect(body.getByRole('button', { name: en.remove('Final instalment') })).toBeVisible();
      await expect(body.getByRole('button', { name: en.dueAt('Commissioned') })).toBeVisible();
      await expect(foot(body)).toContainText(said(3333, 3333, 3333).line);
      await expectSaveRefused(page, body, said(3333, 3333, 3333).refusal);
      await expect(body.getByRole('button', { name: en.makeDefault })).toBeVisible();
      await expect(body.getByRole('button', { name: en.archive, exact: true })).toBeVisible();
      await body.unmount();

      // m20-c3 — the default's editor: met, Save live, the fact in words and no Archive.
      body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} open="t1" />);
      await expect(body.locator('.hg-doc-tranche-amount')).toHaveText([
        '₹42,000',
        '₹2,52,000',
        '₹84,000',
        '₹42,000',
      ]);
      await expect(foot(body).getByRole('button', { name: en.save })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await expect(body.getByText(en.isDefault)).toBeVisible();
      await expect(body.getByRole('button', { name: en.archive, exact: true })).toHaveCount(0);
      await body.unmount();

      // m20-d · m20-h — the picker: nine stages in order, never Cancelled, the pills.
      body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} open="t3" picking={2} />);
      const picker = body.getByRole('radiogroup', { name: en.whenDue('Final instalment') });
      await expect(picker.getByRole('radio')).toHaveCount(9);
      await expect(picker.getByRole('radio', { name: /Commissioned/ })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await expect(picker.getByText('Final instalment · 33.34%')).toBeVisible();
      await expect(picker.getByText(en.canBeSkipped)).toHaveCount(1);
      await expect(body.getByText(en.skipRule)).toBeVisible();
      await body.unmount();

      // m20-n4 · m20-n10 — 12% under; m20-n5 — 18% over; m20-n6 · m20-n11 — the edit met.
      const under = [{ kind: 'line-share' as const, key: 1, share: 2800 }];
      body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} open="t2" edits={under} />);
      await expect(foot(body)).toContainText(said(3000, 2800, 1000).line);
      await body.unmount();
      const over = [{ kind: 'line-share' as const, key: 2, share: 2800 }];
      body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} open="t2" edits={over} />);
      await expect(foot(body)).toContainText(said(3000, 6000, 2800).line);
      await expectSaveRefused(page, body, said(3000, 6000, 2800).refusal);
      await body.unmount();
      const met = [
        { kind: 'line-share' as const, key: 0, share: 4000 },
        { kind: 'line-share' as const, key: 1, share: 3000 },
        { kind: 'line-share' as const, key: 2, share: 3000 },
      ];
      body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} open="t2" edits={met} />);
      await expect(body.locator('.hg-doc-tranche-amount')).toHaveText([
        '₹1,68,000',
        '₹1,26,000',
        '₹1,26,000',
      ]);
      await expect(foot(body).getByRole('button', { name: en.cancel })).toBeVisible();
      await body.unmount();

      // m20-n7 — a skippable stage: the badge on the binding and the rule in words; Save live.
      body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} open="t5" />);
      await expect(body.getByText(en.skippableMark)).toBeVisible();
      await expect(body.getByText(en.skippableRule)).toBeVisible();
      await expect(foot(body).getByRole('button', { name: en.save })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await body.unmount();
    });

    test('the loading frame', async ({ mount }) => {
      const body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} list="loading" />);
      await expect(body.getByRole('status', { name: en.loading })).toBeVisible();
      await expect(body.getByRole('button')).toHaveCount(0);
      await expect(body.getByText(en.closing)).toHaveCount(0);
    });

    test('the seeded frame', async ({ mount }) => {
      const body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} list="seeded" />);
      await expect(body.getByText(en.seededTitle)).toBeVisible();
      await expect(body.getByText(en.neverChanged)).toBeVisible();
      await expect(body.getByRole('button', { name: en.archivedCount(0) })).toBeVisible();
      await expect(cards(body)).toHaveCount(2);
      await expect(body.getByText(en.closing)).toBeVisible();
    });

    test('a failed save at 375 and 1536', async ({ mount }) => {
      const body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} open="t2" saveFailed />);
      await expect(foot(body).getByText(en.saveFailedTitle)).toBeVisible();
      await expect(foot(body).getByText(en.saveFailedBody)).toBeVisible();
      await expect(foot(body).getByRole('button', { name: en.save })).toBeVisible();
    });

    test('the archived view', async ({ mount }) => {
      let body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} list="archived" />);
      await expect(body.getByRole('heading', { name: en.archivedTitle })).toBeVisible();
      await expect(body.getByText(en.archivedCaption)).toBeVisible();
      await expect(
        body.getByRole('button', { name: en.restoreName('Subsidy-linked, 2024') }),
      ).toBeVisible();
      await expect(body.getByRole('button', { name: en.addTerms })).toHaveCount(0);
      await expect(body.getByText(en.closing)).toHaveCount(0);
      await body.unmount();
      body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} list="none-archived" />);
      await expect(body.getByText(en.nothingArchived)).toBeVisible();
    });

    test('the list’s read failed', async ({ mount }) => {
      const body = await mount(<PaymentTermsAsHeld reader="en" wide={wide} list="unread" />);
      await expect(body.getByText(en.unreadTitle)).toBeVisible();
      await expect(body.getByRole('button')).toHaveCount(0);
    });

    test('Hindi and Marathi at 375 and 1536', async ({ mount, page }) => {
      for (const reader of ['hi', 'mr'] as const) {
        for (const frame of [{}, { open: 't3' }, { open: 't3', picking: 2 }]) {
          const body = await mount(<PaymentTermsAsHeld reader={reader} wide={wide} {...frame} />);
          await expectNoSidewaysScroll(page);
          const shown = await body.innerText();
          for (const word of [
            en.yourTerms,
            en.closing,
            en.previewCaption,
            en.save,
            en.canBeSkipped,
          ]) {
            expect(shown, `${reader} shows "${word}"`).not.toContain(word);
          }
          await body.unmount();
        }
      }
    });
  });
}
