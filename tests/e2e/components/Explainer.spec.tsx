import { createTranslator, SIGN_IN, teamActWords } from '@heliogrid/i18n';
import { Button } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { ReactElement } from 'react';

/* A disabled act's reason opens in the Explainer bubble, the act itself its trigger (D264,
   design-system changes 5 and 6). The bubble is the one non-modal dialog the reason names. The act
   is `aria-disabled`, which Playwright refuses to click, while a person's tap still lands on it, so
   each click on it is forced. */
const en = await createTranslator('en');
const team = teamActWords(en.t, 'Suryodaya Solar');
const deactivate = team.act('deactivate');
const elsewhere = en.t(SIGN_IN.tryAgain);

async function mountOff(mount: (component: ReactElement) => Promise<unknown>): Promise<void> {
  await mount(
    <div style={{ padding: 120 }}>
      <Button variant="secondary" tone="danger" disabled disabledReason={team.onlyOwner}>
        {deactivate}
      </Button>
      <Button variant="ghost">{elsewhere}</Button>
    </div>,
  );
}

const bubble = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog', { name: team.onlyOwner });

test('a tap on the off act opens its reason, and a second tap closes it', async ({
  mount,
  page,
}) => {
  await mountOff(mount);
  const act = page.getByRole('button', { name: deactivate });

  await act.click({ force: true });
  await expect(bubble(page)).toBeVisible();
  await expect(bubble(page)).toContainText(team.onlyOwner);
  await expect(act).toHaveAttribute('aria-expanded', 'true');
  await act.click({ force: true });
  await expect(bubble(page)).toBeHidden();
});

test('keyboard focus opens the reason, and Escape closes it with focus kept on the act', async ({
  mount,
  page,
}) => {
  await mountOff(mount);
  const act = page.getByRole('button', { name: deactivate });

  await page.keyboard.press('Tab');
  await expect(act).toBeFocused();
  await expect(bubble(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(bubble(page)).toBeHidden();
  await expect(act).toBeFocused();
});

test('a reason hover opened stays open after a click, and a tap outside closes it', async ({
  mount,
  page,
}) => {
  await mountOff(mount);
  const act = page.getByRole('button', { name: deactivate });

  await act.hover();
  await expect(bubble(page)).toBeVisible();
  await act.click({ force: true });
  await page.mouse.move(0, 0);
  await expect(bubble(page)).toBeVisible();
  await page.getByRole('button', { name: elsewhere }).click();
  await expect(bubble(page)).toBeHidden();
});

test('scrolling the act away closes its reason', async ({ mount, page }) => {
  await mount(
    <div style={{ height: 2400, paddingTop: 200 }}>
      <Button variant="secondary" tone="danger" disabled disabledReason={team.onlyOwner}>
        {deactivate}
      </Button>
    </div>,
  );
  await page.getByRole('button', { name: deactivate }).click({ force: true });
  await expect(bubble(page)).toBeVisible();
  await page.mouse.wheel(0, 1600);
  await expect(bubble(page)).toBeHidden();
});
