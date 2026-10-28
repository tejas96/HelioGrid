import { createTranslator, inviteWords, setupInviteWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { settledBox } from '../support/layout';
import { resolvedLength } from '../support/token';
import { SetupInviteTeamAsHeld } from './SetupInviteTeam.story';

/**
 * The invite step of setup (`SCR-M01-07` m-default, d-default, m-already-member, m-cap-reached):
 * the form in the onboarding frame, the acts that follow the api's answer, and at 1536 the brand
 * pane's *After you send* in the place of the expiry line.
 */
const { t } = await createTranslator('en');
const en = { ...inviteWords(t), ...setupInviteWords(t) };

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the title, the form, Skip for now beside Send invite and the expiry under them', async ({
    mount,
  }) => {
    const step = await mount(<SetupInviteTeamAsHeld reader="en" />);
    await expect(step.getByRole('heading', { name: en.title, level: 1 })).toBeVisible();
    await expect(step.getByText(en.phoneHelper)).toBeVisible();
    await expect(step.getByText(en.lasts)).toBeVisible();
    await expect(step.getByText(en.afterYouSend.heading)).toBeHidden();
    const skip = await settledBox(step.getByRole('button', { name: en.skip }));
    const send = await settledBox(step.getByRole('button', { name: en.send }));
    expect(skip?.y).toBe(send?.y);
    expect(send?.width).toBeGreaterThan(skip?.width ?? 0);
    await step.getByRole('button', { name: en.skip }).click();
    await expect(step.getByTestId('pressed')).toHaveText('skip');
  });

  test('a number already on Team offers Open Team and a different number, and no expiry', async ({
    mount,
  }) => {
    const step = await mount(<SetupInviteTeamAsHeld reader="en" refusal="already_member" />);
    await expect(step.getByText(en.refusal('already_member').title)).toBeVisible();
    await expect(step.getByRole('group', { name: en.rolesGroup })).toHaveCount(0);
    await expect(step.getByRole('button', { name: en.send })).toHaveCount(0);
    await expect(step.getByText(en.lasts)).toHaveCount(0);
    await step.getByRole('button', { name: en.differentNumber }).click();
    await expect(step.getByTestId('pressed')).toHaveText('different-number');
    await step.getByRole('button', { name: en.openTeam }).click();
    await expect(step.getByTestId('pressed')).toHaveText('open-team');
  });

  test('at the cap only the banner and Continue setup are left, full width at the large height, and the focus is on it', async ({
    mount,
  }) => {
    const step = await mount(<SetupInviteTeamAsHeld reader="en" refusal="cap" />);
    await expect(step.getByText(en.refusal('cap').title)).toBeVisible();
    await expect(step.getByLabel(en.name)).toHaveCount(0);
    await expect(step.getByRole('button', { name: en.skip })).toHaveCount(0);
    const onward = step.getByRole('button', { name: en.continueSetup });
    await expect(onward).toBeFocused();
    const act = await settledBox(onward);
    expect(act?.width).toBe(375 - 2 * (await resolvedLength(step.page(), '--screen-pad-mobile')));
    expect(act?.height).toBe(await resolvedLength(step.page(), '--sp-12'));
    await onward.click();
    await expect(step.getByTestId('pressed')).toHaveText('skip');
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} nothing scrolls sideways`, async ({ mount, page }) => {
      await mount(<SetupInviteTeamAsHeld reader={reader} />);
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(sideways).toBe(0);
    });
  }
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('the brand pane says what happens after the send, and the form spreads across the task pane', async ({
    mount,
    page,
  }) => {
    const step = await mount(<SetupInviteTeamAsHeld reader="en" />);
    await expect(step.getByText(en.afterYouSend.heading)).toBeVisible();
    const steps = step.getByRole('listitem');
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toContainText(en.afterYouSend.message.title);
    await expect(steps.nth(1)).toContainText(en.afterYouSend.lasts.title);
    await expect(steps.nth(2)).toContainText(en.afterYouSend.join.title);
    await expect(step.getByText(en.lasts)).toHaveCount(0);
    await expect(step.getByText(en.phoneHelper)).toHaveCount(0);

    const name = await settledBox(step.getByLabel(en.name));
    const phone = await settledBox(step.getByLabel(en.phone));
    expect(phone?.y).toBe(name?.y);
    expect(phone?.x).toBeGreaterThan((name?.x ?? 0) + (name?.width ?? 0));

    const heading = await settledBox(step.getByRole('heading', { name: en.title, level: 1 }));
    const send = await settledBox(step.getByRole('button', { name: en.send }));
    const skip = await settledBox(step.getByRole('button', { name: en.skip }));
    expect(send?.x).toBeGreaterThan(skip?.x ?? 0);
    expect((name?.x ?? 0) - (heading?.x ?? 0)).toBeGreaterThan(400);
    expect(Math.round((send?.x ?? 0) + (send?.width ?? 0))).toBe(
      1536 - (await resolvedLength(page, '--sp-16')),
    );
  });
});
