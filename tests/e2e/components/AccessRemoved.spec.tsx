import { accessRemovedWords, createTranslator } from '@heliogrid/i18n';
import { AccessRemoved } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

const en = await createTranslator('en');
const words = accessRemovedWords(en.t, 'Suryodaya Solar');

test('signs out once on a double press', async ({ mount }) => {
  let signOuts = 0;
  const frame = await mount(
    <AccessRemoved
      {...words}
      onAction={() => {
        signOuts += 1;
      }}
      onGrievance={() => undefined}
    />,
  );

  await frame.getByRole('button', { name: words.actionLabel }).dblclick();

  await expect.poll(() => signOuts).toBe(1);
  await expect(frame.getByRole('heading', { name: words.title })).toBeVisible();
});

test('keeps the grievance contact one press away', async ({ mount }) => {
  let opened = 0;
  const frame = await mount(
    <AccessRemoved
      {...words}
      onAction={() => undefined}
      onGrievance={() => {
        opened += 1;
      }}
    />,
  );

  await frame.getByRole('button', { name: words.grievanceLabel }).click();

  await expect.poll(() => opened).toBe(1);
});
