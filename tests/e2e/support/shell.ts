import { firstRunMarkWords, SHELL, type Translator } from '@heliogrid/i18n';
import type { Page } from '@playwright/test';

/** A new owner's one first-run mark, on the verb: its own Got it passes it, for good. */
export async function passTheOwnersMark(page: Page, t: Translator): Promise<void> {
  const mark = firstRunMarkWords(t.t, 'centre-action', 'epc_owner', 'add_lead');
  // The mark hides before the server stores the pass; a caller that reloads or leaves before the
  // save lands aborts it, and the mark comes back. So this returns only once the count is stored.
  const stored = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' && response.url().endsWith('/tenants/me/membership'),
  );
  await page
    .getByRole('group', { name: mark?.title ?? '' })
    .getByRole('button', { name: t.t(SHELL.gotIt) })
    .last()
    .click();
  await stored;
}
