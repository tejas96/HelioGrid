import { accessRemovedWords, createTranslator } from '@heliogrid/i18n';
import { AccessRemoved } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

const en = await createTranslator('en');
const words = accessRemovedWords(en.t, 'Suryodaya Solar');

test('a sign-out that is out turns the action off, keeping its name', async ({ mount }) => {
  const frame = await mount(
    <AccessRemoved {...words} onAction={() => undefined} pending onGrievance={() => undefined} />,
  );

  await expect(frame.getByRole('button', { name: words.actionLabel })).toBeDisabled();
  await expect(frame.getByRole('heading', { name: words.title })).toBeVisible();
});

test('keeps the grievance contact one press away', async ({ mount }) => {
  let opened = 0;
  const frame = await mount(
    <AccessRemoved
      {...words}
      onAction={() => undefined}
      pending={false}
      onGrievance={() => {
        opened += 1;
      }}
    />,
  );

  await frame.getByRole('button', { name: words.grievanceLabel }).click();

  await expect.poll(() => opened).toBe(1);
});
