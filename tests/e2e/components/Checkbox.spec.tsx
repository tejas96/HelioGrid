import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Checkbox } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectTouchFloor } from '../support/touch-target';

const en = await createTranslator('en');
const label = en.t(SIGN_IN.tryAgain);

test('the real checkbox fills its 44 target, so a press on the control itself ticks it', async ({
  mount,
  page,
}) => {
  let ticked = 0;
  await mount(<Checkbox label={label} onChange={() => ticked++} />);
  const checkbox = page.getByRole('checkbox', { name: label });
  await expectTouchFloor([checkbox]);
  await checkbox.click();
  await expect.poll(() => ticked).toBe(1);
});
