import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { OptionCardGroup } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { MultipleStory } from './OptionCardGroup.story';

const en = await createTranslator('en');
const bySms = en.t(SIGN_IN.sendCode);
const byCall = en.t(SIGN_IN.getCodeByCall);
const lockedReason = en.t(SIGN_IN.authErrorFoot);

const options = [
  { value: 'sms', title: bySms },
  { value: 'call', title: byCall },
];

test('every available option is a grey tile with no shadow, the selected one ringed in the accent', async ({
  mount,
  page,
}) => {
  const group = await mount(<OptionCardGroup options={options} value="sms" />);
  const selected = group.getByRole('radio', { name: bySms });
  const unselected = group.getByRole('radio', { name: byCall });

  await expect(selected).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(selected).toHaveCSS(
    'box-shadow',
    `${await resolvedColour(page, '--accent')} 0px 0px 0px 2px`,
  );
  await expect(unselected).toHaveCSS('box-shadow', 'none');
  await expect(unselected.locator('.hg-option-card-dot')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
});

test('an off option lies on the page, apart from the grey tiles', async ({ mount, page }) => {
  const group = await mount(
    <OptionCardGroup
      options={[
        { value: 'sms', title: bySms },
        { value: 'call', title: byCall, disabled: true, disabledReason: lockedReason },
      ]}
      value="sms"
    />,
  );
  const off = group.getByRole('radio', { name: byCall });

  await expect(off).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(off).toHaveCSS('box-shadow', 'none');
  await expect(off).toContainText(lockedReason);
  await expect(off.locator('.hg-option-card-dot')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--hg-ground'),
  );
});

test('multiple toggles by click and Space: each option is a checkbox, its own tab stop, a square mark', async ({
  mount,
  page,
}) => {
  const group = await mount(<MultipleStory options={options} label={bySms} start={['call']} />);
  const first = group.getByRole('checkbox', { name: bySms });
  const second = group.getByRole('checkbox', { name: byCall });

  await expect(group.getByRole('group', { name: bySms })).toBeVisible();
  await expect(first).toHaveAttribute('aria-checked', 'false');
  await expect(second).toHaveAttribute('aria-checked', 'true');
  await expect(second).toHaveCSS(
    'box-shadow',
    `${await resolvedColour(page, '--accent')} 0px 0px 0px 2px`,
  );
  await expect(second.locator('.hg-option-card-dot')).toHaveCSS('border-radius', '6px');

  await first.click();
  await expect(group.getByTestId('picked')).toHaveText('call,sms');
  await second.focus();
  await page.keyboard.press('Space');
  await expect(group.getByTestId('picked')).toHaveText('sms');
  await expect(second).toHaveAttribute('aria-checked', 'false');
  await expect(first).toHaveAttribute('tabindex', '0');
  await expect(second).toHaveAttribute('tabindex', '0');
});

test('the single mode is unchanged: a radiogroup with one tab stop', async ({ mount }) => {
  const group = await mount(<OptionCardGroup options={options} value="call" label={bySms} />);
  await expect(group.getByRole('radiogroup', { name: bySms })).toBeVisible();
  await expect(group.getByRole('radio', { name: bySms })).toHaveAttribute('tabindex', '-1');
  await expect(group.getByRole('radio', { name: byCall })).toHaveAttribute('tabindex', '0');
});
