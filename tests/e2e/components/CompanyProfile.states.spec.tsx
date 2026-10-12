import { COMPANY_PROFILE, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { bottomOf, expectNoSidewaysScroll } from '../support/layout';
import { resolvedColour } from '../support/token';
import { CompanyProfileAsHeld } from './CompanyProfile.story';

/**
 * The company profile's other states at the board's phone width (`SCR-M01-05`): the record still
 * loading, a profile that could not be read, a save that failed, and a save under way. None is a
 * wall: each keeps a way on, and a failed save keeps everything typed.
 */
const en = await createTranslator('en');

const HEIGHT = 812;
test.use({ viewport: { width: 375, height: HEIGHT } });

const COLUMN = 335;
const ACT = 48;
const TRY_AGAIN = en.t(SIGN_IN.tryAgain);
const ONWARD = en.t(COMPANY_PROFILE.onward);

test('while the record loads the heading stays, bars stand for the five parts, and the act is off and says why', async ({
  mount,
  page,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" status="loading" />);
  await expect(profile.getByRole('heading', { level: 1 })).toHaveText(en.t(COMPANY_PROFILE.title));
  await expect(profile.getByText(en.t(COMPANY_PROFILE.lede))).toBeVisible();

  const region = page.getByRole('status', { name: en.t(COMPANY_PROFILE.loading) });
  await expect(region).toHaveAttribute('aria-busy', 'true');
  const bars = region.locator('.hg-loading-bar');
  await expect(bars).toHaveCount(5);
  const heights = await bars.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().height),
  );
  expect(heights).toEqual([188, 56, 56, 56, 56]);
  await expect(profile.locator('.hg-accordion')).toHaveCount(0);

  const act = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.saveSpoken) });
  await expect(act).toHaveText(en.t(COMPANY_PROFILE.save));
  await expect(act).toHaveAttribute('aria-disabled', 'true');
  await expect(profile.getByText(en.t(COMPANY_PROFILE.stillLoading))).toBeVisible();
  await act.focus();
  await expect(act).toBeFocused();
  await act.click({ force: true });
  await expect(profile.getByTestId('pressed')).toHaveText('');
});

test('a profile that could not be read says so in the list’s place, with the retry in the message and the way on at the foot', async ({
  mount,
  page,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" status="unread" />);
  await expect(profile.getByRole('heading', { level: 1 })).toHaveCount(0);
  await expect(profile.locator('.hg-accordion')).toHaveCount(0);
  await expect(profile.getByText(en.t(COMPANY_PROFILE.unreadTitle))).toBeVisible();
  await expect(profile.getByText(en.t(COMPANY_PROFILE.unreadLine))).toBeVisible();
  await expect(profile.locator('.hg-empty-state-icon svg')).toBeVisible();

  const retry = profile.getByRole('button', { name: TRY_AGAIN });
  const onward = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.onwardUnreadSpoken) });
  await expect(onward).toHaveText(ONWARD);
  await expect(onward).toHaveAttribute('data-variant', 'secondary');
  await expect(retry).toHaveAttribute('data-variant', 'primary');
  expect(await bottomOf(retry)).toBeLessThan((await onward.boundingBox())?.y ?? 0);
  expect(await onward.boundingBox()).toMatchObject({ width: COLUMN, height: ACT });
  expect(await bottomOf(onward)).toBeLessThanOrEqual(HEIGHT);
  await expect(profile.getByRole('button')).toHaveCount(2);

  await retry.click();
  await expect(profile.getByTestId('pressed')).toHaveText('retry-read');
  await onward.click();
  await expect(profile.getByTestId('pressed')).toHaveText('continue-without');
  await expectNoSidewaysScroll(page);
});

test('a failed save keeps everything typed and the same part open, and says so once at the act: the retry first, the way on second', async ({
  mount,
  page,
}) => {
  const profile = await mount(
    <CompanyProfileAsHeld
      reader="en"
      status="save-failed"
      open="address"
      typed={{ address: 'Plot 14, Baner Road', postalCode: '411045' }}
    />,
  );
  await expect(profile.getByRole('textbox', { name: en.t(COMPANY_PROFILE.street) })).toHaveValue(
    'Plot 14, Baner Road',
  );
  await expect(
    profile.getByRole('textbox', { name: en.t(COMPANY_PROFILE.postalCode) }),
  ).toHaveValue('411045');

  /* The held acts cover the column's foot at rest; scrolled into view, the part's last line stands whole above them. */
  const purpose = profile.getByText(en.t(COMPANY_PROFILE.addressPurpose));
  await purpose.scrollIntoViewIfNeeded();
  const foot = (await profile.locator('.hg-door-footer').boundingBox())?.y ?? 0;
  expect(await bottomOf(purpose)).toBeLessThanOrEqual(foot);

  const alert = profile.getByRole('alert');
  await expect(alert).toHaveCount(1);
  await expect(alert).toHaveText(en.t(COMPANY_PROFILE.notSaved));
  await expect(alert).toHaveCSS('color', await resolvedColour(page, '--danger-text'));

  const retry = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.retrySaveSpoken) });
  const onward = profile.getByRole('button', { name: en.t(COMPANY_PROFILE.onwardUnsavedSpoken) });
  await expect(retry).toHaveText(TRY_AGAIN);
  await expect(onward).toHaveText(ONWARD);
  expect(await bottomOf(alert)).toBeLessThanOrEqual((await retry.boundingBox())?.y ?? 0);
  expect(await bottomOf(retry)).toBeLessThan((await onward.boundingBox())?.y ?? 0);
  for (const act of [retry, onward]) {
    expect(await act.boundingBox()).toMatchObject({ width: COLUMN, height: ACT });
  }
  expect(await bottomOf(onward)).toBeLessThanOrEqual(HEIGHT);

  await retry.click();
  await expect(profile.getByTestId('pressed')).toHaveText('save');
  await onward.click();
  await expect(profile.getByTestId('pressed')).toHaveText('continue-without');
  await expectNoSidewaysScroll(page);
});

test('while a save is under way the primary is busy; after a failed one the second act is off too', async ({
  mount,
}) => {
  const saving = await mount(<CompanyProfileAsHeld reader="en" saving />);
  await expect(saving.locator('.hg-button[aria-busy="true"]')).toHaveCount(1);
  await saving.unmount();

  const retrying = await mount(<CompanyProfileAsHeld reader="en" status="save-failed" saving />);
  await expect(retrying.locator('.hg-button[aria-busy="true"]')).toHaveCount(1);
  await expect(
    retrying.getByRole('button', { name: en.t(COMPANY_PROFILE.onwardUnsavedSpoken) }),
  ).toBeDisabled();
});

test('a returning owner who skipped the step reads that in the lede, and nothing else changes', async ({
  mount,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" skipped />);
  await expect(profile.getByText(en.t(COMPANY_PROFILE.ledeSkipped))).toBeVisible();
  await expect(profile.locator('.hg-accordion-toggle')).toHaveCount(5);
  await expect(
    profile.getByRole('button', { name: en.t(COMPANY_PROFILE.saveSpoken) }),
  ).toBeEnabled();
});
