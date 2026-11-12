import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Radio } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectTouchFloor } from '../support/touch-target';

const en = await createTranslator('en');
const label = en.t(SIGN_IN.tryAgain);

test('the real radio fills its 44 target, so a press on the control itself chooses it', async ({
  mount,
  page,
}) => {
  let chosen = 0;
  await mount(<Radio name="choice" value="one" label={label} onChange={() => chosen++} />);
  const radio = page.getByRole('radio', { name: label });
  await expectTouchFloor([radio]);
  await radio.click();
  await expect.poll(() => chosen).toBe(1);
});
