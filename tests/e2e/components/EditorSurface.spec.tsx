import { createTranslator, SHELL } from '@heliogrid/i18n';
import { EditorSurface } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

const en = await createTranslator('en');

/**
 * `SCR-M01-18`'s *Open full size* (m18-f, d18-i) with reduced motion on: the sheet at 375 and the
 * side panel at 1536 open at their end state at once — no motion the person waits through.
 */
for (const width of [
  { name: '375', viewport: { width: 375, height: 812 } },
  { name: '1536', viewport: { width: 1536, height: 960 } },
]) {
  test.describe(`at ${width.name}`, () => {
    test.use({ viewport: width.viewport });

    test('the sheet and the panel open at their end state', async ({ mount, page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await mount(
        <EditorSurface
          open
          closeLabel={en.t(SHELL.close)}
          showClose
          size="full"
          width={720}
          panelProps={{ modal: false }}
          title={en.t(SHELL.grievanceOfficer)}
          density="functional"
        >
          <p>{en.t(SHELL.grievanceNotPublished)}</p>
        </EditorSurface>,
      );
      await expect(page.getByText(en.t(SHELL.grievanceNotPublished))).toBeVisible();
      const longest = await page.evaluate(() =>
        Math.max(
          0,
          ...document
            .getAnimations()
            .map((motion) => Number(motion.effect?.getTiming().duration ?? 0)),
        ),
      );
      expect(longest).toBeLessThanOrEqual(1);
    });
  });
}

/**
 * A decision's centred form at 1536 draws its read's states as the sheet does: the wait while it
 * loads, and the failure with *Try again* — never a blank dialog.
 */
test.describe('a decision at 1536 with a read', () => {
  test.use({ viewport: { width: 1536, height: 960 } });
  const words = {
    loadingLabel: en.t(SHELL.grievanceOfficer),
    errorTitle: en.t(SHELL.couldNotLoad),
    retryLabel: en.t(SHELL.tryAgain),
  };

  test('loading shows its wait, failed its Try again', async ({ mount, page }) => {
    const frame = await mount(
      <EditorSurface
        open
        desktop="modal"
        closeLabel={en.t(SHELL.close)}
        title={en.t(SHELL.grievanceOfficer)}
        read={{ kind: 'loading' as const }}
        {...words}
      >
        <p>{en.t(SHELL.grievanceNotPublished)}</p>
      </EditorSurface>,
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('status', { name: words.loadingLabel })).toBeVisible();
    await expect(dialog.getByText(en.t(SHELL.grievanceNotPublished))).toHaveCount(0);
    await frame.update(
      <EditorSurface
        open
        desktop="modal"
        closeLabel={en.t(SHELL.close)}
        title={en.t(SHELL.grievanceOfficer)}
        read={{ kind: 'failed' as const, retry: () => undefined }}
        {...words}
      >
        <p>{en.t(SHELL.grievanceNotPublished)}</p>
      </EditorSurface>,
    );
    await expect(dialog.getByText(words.errorTitle)).toBeVisible();
    await expect(dialog.getByRole('button', { name: words.retryLabel })).toBeVisible();
  });
});
