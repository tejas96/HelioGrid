import { COMPANY_SIGNUP, createTranslator, PROFILE_PREFERENCES } from '@heliogrid/i18n';
import { ReorderList } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { bottomOf, rightOf } from '../support/layout';
import { resolvedColour } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { FootReorderStory } from './ReorderList.story';

const en = await createTranslator('en');
const items = [en.t(COMPANY_SIGNUP.companyName), en.t(COMPANY_SIGNUP.city)];
const phases = [...items, en.t(COMPANY_SIGNUP.companyNameExample)];
const editLabel = en.t(PROFILE_PREFERENCES.editName);
const [first = '', second = ''] = phases;

/* ReorderList still says its own English sentences (deferred D2), so these mirror
   `ReorderList.defaults.ts` until the component takes its words from the catalog. */
const isFirstLabel = (name: string) => `${name} is first`;
const alreadyFirst = (name: string) => `${name} is already first.`;
const movedTo = (name: string, to: number, total: number) =>
  `${name} moved to position ${to} of ${total}.`;

/* A row's own controls are ghost arrows with no fill of their own, so there is no white control to
   read here: the row's grey and its flat rest are the whole of the tile. */
test('a reorder row is a grey tile with no shadow', async ({ mount, page }) => {
  const list = await mount(<ReorderList items={items} />);
  const row = list.getByRole('listitem').first();

  await expect(row).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(row).toHaveCSS('box-shadow', 'none');
});

test.describe('controls at the foot, at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the controls sit at the row's foot", async ({ mount }) => {
    const list = await mount(<FootReorderStory names={phases} actionLabel={editLabel} />);
    const row = list.getByRole('listitem').first();
    const body = row.locator('.hg-reorder-body');
    const buttons = row.getByRole('button');
    const up = buttons.nth(1);
    const remove = buttons.last();

    await expectTouchFloor([up, buttons.nth(2), remove]);
    // The line sits under the body …
    expect((await up.boundingBox())?.y).toBeGreaterThanOrEqual(await bottomOf(body));
    // … ends where the body ends, so the body has the row's whole width beside the digit …
    expect(Math.abs((await rightOf(remove)) - (await rightOf(body)))).toBeLessThanOrEqual(1);
    // … and the three targets share that one line, in order.
    const ys = await Promise.all(
      [up, buttons.nth(2), remove].map(async (target) => (await target.boundingBox())?.y),
    );
    expect(new Set(ys).size).toBe(1);
    expect((await up.boundingBox())?.x ?? 0).toBeLessThan((await remove.boundingBox())?.x ?? 0);
  });

  test("the row's own act starts the line", async ({ mount, page }) => {
    const list = await mount(<FootReorderStory names={phases} actionLabel={editLabel} />);
    const row = list.getByRole('listitem').first();
    const action = row.getByRole('button', { name: editLabel, exact: true });
    const up = row.getByRole('button', { name: isFirstLabel(first), exact: true });

    const actionBox = await action.boundingBox();
    const upBox = await up.boundingBox();
    expect(actionBox?.x ?? Infinity).toBeLessThan(upBox?.x ?? 0);
    // One line: the pencil and ⌃ share a centre.
    const centre = (box: typeof upBox) => (box ? box.y + box.height / 2 : Infinity);
    expect(Math.abs(centre(actionBox) - centre(upBox))).toBeLessThanOrEqual(1);

    await action.focus();
    await page.keyboard.press('Tab');
    await expect(up).toBeFocused();
  });

  test("the first row's up says it is already first", async ({ mount, page }) => {
    const list = await mount(<FootReorderStory names={phases} actionLabel={editLabel} />);
    const up = list
      .getByRole('listitem')
      .first()
      .getByRole('button', { name: isFirstLabel(first), exact: true });

    await expect(up).toHaveAttribute('aria-disabled', 'true');
    // Playwright will not click an aria-disabled control; a keyboard user still presses it.
    await up.focus();
    await page.keyboard.press('Enter');
    await expect(list.getByRole('status')).toHaveText(alreadyFirst(first));
    await expect(list.getByRole('listitem').first()).toContainText(first);
  });

  test('a move is announced', async ({ mount }) => {
    const list = await mount(<FootReorderStory names={phases} actionLabel={editLabel} />);
    const down = list.getByRole('listitem').first().getByRole('button').nth(2);

    await down.click();
    await expect(list.getByRole('status')).toHaveText(movedTo(first, 2, phases.length));
    await expect(list.getByRole('listitem').first()).toContainText(second);
    await expect(list.getByRole('listitem').nth(1)).toContainText(first);
  });
});
