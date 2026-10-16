import { COMPANY_PROFILE, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { bottomOf, expectNoSidewaysScroll, expectNothingClipped, rightOf } from '../support/layout';
import { expectTouchFloor } from '../support/touch-target';
import { CompanyProfileAsHeld } from './CompanyProfile.story';

/**
 * The company profile's states the board does not draw at 1536, each by the brief's stated
 * rule (`SCR-M01-05`, *Drawn at 375 only*): loading keeps the list and the letterhead as bars; a
 * failed read is the one centred message and no letterhead; a failed save is the same line at the
 * same act with everything typed kept; a line at the act stands beside it.
 */
const en = await createTranslator('en');

const WIDTH = 1536;
test.use({ viewport: { width: WIDTH, height: 1000 } });

const EDITOR_LEFT = 96;
/* A full-width act would be the list's measure wide. */
const ACT_WIDEST = 300;
const TRY_AGAIN = en.t(SIGN_IN.tryAgain);
const ONWARD = en.t(COMPANY_PROFILE.onward);

test('while the record loads the list is five bars, every line of the letterhead is a bar, and the act is off and says why', async ({
  mount,
  page,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" status="loading" />);
  const region = page.getByRole('status', { name: en.t(COMPANY_PROFILE.loading) });
  await expect(region.locator('.hg-loading-bar')).toHaveCount(5);
  expect((await region.boundingBox())?.x).toBe(EDITOR_LEFT);

  const sheet = profile.locator('.hg-company-profile-sheet');
  await expect(sheet).toHaveAttribute('data-loading', 'true');
  await expect(sheet.locator('.hg-company-profile-bar')).toHaveCount(10);
  await expect(sheet.getByText('Suryodaya Solar Solutions Pvt Ltd')).toHaveCount(0);

  const act = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.saveSpoken) });
  await expect(act).toHaveAttribute('aria-disabled', 'true');
  expect((await act.boundingBox())?.width).toBeLessThan(ACT_WIDEST);
  await expect(profile.getByText(en.t(COMPANY_PROFILE.stillLoading))).toBeVisible();
});

test('a profile that could not be read is one centred message with its retry and the way on, and no letterhead', async ({
  mount,
  page,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" status="unread" />);
  await expect(profile.locator('.hg-company-profile-preview')).toHaveCount(0);
  await expect(profile.getByRole('heading', { level: 1 })).toHaveCount(0);
  const title = profile.getByText(en.t(COMPANY_PROFILE.unreadTitle));
  const box = await title.boundingBox();
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - WIDTH / 2)).toBeLessThanOrEqual(1);

  const onward = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.onwardUnreadSpoken) });
  expect((await onward.boundingBox())?.y).toBeGreaterThanOrEqual(await bottomOf(title));
  await expect(onward).toBeInViewport();
  const onwardBox = await onward.boundingBox();
  expect(
    Math.abs((onwardBox?.x ?? 0) + (onwardBox?.width ?? 0) / 2 - WIDTH / 2),
  ).toBeLessThanOrEqual(1);
  expect(onwardBox?.width).toBeLessThan(ACT_WIDEST);
  await profile.getByRole('button', { name: TRY_AGAIN }).click();
  await expect(profile.getByTestId('pressed')).toHaveText('retry-read');
  await onward.click();
  await expect(profile.getByTestId('pressed')).toHaveText('continue-without');
  await expectNoSidewaysScroll(page);
});

test('a failed save says so once above the two acts, side by side at their own widths, with everything typed kept and the letterhead still drawn', async ({
  mount,
}) => {
  const profile = await mount(
    <CompanyProfileAsHeld
      reader="en"
      status="save-failed"
      open="address"
      typed={{ address: 'Plot 14, Baner Road', postalCode: '411045' }}
    />,
  );
  const alert = profile.getByRole('alert');
  await expect(alert).toHaveCount(1);
  await expect(alert).toHaveText(en.t(COMPANY_PROFILE.notSaved));
  const retry = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.retrySaveSpoken) });
  const onward = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.onwardUnsavedSpoken) });
  await expect(retry).toHaveText(TRY_AGAIN);
  await expect(onward).toHaveText(ONWARD);

  const [retryBox, onwardBox] = [await retry.boundingBox(), await onward.boundingBox()];
  expect(retryBox?.x).toBe(EDITOR_LEFT);
  expect(retryBox?.y).toBeGreaterThanOrEqual(await bottomOf(alert));
  expect(onwardBox?.y).toBe(retryBox?.y);
  expect(onwardBox?.x).toBeGreaterThanOrEqual(await rightOf(retry));
  expect(retryBox?.width).toBeLessThan(ACT_WIDEST);
  expect(onwardBox?.width).toBeLessThan(ACT_WIDEST);

  await expect(profile.getByRole('textbox', { name: en.t(COMPANY_PROFILE.street) })).toHaveValue(
    'Plot 14, Baner Road',
  );
  await expect(
    profile.getByRole('textbox', { name: en.t(COMPANY_PROFILE.postalCode) }),
  ).toHaveValue('411045');
  await expect(
    profile.locator('.hg-company-profile-sheet').getByText('Plot 14, Baner Road, Pune 411045'),
  ).toBeVisible();
});

test('the one line at the act stands beside it', async ({ mount }) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" open="declarations" />);
  const act = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.saveSpoken) });
  const line = profile.getByText(en.t(COMPANY_PROFILE.reseedScope));
  const [actBox, lineBox] = [await act.boundingBox(), await line.boundingBox()];
  expect(lineBox?.x).toBeGreaterThanOrEqual(await rightOf(act));
  expect(lineBox?.y).toBeGreaterThanOrEqual(actBox?.y ?? Infinity);
  expect(await bottomOf(line)).toBeLessThanOrEqual(await bottomOf(act));
});

for (const reader of ['hi', 'mr'] as const) {
  test(`in ${reader} nothing is clipped or pushed sideways, every standing stays in its header, and the letterhead’s lines stay on the sheet`, async ({
    mount,
    page,
  }) => {
    const profile = await mount(
      <CompanyProfileAsHeld
        reader={reader}
        open="declarations"
        typed={{
          address: 'Plot 14, Baner Road',
          postalCode: '411045',
          bankName: 'HDFC Bank',
          accountNumber: '50100234564821',
          bankRoutingIdentifier: 'HDFC0001234',
        }}
      />,
    );
    const headers = profile.locator('.hg-accordion-toggle');
    await expect(profile.locator('.hg-accordion-standing')).toHaveCount(4);
    for (const header of await headers.all()) {
      const standing = header.locator('.hg-accordion-standing');
      if ((await standing.count()) === 0) continue;
      expect(await rightOf(standing)).toBeLessThanOrEqual(await rightOf(header));
      expect(await bottomOf(standing)).toBeLessThanOrEqual(await bottomOf(header));
    }
    const sheet = profile.locator('.hg-company-profile-sheet');
    const { t } = await createTranslator(reader);
    await expect(
      sheet.getByText(
        t(COMPANY_PROFILE.letterheadBankLine, { bankName: 'HDFC Bank', ending: '4821' }),
      ),
    ).toBeVisible();
    const lines = sheet.locator('.hg-text');
    await expect(lines).toHaveCount(6);
    for (const line of await lines.all()) {
      expect(await rightOf(line)).toBeLessThanOrEqual(await rightOf(sheet));
    }
    await expectNothingClipped(page, '.hg-text, .hg-accordion-toggle, .hg-input-label');
    const act = profile.locator('.hg-door-footer').getByRole('button');
    await expect(act).toHaveCount(1);
    await act.scrollIntoViewIfNeeded();
    await expect(act).toBeInViewport();
    await expectNoSidewaysScroll(page);
  });
}

for (const state of [
  { name: 'at rest', props: { open: 'bank' } },
  { name: 'after a failed read', props: { status: 'unread' } },
  { name: 'after a failed save', props: { status: 'save-failed' } },
] as const) {
  test(`${state.name}, every header, field and act meets the touch floor`, async ({ mount }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" {...state.props} />);
    const targets = [
      ...(await profile.locator('.hg-accordion-toggle').all()),
      ...(await profile.locator('.hg-input-shell').all()),
      ...(await profile.locator('.hg-button').all()),
    ];
    await expectTouchFloor(targets);
  });
}
