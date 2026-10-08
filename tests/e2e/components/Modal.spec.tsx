import { createTranslator, SHELL } from '@heliogrid/i18n';
import { Modal } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { animationsSettled } from '../support/motion';

const en = await createTranslator('en');
const hi = await createTranslator('hi');

for (const density of ['expressive', 'functional'] as const) {
  test(`a ${density} body with no footer keeps the panel's padding under its last line`, async ({
    mount,
    page,
  }) => {
    await mount(
      <Modal
        open
        closeLabel={en.t(SHELL.close)}
        title={en.t(SHELL.grievanceOfficer)}
        density={density}
        size="sm"
      >
        <p style={{ margin: 0 }}>{en.t(SHELL.grievanceNotPublished)}</p>
      </Modal>,
    );
    await animationsSettled(page);
    const dialog = page.getByRole('dialog');
    const lastLine = await dialog.getByText(en.t(SHELL.grievanceNotPublished)).boundingBox();
    const panel = await dialog.boundingBox();
    const sidePadding = await dialog.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--hg-modal-pad'),
    );

    expect(lastLine).not.toBeNull();
    expect(panel).not.toBeNull();
    if (lastLine === null || panel === null) return;
    expect(panel.y + panel.height - (lastLine.y + lastLine.height)).toBeCloseTo(
      Number.parseFloat(sidePadding),
      0,
    );
  });
}

test("the close is named in the reader's language", async ({ mount, page }) => {
  await mount(
    <Modal open closeLabel={hi.t(SHELL.close)} title={hi.t(SHELL.grievanceOfficer)} size="sm">
      <p>{hi.t(SHELL.grievanceNotPublished)}</p>
    </Modal>,
  );
  await expect(
    page.getByRole('dialog').getByRole('button', { name: hi.t(SHELL.close), exact: true }),
  ).toBeVisible();
});
