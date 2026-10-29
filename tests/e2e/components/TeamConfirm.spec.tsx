import { ROLE_PRESETS, roleChange, type TeamRow } from '@heliogrid/domain';
import { createTranslator, removeRolesWords, teamActWords } from '@heliogrid/i18n';
import { TeamConfirm } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { TeamConfirmStory } from './TeamConfirm.story';

/* The Team confirm (`SCR-M01-12`): m-deactivate, and m-refused — a write another device made unsafe,
   which the live app reaches only by racing two devices, so its look is proven here (P6s). */
const rajesh: TeamRow = {
  id: 'm-1',
  name: 'Rajesh Kulkarni',
  phoneE164: '+919800000001',
  roles: [],
  status: 'active',
  isViewer: true,
  lastActiveAt: null,
  expiresAt: null,
  inviteDay: null,
};

for (const language of ['en', 'hi', 'mr'] as const) {
  for (const width of [375, 1536]) {
    test(`the refused form in ${language} at ${width}: what stopped it, who changed, the act off with its route out`, async ({
      mount,
      page,
    }) => {
      await page.setViewportSize({ width, height: 812 });
      const { t } = await createTranslator(language);
      const words = teamActWords(t, 'Suryodaya Solar');
      const shown = words.confirm({ kind: 'refused', row: rajesh, lostOwner: 'Meera Iyer' });
      if (shown === null) throw new Error('the refused form has words');
      await mount(<TeamConfirm words={shown} busy={false} onGo={() => {}} onLeave={() => {}} />);

      const dialog = page.getByRole('dialog', { name: shown.title });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(shown.refusal?.title ?? '')).toBeVisible();
      await expect(dialog.getByText(shown.refusal?.body ?? '')).toBeVisible();
      const go = dialog.getByRole('button', { name: shown.go });
      await expect(go).toHaveAttribute('aria-disabled', 'true');
      await expect(go).toHaveAccessibleDescription(shown.goOffReason ?? '');
      // The route out opens in a bubble above the off act, never clipped by the footer.
      await expect(go).toBeInViewport({ ratio: 1 });
      await go.click({ force: true });
      const reason = page.getByRole('dialog', { name: shown.goOffReason });
      await expect(reason).toBeVisible();
      // Seen, not just laid out: the point at the bubble's middle is the bubble, not what clips it.
      const seen = await reason.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return top !== null && node.contains(top);
      });
      expect(seen).toBe(true);
      await expect(dialog.getByRole('button', { name: shown.leave })).toBeVisible();
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(sideways).toBe(false);
    });
  }
}

test('Cancel shuts the confirm and gives focus back to the act that opened it (AC-21)', async ({
  mount,
  page,
}) => {
  const { t } = await createTranslator('en');
  const words = teamActWords(t, 'Suryodaya Solar');
  const shown = words.confirm({ kind: 'asking', act: 'deactivate', row: rajesh });
  if (shown === null) throw new Error('an open confirm has words');
  await mount(<TeamConfirmStory act={words.act('deactivate')} words={shown} />);

  const opener = page.getByRole('button', { name: words.act('deactivate') });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: shown.title });
  await expect(dialog.getByText(shown.body ?? '')).toBeVisible();
  await dialog.getByRole('button', { name: shown.leave }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

const [, , , SURVEY, DESIGN, , , INSTALL] = ROLE_PRESETS;

for (const language of ['en', 'hi', 'mr'] as const) {
  for (const width of [375, 1536]) {
    test(`a roles removal in ${language} at ${width}: the handle, a md modal with no tone, the body and the bold way back (AC-23)`, async ({
      mount,
      page,
    }) => {
      await page.setViewportSize({ width, height: 812 });
      const { t } = await createTranslator(language);
      const shown = removeRolesWords(t, {
        name: 'Vikram Deshpande',
        change: roleChange([SURVEY, DESIGN, INSTALL], [SURVEY, INSTALL]),
      });
      await mount(
        <TeamConfirm words={shown} look="roles" busy={false} onGo={() => {}} onLeave={() => {}} />,
      );

      const dialog = page.getByRole('dialog', { name: shown.title });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(shown.body ?? '')).toBeVisible();
      const lead = dialog.getByText(shown.note.lead, { exact: true });
      await expect(lead).toBeVisible();
      expect(
        Number(await lead.evaluate((node) => getComputedStyle(node).fontWeight)),
      ).toBeGreaterThanOrEqual(600);
      await expect(dialog.getByText(shown.note.rest.trim())).toBeVisible();
      await expect(dialog.getByRole('button', { name: shown.go })).toBeEnabled();
      await expect(dialog.getByRole('button', { name: shown.leave })).toBeVisible();
      if (width === 375) {
        await expect(page.locator('.hg-sheet-handle')).toBeVisible();
      } else {
        await expect(dialog).toHaveAttribute('data-size', 'md');
        await expect(dialog.locator('.hg-modal-mark')).toHaveCount(0);
      }
      // Not dismissible: Escape leaves the decision standing.
      await page.keyboard.press('Escape');
      await expect(dialog).toBeVisible();
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(sideways).toBe(false);
    });
  }
}

test('a Team act keeps its look: no handle, a danger sm modal (AC-23)', async ({ mount, page }) => {
  const { t } = await createTranslator('en');
  const shown = teamActWords(t, 'Suryodaya Solar').confirm({
    kind: 'asking',
    act: 'deactivate',
    row: rajesh,
  });
  if (shown === null) throw new Error('an open confirm has words');
  await page.setViewportSize({ width: 375, height: 812 });
  await mount(<TeamConfirm words={shown} busy={false} onGo={() => {}} onLeave={() => {}} />);
  await expect(page.getByRole('dialog', { name: shown.title })).toBeVisible();
  await expect(page.locator('.hg-sheet-handle')).toHaveCount(0);
  await page.setViewportSize({ width: 1536, height: 812 });
  await expect(page.getByRole('dialog', { name: shown.title })).toHaveAttribute('data-size', 'sm');
});
