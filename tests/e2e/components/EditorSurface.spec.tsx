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
