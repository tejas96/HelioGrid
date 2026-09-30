import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { OptionCardGroup } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const bySms = en.t(SIGN_IN.sendCode);
const byCall = en.t(SIGN_IN.getCodeByCall);
const lockedReason = en.t(SIGN_IN.lockedResendReason);

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

  await expect(selected).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--canvas-sunken'),
  );
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
