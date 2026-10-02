import { HOME_LADDER } from '@heliogrid/domain';
import { createTranslator, homeHeadWords, todayLine } from '@heliogrid/i18n';
import { HomeHead } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

const en = await createTranslator('en');
const [OWNER, MANAGER] = HOME_LADDER;
const head = homeHeadWords(en.t, OWNER, [OWNER, MANAGER]);
const dateLine = todayLine(en.t, '2 Oct 2026');

test('the title is the switcher, each home with its preset, the one in force ticked', async ({
  mount,
  page,
}) => {
  const chosen: string[] = [];
  const band = await mount(
    <HomeHead
      {...head}
      dateLine={dateLine}
      switcherWidth={284}
      entries={head.entries.map((entry) => ({
        ...entry,
        key: entry.preset,
        onSelect: () => {
          chosen.push(entry.preset);
        },
      }))}
    />,
  );

  await expect(band.getByText(dateLine)).toBeVisible();
  await expect(band.getByText(head.presetLine)).toBeVisible();
  await band.getByRole('button', { name: head.switchName }).click();
  const [own, other] = head.entries;
  await expect(
    page.getByRole('menuitemradio', { name: `${own?.label} ${own?.meta}` }),
  ).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('menuitemradio', { name: `${other?.label} ${other?.meta}` }).click();
  await expect.poll(() => chosen).toEqual([other?.preset]);
});
